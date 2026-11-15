package com.mangsang.app.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class EndingPolicyTest {
    // 시나리오 A: 15분 의향, 40분 운전, 21시
    private val ctxA = EndingContext(intendedSec = 900, driveMin = 40, hour = 21)

    private fun firstCrossing(policy: EndingPolicy, threshold: Double): Int {
        for (t in 1..1800) {
            policy.tick(t.toDouble())
            if (policy.p > threshold) return t
        }
        return -1
    }

    @Test fun withoutSignalsClosingWordsComeNearIntendedLength() {
        val t = firstCrossing(EndingPolicy(ctxA), 0.85)
        // 신호가 없으면 의향(900초)보다 조금 늦게, 30% 안쪽에서 닫는다 (늦게 끊는 쪽이 싸다)
        assertTrue("crossed at $t", t in 900..1170)
    }

    @Test fun withoutSignalsPEqualsLognormalCdf() {
        val policy = EndingPolicy(ctxA)
        for (t in 1..900) policy.tick(t.toDouble())
        val median = EndingPolicy.baselineSec(ctxA)
        val z = (kotlin.math.ln(900.0) - kotlin.math.ln(median)) / EndingPrior().predictiveSigma
        assertEquals(EndingPolicy.normalCdf(z), policy.p, 1e-9)
    }

    @Test fun counterSignalLowersPAndStepsBack() {
        val policy = EndingPolicy(ctxA)
        firstCrossing(policy, 0.86)
        assertEquals(EndingStage.CLOSING_WORDS, policy.stage)
        val before = policy.p
        policy.observe(EndingSignal.SEAT_BACKREST_BACK)
        assertTrue(policy.p < before)
        assertTrue(policy.stage < EndingStage.CLOSING_WORDS)
    }

    @Test fun hysteresisKeepsStageOnSmallDrop() {
        val policy = EndingPolicy(ctxA)
        firstCrossing(policy, 0.52)
        assertEquals(EndingStage.LIGHT_RISE, policy.stage)
        policy.observe(EndingSignal.SEATBELT_UNFASTENED) // 0.52 -> 약 0.35, 문턱 0.5 - 0.1 = 0.4 아래
        assertEquals(EndingStage.STAY, policy.stage)
        val p2 = EndingPolicy(ctxA)
        firstCrossing(p2, 0.52)
        p2.observe(EndingSignal.HVAC_MANUAL)
        p2.observe(EndingSignal.SEATBELT_UNFASTENED) // 0.52 -> 약 0.52, 그대로
        assertEquals(EndingStage.LIGHT_RISE, p2.stage)
    }

    @Test fun earlySignalsCannotEndSession() {
        val policy = EndingPolicy(ctxA)
        policy.tick(120.0)
        repeat(3) { policy.observe(EndingSignal.SEATBELT_FASTENED) }
        policy.observe(EndingSignal.SCREEN_TOUCH)
        assertEquals(EndingStage.STAY, policy.stage)
    }

    @Test fun lateSignalsCloseSooner() {
        val quiet = firstCrossing(EndingPolicy(ctxA), 0.85)
        val stirring = EndingPolicy(ctxA)
        for (t in 1..780) stirring.tick(t.toDouble())
        stirring.observe(EndingSignal.SEAT_BACKREST_FORWARD)
        var t = 780
        while (stirring.p <= 0.85) stirring.tick((++t).toDouble())
        assertTrue("stirring $t vs quiet $quiet", t < quiet - 60)
    }

    @Test fun asymmetricCostsGiveRisingThresholds() {
        val th = EndingCosts().thresholds()
        assertEquals(listOf(0.5, 0.7, 0.85), th.map { Math.round(it * 100) / 100.0 })
        // 일찍 끊는 비용을 키우면 문턱이 오른다
        assertTrue(EndingCosts(wordsEarly = 9.0).thresholds()[2] > th[2])
    }

    @Test fun personalizationMovesMedianTowardObservedSessions() {
        var prior = EndingPrior()
        repeat(5) { prior = prior.update(ctxA, 600.0) } // 늘 10분에 준비됨
        assertTrue(prior.m < -0.2)
        val personal = firstCrossing(EndingPolicy(ctxA, prior), 0.5)
        val generic = firstCrossing(EndingPolicy(ctxA), 0.5)
        assertTrue("personal $personal vs generic $generic", personal < generic - 120)
    }

    @Test fun updateWithPriorMeanKeepsMeanAndShrinksUncertainty() {
        val prior = EndingPrior()
        val next = prior.update(ctxA, EndingPolicy.baselineSec(ctxA))
        assertEquals(0.0, next.m, 1e-12)
        assertEquals(3.0, next.kappa, 0.0)
        assertTrue(next.predictiveSigma < prior.predictiveSigma)
    }

    @Test fun boundaries() {
        val policy = EndingPolicy(ctxA)
        assertEquals(EndingStage.STAY, policy.tick(0.0))
        policy.observe(EndingSignal.BRAKE_PRESSED)
        assertEquals(0.0, policy.p, 0.0) // t=0에서는 어떤 신호도 p를 못 올린다
        policy.tick(300.0)
        val p = policy.p
        policy.tick(200.0) // 시간 역행 무시
        assertEquals(p, policy.p, 0.0)
        assertEquals(EndingStage.CLOSING_WORDS, policy.tick(1800.0)) // 상한 30분
        assertEquals(1.0, policy.p, 0.0)
        // 아주 짧은 의향도 60초 아래로 내려가지 않는다
        assertEquals(60.0, EndingPolicy.baselineSec(EndingContext(intendedSec = 30)), 1e-9)
    }
}
