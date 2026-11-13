package com.mangsang.app.data

import ai.pleos.playground.vehicle.Vehicle
import ai.pleos.playground.vehicle.constant.control.VehicleGear
import ai.pleos.playground.vehicle.listener.GearSelectionListener
import android.content.Context
import android.util.Log
import com.mangsang.app.core.Gear
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/** Pleos Vehicle SDK 2.3.2 기어 구독(조회 권한 CAR_DRIVE만). 실패하면 null로 남아 주행으로 간주된다. */
class GearSource(context: Context) {
    private val vehicle = Vehicle(context.applicationContext)
    private val state = MutableStateFlow<Gear?>(null)
    val gear: StateFlow<Gear?> = state
    private var stopFn: (() -> Unit)? = null

    fun start() {
        runCatching {
            vehicle.initialize()
            val g = vehicle.getGear()
            // Gear 도메인은 Deprecated(권장: AAOS GEAR_SELECTION)지만 CAR_DRIVE 조회 권한으로 동작(틈 2026-11-09 확인).
            @Suppress("DEPRECATION")
            val l = object : GearSelectionListener {
                override fun onSelected(value: VehicleGear?) { state.value = value?.toGear() }
                override fun onFailed(e: Exception) { Log.w(TAG, "gear failed", e); state.value = null }
            }
            @Suppress("DEPRECATION") g.registerGearSelection(l)
            @Suppress("DEPRECATION") stopFn = { g.unregisterGearSelection(l) }
        }.onFailure { Log.w(TAG, "Pleos SDK unavailable", it) }
    }

    fun stop() {
        runCatching { stopFn?.invoke() }
        runCatching { vehicle.release() }
    }

    private fun VehicleGear.toGear(): Gear? = when (this) {
        VehicleGear.GEAR_PARK -> Gear.P
        VehicleGear.GEAR_REVERSE -> Gear.R
        VehicleGear.GEAR_NEUTRAL -> Gear.N
        VehicleGear.GEAR_DRIVE -> Gear.D
        else -> null
    }

    private companion object { const val TAG = "MangsangGear" }
}
