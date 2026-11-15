package com.mangsang.app.data

import ai.pleos.playground.vehicle.Vehicle
import ai.pleos.playground.vehicle.api.model.area.DoorArea
import ai.pleos.playground.vehicle.api.model.area.SeatArea
import ai.pleos.playground.vehicle.constant.area.DoorValue
import ai.pleos.playground.vehicle.constant.area.SeatValue
import ai.pleos.playground.vehicle.constant.control.MoveControl
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update
import kotlin.math.max
import kotlin.math.min

enum class Lever(val label: String) { LOCK("문"), LIGHT("빛"), FAN("바람"), SEAT("등받이") }

/**
 * 방을 만드는 네 레버(문 잠금, 실내 빛, 바람, 운전석 등받이)와 되돌리기.
 * 바꾸기 전 값을 먼저 디스크에 적고, 되돌릴 때는 그 값만 읽는다. 세션 중 앱이 죽어도 다음 실행에서 되돌린다.
 * 호출 형태는 2026-11-15 에뮬레이터 실측(P단)을 따른다. 잠금과 등받이는 P단에서만 된다(D단 50001).
 */
class RoomCar(context: Context) {
    private val v = Vehicle(context.applicationContext)
    private val prefs = context.getSharedPreferences("room19", Context.MODE_PRIVATE)
    private val h = Handler(Looper.getMainLooper())
    private val fadeToken = Any()
    private var lightArea: SeatArea? = null
    private var colorArea: SeatArea? = null
    private var bright = -1
    private var cap = -1 // 사용자가 정해 둔 밝기. 이보다 밝게 하지 않는다

    /** 레버마다 지금 상태 한 마디. 화면은 이것만 보여 준다. 실패는 숨기지 않는다. */
    val levers = MutableStateFlow<Map<Lever, String>>(emptyMap())

    fun start() {
        runCatching { v.initialize() }.onFailure { Log.w(TAG, "Pleos SDK unavailable", it) }
        // 서비스 연결이 비동기라 잠시 뒤에. 지난 세션이 중간에 끊겼으면 여기서 되돌린다
        if (prefs.getBoolean("open", false)) h.postDelayed({ restore() }, 2000)
    }

    /** 문턱: 원래 값을 적고 네 가지를 바꾼다. */
    fun enter() = guard {
        levers.value = emptyMap()
        prefs.edit().clear().putBoolean("open", true).apply()
        door { d, a ->
            d.getDoorLockState(a, { was ->
                // 이미 잠겼으면 다시 잠그지 않는다(철컥 소리가 밖에 신호가 된다)
                if (was == true) set(Lever.LOCK, "잠김 그대로")
                else {
                    prefs.edit().putBoolean("unlock", true).apply()
                    d.setDoorLock(a, true, { _, _ -> set(Lever.LOCK, "잠김") }, fail(Lever.LOCK))
                }
            }, fail(Lever.LOCK))
        }
        light { a ->
            v.getLight().getAmbientLightBrightness(a, { was ->
                val w = was ?: 0
                prefs.edit().putInt("bright", w).apply()
                cap = w; bright = w
                set(Lever.LIGHT, "낮추는 중")
                fadeTo(SILL_PCT, 5400) { set(Lever.LIGHT, "호박색 ${min(SILL_PCT, w)}") }
            }, fail(Lever.LIGHT))
        }
        color { a ->
            v.getLight().getAmbientLightBrightnessColor(a, { was ->
                prefs.edit().putInt("color", was ?: 0xFFFFFF).apply()
                setColor(SILL)
            }, fail(Lever.LIGHT))
        }
        fan { a ->
            v.getHVAC().getHvacFanSpeed(a, { was ->
                val w = was ?: 0
                // 공조가 꺼져 있으면 풍량 쓰기가 거부된다(에뮬레이터 실측). 그때는 건드리지 않은 것이니 "그대로"라고만 적고 되돌릴 것도 없다
                if (w > 1) v.getHVAC().setHvacFanSpeed(a, 1, { _, x -> prefs.edit().putInt("fan", w).apply(); set(Lever.FAN, "$x") },
                    { e -> Log.w(TAG, "fan", e); set(Lever.FAN, "그대로") })
                else set(Lever.FAN, "$w 그대로")
            }, fail(Lever.FAN))
        }
        moveSeat(MoveControl.BACKWARD) { prefs.edit().putBoolean("seat", true).apply(); set(Lever.SEAT, "뒤로 조금") }
    }

    /** 숨: 들숨 20%, 날숨 15%. */
    fun breath(inhale: Boolean) = guard {
        h.removeCallbacksAndMessages(fadeToken)
        setColor(if (inhale) SILL else STAY); setBright(if (inhale) SILL_PCT else STAY_PCT)
    }

    /** 머묾: 가장 어둡게, 움직이지 않는다. */
    fun stay() = guard { h.removeCallbacksAndMessages(fadeToken); setColor(STAY); setBright(STAY_PCT) }

    /** 돌아옴: 25초에 걸쳐 오른다. */
    fun comeBack() = guard { setColor(RETURN); fadeTo(RETURN_PCT, 25_000) }

