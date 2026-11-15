package com.mangsang.app.core

import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * 골방 마침 모델. 사용자에게 "마치겠습니까?"를 묻지 않고, 끝날 준비가 된 정도 p를 추정해
 * 단계별로 문을 조금씩 연다. 설계와 수식은 docs/journey/마침_모델.md.
 *
 * 상태는 두 개(아직 머묾 / 준비됨)이고 준비됨은 흡수 상태다. 시간이 지나면 로그정규 해저드만큼
 * 준비됨으로 넘어가고, 차량 신호가 들어오면 오즈에 우도비를 곱한다(2상태 전방 필터).
 * 신호가 하나도 없으면 p(t)는 정확히 로그정규 누적분포 F(t)와 같다.
 */

/** 세션 시작 때 아는 것. 시각은 0~23. */
data class EndingContext(
    val intendedSec: Int,
    val driveMin: Int = 30,
    val hour: Int = 12,
)

/**
 * 개인화 사전분포: 로그 잔차 δ = ln(실제 준비 시각) - ln(기준 시각)에 대한 정규-역감마(m, κ, α, β).
 * 기본값은 E[σ²] = 0.18² [가정]. 기기 안에만 저장한다.
 */
data class EndingPrior(
    val m: Double = 0.0,
    val kappa: Double = 2.0,
    val alpha: Double = 3.0,
    val beta: Double = 0.18 * 0.18 * 2.0,
) {
    /** 예측분포(스튜던트 t)의 척도. 정규 근사로 쓴다. */
    val predictiveSigma: Double get() = sqrt(beta * (kappa + 1) / (alpha * kappa))

    /** 세션 하나를 관측한 뒤의 공액 갱신. 중단(기어 이탈·전화)된 세션은 넣지 않는다. */
    fun update(ctx: EndingContext, readySec: Double): EndingPrior {
        val x = ln(readySec) - ln(EndingPolicy.baselineSec(ctx))
        val k1 = kappa + 1
        return EndingPrior(
            m = (kappa * m + x) / k1,
            kappa = k1,
            alpha = alpha + 0.5,
            beta = beta + kappa * (x - m) * (x - m) / (2 * k1),
        )
    }
}

/** 차량·화면에서 읽을 수 있는 신호와 초기 우도비 [가정]. 1보다 크면 "준비됨" 쪽 증거. */
enum class EndingSignal(val likelihoodRatio: Double) {
    SCREEN_TOUCH(3.0),
    SEAT_BACKREST_FORWARD(6.0),
    SEAT_BACKREST_BACK(0.3),
    SEATBELT_FASTENED(8.0),
    SEATBELT_UNFASTENED(0.5),
    HEADLAMP_ON(5.0),
    HVAC_MANUAL(2.0),
    WINDOW_MANUAL(2.5),
    BRAKE_PRESSED(10.0),
    TURN_SIGNAL(10.0),
}

/** 단계는 순서대로 쌓인다. 각 단계의 실제 출력(빛 +2%/분 등)은 앱이 맡는다. */
enum class EndingStage { STAY, LIGHT_RISE, SOUND_FADE, CLOSING_WORDS }

/**
 * 일찍 끊는 비용 / 늦게 끊는 비용 비율로 단계 문턱을 정한다: p* = c / (c + 1).
 * 기본 1, 7/3, 17/3 → 0.5, 0.7, 0.85 [가정].
 */
data class EndingCosts(
    val lightEarly: Double = 1.0,
    val soundEarly: Double = 7.0 / 3.0,
    val wordsEarly: Double = 17.0 / 3.0,
    val late: Double = 1.0,
) {
    fun thresholds() = listOf(lightEarly, soundEarly, wordsEarly).map { it / (it + late) }
}

class EndingPolicy(
    private val ctx: EndingContext,
    prior: EndingPrior = EndingPrior(),
    costs: EndingCosts = EndingCosts(),
    private val hysteresis: Double = 0.10,
    private val hardCapSec: Int = 30 * 60,
) {
    private val mu = ln(baselineSec(ctx)) + prior.m
    private val sigma = prior.predictiveSigma
    private val up = costs.thresholds()

    var p = 0.0
        private set
    var stage = EndingStage.STAY
        private set
    private var lastT = 0.0

    /** 경과 시간 t초로 앞으로 민다. 시간이 거꾸로 오면 무시한다. */
    fun tick(tSec: Double): EndingStage {
        if (tSec <= lastT) return stage
        if (tSec >= hardCapSec) {
            p = 1.0
        } else {
            val f0 = cdf(lastT)
            val h = if (f0 >= 1.0) 1.0 else (cdf(tSec) - f0) / (1.0 - f0)
            p += (1.0 - p) * h
        }
        lastT = tSec
        return restage()
    }

    /** 지금 시각(마지막 tick)에 들어온 신호 하나를 반영한다. */
    fun observe(signal: EndingSignal): EndingStage {
        if (p >= 1.0 && lastT >= hardCapSec) return stage
        val odds = p / (1.0 - p) * signal.likelihoodRatio
        p = min(odds / (1.0 + odds), 1.0 - 1e-9)
        return restage()
    }

    /** 오를 때는 문턱, 내릴 때는 문턱 - 히스테리시스. 빛이 깜빡이지 않게. */
    private fun restage(): EndingStage {
        var level = stage.ordinal
        while (level < up.size && p > up[level]) level++
        while (level > 0 && p < up[level - 1] - hysteresis) level--
        stage = EndingStage.entries[level]
        return stage
    }

    private fun cdf(tSec: Double): Double =
        if (tSec <= 0) 0.0 else normalCdf((ln(tSec) - mu) / sigma)

    companion object {
        /** 돌아옴 단계 길이. 준비 시각 = 세션 의향 - 돌아옴 [가정]. */
        const val RETURN_SEC = 90

        /** 맥락 공변량: 운전 30분 기준 로그 탄력 0.10, 22~05시 -10% [가정]. */
        fun baselineSec(ctx: EndingContext): Double {
            val base = max(60, ctx.intendedSec - RETURN_SEC).toDouble()
            val drive = 0.10 * ln(max(ctx.driveMin, 1) / 30.0)
            val late = if (ctx.hour >= 22 || ctx.hour < 5) -0.10 else 0.0
            return base * exp(drive + late)
        }

        /** Abramowitz-Stegun 7.1.26, 오차 1.5e-7. 표준 라이브러리에 erf가 없다. */
        fun normalCdf(z: Double): Double {
            val x = abs(z) / sqrt(2.0)
            val t = 1.0 / (1.0 + 0.3275911 * x)
            val y = 1.0 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * exp(-x * x)
            return if (z >= 0) 0.5 * (1.0 + y) else 0.5 * (1.0 - y)
        }
    }
}
