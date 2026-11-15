package com.mangsang.app

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Handler
import android.os.Looper
import kotlin.math.PI
import kotlin.math.exp
import kotlin.math.min
import kotlin.math.sin

/** 들어섬과 돌아옴에 같은 종 한 번. 음원 파일 없이 직접 만든 한 음이고, 여운이 스스로 사라진다(뚝 끊지 않는다). */
object Bell {
    private const val SR = 44100
    private const val SEC = 2.6
    private val pcm: ShortArray by lazy {
        ShortArray((SR * SEC).toInt()) { i ->
            val s = i / SR.toDouble()
            val w = 2 * PI * 523.25 * s
            val x = sin(w) * exp(-s * 1.6) + 0.45 * sin(w * 2.76) * exp(-s * 3.2) + 0.2 * sin(w * 5.4) * exp(-s * 6.0)
            val env = min(1.0, s / 0.004) * min(1.0, (SEC - s) / 0.3)
            (x / 1.65 * env * 0.6 * Short.MAX_VALUE).toInt().toShort()
        }
    }

    fun ring(gain: Float = 1f) {
        runCatching {
            val t = AudioTrack.Builder()
                .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
                .setAudioFormat(AudioFormat.Builder().setEncoding(AudioFormat.ENCODING_PCM_16BIT).setSampleRate(SR).setChannelMask(AudioFormat.CHANNEL_OUT_MONO).build())
                .setTransferMode(AudioTrack.MODE_STATIC).setBufferSizeInBytes(pcm.size * 2).build()
            t.write(pcm, 0, pcm.size); t.setVolume(gain); t.play()
            Handler(Looper.getMainLooper()).postDelayed({ t.release() }, 3000)
        }
    }
}
