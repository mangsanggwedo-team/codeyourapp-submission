package com.mangsang.app.core

/** 차 안의 세 순간. 화면과 음성 규칙은 DESIGN.md 1절, 한도는 SAFETY.md. */
enum class Moment { PARKED, STOPPED, DRIVING }

enum class Gear { P, R, N, D }

/** 앱이 판단에 쓰는 차량 신호. null = 아직 못 받음. */
data class VehicleSnapshot(
    val gear: Gear? = null,
    val moving: Boolean? = null,
)

object MomentDetector {
    /**
     * 신호를 하나라도 못 받았으면 주행 중으로 간주한다(안전 쪽 기본값, SAFETY 1절).
     * 후진(R)은 주변을 봐야 하므로 주행과 같은 제한을 건다.
     */
    fun detect(s: VehicleSnapshot): Moment = when {
        s.gear == null || s.moving == null -> Moment.DRIVING
        s.gear == Gear.P -> Moment.PARKED
        s.gear == Gear.R || s.moving -> Moment.DRIVING
        else -> Moment.STOPPED
    }
}
