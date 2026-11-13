package com.mangsang.app.data

import ai.pleos.playground.vehicle.Vehicle
import android.content.Context
import android.util.Log

/**
 * 제어 가능 여부 점검용. `adb shell am start -n com.mangsang.app/.MainActivity --ez probe true`로만 실행.
 * 실내 무드등 밝기를 바꿔 보고 결과를 로그(MangsangProbe)에 남긴다. 아이디어가 정해지면 지운다.
 */
object ControlProbe {
    fun run(context: Context) {
        val v = Vehicle(context.applicationContext)
        runCatching {
            v.initialize()
            val light = v.getLight()
            // 지원 구역을 먼저 묻고(설명회 API policy), 첫 구역에 적용한다.
            light.checkAmbientLightBrightnessCapabilities({ cfg, areas ->
                Log.i(TAG, "capability: $cfg areas=${areas.keys}")
                val area = areas.keys.firstOrNull() ?: return@checkAmbientLightBrightnessCapabilities
                light.setAmbientLightBrightness(area, 30,
                    { a, value -> Log.i(TAG, "ambient brightness set: $a=$value") },
                    { e -> Log.w(TAG, "ambient brightness failed", e) })
            }, { e -> Log.w(TAG, "capability failed", e) })
        }.onFailure { Log.w(TAG, "probe failed", it) }
    }

    private const val TAG = "MangsangProbe"
}
