package com.mangsang.app.data

import android.car.Car
import android.car.VehiclePropertyIds
import android.car.hardware.CarPropertyValue
import android.car.hardware.property.CarPropertyManager
import android.content.Context
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * 차속(m/s) 구독. Pleos Vehicle SDK 2.3.2에는 차속 리스너가 없어 Android Automotive 표준 속성을 쓴다.
 * 에뮬레이터에선 Virtual Console의 가속 페달(PUT /vehicle/controls?accelerator=)로 속도가 오른다(2026-11-14 확인).
 * 권한이 없거나 실패하면 null로 남아 주행으로 간주된다.
 */
class SpeedSource(context: Context) {
    private val app = context.applicationContext
    private val state = MutableStateFlow<Float?>(null)
    val speedMps: StateFlow<Float?> = state
    private var car: Car? = null
    private var cpm: CarPropertyManager? = null

    private val callback = object : CarPropertyManager.CarPropertyEventCallback {
        override fun onChangeEvent(value: CarPropertyValue<*>) { state.value = value.value as? Float }
        override fun onErrorEvent(propId: Int, zone: Int) { state.value = null }
    }

    fun start() {
        runCatching {
            car = Car.createCar(app)
            cpm = (car?.getCarManager(Car.PROPERTY_SERVICE) as CarPropertyManager).also {
                it.registerCallback(callback, VehiclePropertyIds.PERF_VEHICLE_SPEED, CarPropertyManager.SENSOR_RATE_NORMAL)
            }
        }.onFailure { Log.w(TAG, "speed unavailable", it) }
    }

    fun stop() {
        runCatching { cpm?.unregisterCallback(callback) }
        runCatching { car?.disconnect() }
    }

    private companion object { const val TAG = "MangsangSpeed" }
}
