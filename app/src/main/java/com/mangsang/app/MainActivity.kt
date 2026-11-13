package com.mangsang.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.sp
import com.mangsang.app.core.Moment
import com.mangsang.app.core.MomentDetector
import com.mangsang.app.core.VehicleSnapshot
import com.mangsang.app.data.ControlProbe
import com.mangsang.app.data.GearSource
import com.mangsang.app.data.SpeedSource
import android.Manifest
import android.content.pm.PackageManager

/** 골격: 기어 → 세 순간 판단 → 순간별 화면. 아이디어 확정 후 순간마다 경험을 채운다. */
private const val SPEED = "android.car.permission.CAR_SPEED"
// 보정 노브: 이 속도(m/s, 약 1.8km/h)를 넘으면 움직이는 중. 실차에서 정지 떨림 보고 조정.
private const val MOVING_MPS = 0.5f

class MainActivity : ComponentActivity() {
    private lateinit var gearSource: GearSource
    private lateinit var speedSource: SpeedSource

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (intent.getBooleanExtra("probe", false)) ControlProbe.run(this)
        gearSource = GearSource(this).also { it.start() }
        speedSource = SpeedSource(this)
        if (checkSelfPermission(SPEED) == PackageManager.PERMISSION_GRANTED) speedSource.start()
        else requestPermissions(arrayOf(SPEED), 1)
        setContent {
            val gear by gearSource.gear.collectAsState()
            val speed by speedSource.speedMps.collectAsState()
            val moment = MomentDetector.detect(VehicleSnapshot(gear = gear, moving = speed?.let { it > MOVING_MPS }))
            MomentScreen(moment)
        }
    }

    override fun onRequestPermissionsResult(code: Int, perms: Array<String>, results: IntArray) {
        super.onRequestPermissionsResult(code, perms, results)
        if (results.firstOrNull() == PackageManager.PERMISSION_GRANTED) speedSource.start()
    }

    override fun onDestroy() {
        speedSource.stop()
        gearSource.stop()
        super.onDestroy()
    }
}

@androidx.compose.runtime.Composable
private fun MomentScreen(moment: Moment) {
    val label = when (moment) {
        Moment.PARKED -> "주차"
        Moment.STOPPED -> "정차"
        Moment.DRIVING -> "주행"
    }
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        // 주행 중엔 큰 글자 한 줄만 (DESIGN 1절, SAFETY 1절)
        Text(label, color = Color.White, fontSize = if (moment == Moment.DRIVING) 96.sp else 64.sp)
    }
}
