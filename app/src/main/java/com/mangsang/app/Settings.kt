package com.mangsang.app

import android.content.Context

/**
 * 사용자가 정한 것. 기기 안(SharedPreferences)에만 둔다. 가입도 서버도 없다.
 * RoomCar의 "room19" 파일(복원용 값)과 섞이지 않게 파일을 따로 쓴다.
 */
data class Settings(
    val introSeen: Boolean = false,
    val onboarded: Boolean = false,
    val minutes: Int = 10,      // 0 = 알아서(끝 시각을 정하지 않음)
    val lightCap: Int = 20,     // 실내등 상한(%). 이보다 밝게 하지 않는다
    val recline: Int = 1,       // 0 안 함, 1 조금, 2 더
    val fanLow: Boolean = true, // 바람을 1단으로 낮춤
    val bell: Boolean = true,
    val verse: Boolean = true,
) {
    fun save(c: Context) = c.getSharedPreferences(FILE, Context.MODE_PRIVATE).edit()
        .putBoolean("introSeen", introSeen).putBoolean("onboarded", onboarded)
        .putInt("minutes", minutes).putInt("lightCap", lightCap).putInt("recline", recline)
        .putBoolean("fanLow", fanLow).putBoolean("bell", bell).putBoolean("verse", verse).apply()

    companion object {
        private const val FILE = "room19_settings"
        val LENGTHS = listOf(5, 10, 15, 0)
        val CAPS = listOf(10, 20, 30)
        fun lengthLabel(m: Int) = if (m == 0) "알아서" else "${m}분"
        fun reclineLabel(r: Int) = listOf("안 함", "조금", "더")[r]

        fun load(c: Context): Settings {
            val p = c.getSharedPreferences(FILE, Context.MODE_PRIVATE)
            val d = Settings()
            return Settings(
                p.getBoolean("introSeen", d.introSeen), p.getBoolean("onboarded", d.onboarded),
                p.getInt("minutes", d.minutes), p.getInt("lightCap", d.lightCap), p.getInt("recline", d.recline),
                p.getBoolean("fanLow", d.fanLow), p.getBoolean("bell", d.bell), p.getBoolean("verse", d.verse),
            )
        }

        fun reset(c: Context) = c.getSharedPreferences(FILE, Context.MODE_PRIVATE).edit().clear().apply()
    }
}