    /** 적어 둔 값으로 되돌린다. 적어 둔 것이 없으면 아무것도 하지 않는다. */
    fun restore() = guard {
        if (!prefs.getBoolean("open", false)) return@guard
        val was = prefs.all
        prefs.edit().clear().apply()
        levers.value = emptyMap()
        (was["bright"] as? Int)?.let { b ->
            cap = b; if (bright < 0) bright = STAY_PCT
            fadeTo(b, 1500) { set(Lever.LIGHT, "원래 밝기 $b") }
        }
        (was["color"] as? Int)?.let { setColor(it) }
        (was["fan"] as? Int)?.let { f ->
            fan { a -> v.getHVAC().setHvacFanSpeed(a, f, { _, x -> set(Lever.FAN, "$x") }, fail(Lever.FAN)) }
        } ?: set(Lever.FAN, "그대로")
        if (was["unlock"] == true) door { d, a -> d.setDoorLock(a, false, { _, _ -> set(Lever.LOCK, "열림, 원래대로") }, fail(Lever.LOCK)) }
        else set(Lever.LOCK, "잠김 그대로")
        // shortcut: D단에서 물러나면 등받이 복원이 거부된다(50001). 지금은 화면에 알리기만 한다. 실차 전에 P단 복귀 시 재시도를 넣는다
        if (was["seat"] == true) moveSeat(MoveControl.FORWARD, "직접 세워 주세요") { set(Lever.SEAT, "운전 자세") }
    }

    private fun moveSeat(dir: MoveControl, failText: String = "안 됨", ok: () -> Unit) {
        val s = v.getSeat()
        s.checkMoveSeatBackrestAngleCapabilities({ _, areas ->
            areas.firstOrNull { SeatValue.ROW_1_LEFT in it.values }?.let { a ->
                s.moveSeatBackrestAngle(a, dir, { _, _ -> ok() }, fail(Lever.SEAT, failText))
                // 각도 지정이 안 돼 이동 시간으로 제어한다. 정지는 성공 응답과 무관하게 반드시 보낸다
                h.postDelayed({ s.moveSeatBackrestAngle(a, MoveControl.STOP, { _, _ -> }, { e -> Log.w(TAG, "seat stop", e) }) }, SEAT_MS)
            }
        }, fail(Lever.SEAT, failText))
    }

    private fun door(f: (ai.pleos.playground.vehicle.api.Door, DoorArea) -> Unit) {
        val d = v.getDoor()
        // 후드 구역은 건드리지 않는다. 운전석이 든 구역만
        d.checkDoorLockCapabilities({ _, areas -> areas.firstOrNull { DoorValue.ROW_1_LEFT in it.values }?.let { f(d, it) } }, fail(Lever.LOCK))
    }

    private fun fan(f: (SeatArea) -> Unit) =
        v.getHVAC().checkHvacFanSpeedCapabilities({ _, areas -> driver(areas.keys)?.let(f) }, fail(Lever.FAN))

    private fun light(f: (SeatArea) -> Unit) {
        lightArea?.let(f) ?: v.getLight().checkAmbientLightBrightnessCapabilities(
            { _, areas -> driver(areas.keys)?.let { lightArea = it; f(it) } }, fail(Lever.LIGHT))
    }

    private fun color(f: (SeatArea) -> Unit) {
        colorArea?.let(f) ?: v.getLight().checkAmbientLightBrightnessColorCapabilities(
            { _, areas -> driver(areas)?.let { colorArea = it; f(it) } }, fail(Lever.LIGHT))
    }

    private fun setColor(rgb: Int) = color { a ->
        v.getLight().setAmbientLightBrightnessColor(a, rgb, { _, _ -> }, { e -> Log.w(TAG, "color", e) })
    }

    private fun setBright(pct: Int, done: (() -> Unit)? = null) {
        if (cap < 0) return
        val x = min(pct, cap)
        bright = x
        light { a -> v.getLight().setAmbientLightBrightness(a, x, { _, _ -> done?.invoke() }, fail(Lever.LIGHT)) }
    }

    private fun fadeTo(target: Int, ms: Long, done: (() -> Unit)? = null) {
        h.removeCallbacksAndMessages(fadeToken)
        val from = bright
        val to = min(target, cap)
        val steps = max(1, (ms / 500).toInt())
        val t0 = SystemClock.uptimeMillis()
        for (i in 1..steps) h.postAtTime({ setBright(from + (to - from) * i / steps, if (i == steps) done else null) }, fadeToken, t0 + ms * i / steps)
    }

    private fun driver(xs: Collection<SeatArea>) = xs.firstOrNull { SeatValue.ROW_1_LEFT in it.values } ?: xs.firstOrNull()
    private fun set(l: Lever, s: String) = levers.update { it + (l to s) }
    private fun fail(l: Lever, text: String = "안 됨"): (Exception) -> Unit = { e -> Log.w(TAG, "${l.label} failed", e); set(l, text) }
    private fun guard(f: () -> Unit) { runCatching(f).onFailure { Log.w(TAG, "vehicle call failed", it) } }

    private companion object {
        const val TAG = "Room19Car"
        // 조명 통합설계 v2: 문턱 #FFB15C 20%, 머묾 #FF9A3C 15%, 돌아옴 #FFC489 30%
        const val SILL = 0xFFB15C; const val STAY = 0xFF9A3C; const val RETURN = 0xFFC489
        const val SILL_PCT = 20; const val STAY_PCT = 15; const val RETURN_PCT = 30
        // 보정 노브: 등받이를 "조금"(설계 0.55 → 0.45) 옮기는 시간. 에뮬레이터는 각도 읽기가 0만 줘서 실차에서 맞춘다
        const val SEAT_MS = 1200L
    }
}
