package com.mangsang.app

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Typeface
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.mangsang.app.core.EndingContext
import com.mangsang.app.core.EndingPolicy
import com.mangsang.app.core.EndingSignal
import com.mangsang.app.core.EndingStage
import com.mangsang.app.core.Moment
import com.mangsang.app.core.MomentDetector
import com.mangsang.app.core.VehicleSnapshot
import com.mangsang.app.data.GearSource
import com.mangsang.app.data.Lever
import com.mangsang.app.data.RoomCar
import com.mangsang.app.data.SpeedSource
import kotlinx.coroutines.delay
import java.io.File
import java.util.Calendar

private const val SPEED = "android.car.permission.CAR_SPEED"
// 보정 노브: 이 속도(m/s, 약 1.8km/h)를 넘으면 움직이는 중. 실차에서 정지 떨림 보고 조정.
private const val MOVING_MPS = 0.5f

/** 룸19: 주차한 차가 잠깐 기도하는 방이 된다. 누르는 것은 머물기 한 번. */
class MainActivity : ComponentActivity() {
    private lateinit var gearSource: GearSource
    private lateinit var speedSource: SpeedSource
    private lateinit var car: RoomCar
    private var paused by mutableStateOf(false)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        gearSource = GearSource(this).also { it.start() }
        speedSource = SpeedSource(this)
        car = RoomCar(this).also { it.start() }
        if (checkSelfPermission(SPEED) == PackageManager.PERMISSION_GRANTED) speedSource.start()
        else requestPermissions(arrayOf(SPEED), 1)
        // 시연용: `--ei sec 200`으로 세션 길이를 초로 줄인다. 없으면 화면에서 고른 분.
        val demoSec = intent.getIntExtra("sec", 0)
        setContent {
            val gear by gearSource.gear.collectAsState()
            val speed by speedSource.speedMps.collectAsState()
            val moment = MomentDetector.detect(VehicleSnapshot(gear = gear, moving = speed?.let { it > MOVING_MPS }))
            Room(moment, car, paused, demoSec) { finish() }
        }
    }

    // 끼어듦(전화, 다른 화면): 방은 그대로 두고 시간만 멈춘다. 돌아오면 그 자리에서 이어진다
    override fun onPause() { super.onPause(); paused = true }
    override fun onResume() { super.onResume(); paused = false }

    override fun onRequestPermissionsResult(code: Int, perms: Array<String>, results: IntArray) {
        super.onRequestPermissionsResult(code, perms, results)
        if (results.firstOrNull() == PackageManager.PERMISSION_GRANTED) speedSource.start()
    }

    override fun onDestroy() {
        car.restore()
        speedSource.stop()
        gearSource.stop()
        super.onDestroy()
    }
}

private enum class Phase { OFFER, SILL, BREATH, STAY, RETURN, DONE }

// 디자인 컨셉 3절 토큰(밤)
private val RoomBg = Color(0xFF09080B)
private val Text1 = Color(0xFFEDEAF2)
private val Text2 = Color(0xFFA7A2B4)
private val Text3 = Color(0xFF8A8599)
private val TextRest = Color(0xFF4A4656)
private val LightSill = Color(0xFFFFB15C)
private val LightStay = Color(0xFFFF9A3C)
private val LightReturn = Color(0xFFFFC489)

// 목소리는 명조. 시스템 serif가 한글을 고딕으로 돌려주는 기기가 있어 Noto Serif CJK(KR 면)를 직접 연다. 없으면 시스템 serif
private val Myeongjo: FontFamily = runCatching {
    FontFamily(Typeface.Builder(File("/system/fonts/NotoSerifCJK-Regular.ttc")).setTtcIndex(1).build())
}.getOrDefault(FontFamily.Serif)
private val Voice = TextStyle(fontFamily = Myeongjo, fontWeight = FontWeight.Normal, color = Text1, letterSpacing = (-0.012).em, lineHeight = 1.38.em)
private val Info = TextStyle(fontFamily = FontFamily.SansSerif, color = Text3, fontSize = 22.sp)

private const val SILL_SEC = 12f   // 0.6~6 레버, 6~7 고요, 7 종, 9 첫 문장
private const val BELL_AT = 7f
private const val WORDS_AT = 9f
private const val BREATH_SEC = 50f // 들숨 4 + 날숨 6, 다섯 번
private const val VERSE_SEC = 20f  // 머묾에 들어설 때 구절이 떠 있는 시간
private const val VERSE = "너는 기도할 때에 네 골방에 들어가 문을 닫고\n은밀한 중에 계신 네 아버지께 기도하라"

@Composable
private fun Room(moment: Moment, car: RoomCar, paused: Boolean, demoSec: Int, leave: () -> Unit) {
    var phase by remember { mutableStateOf(Phase.OFFER) }
    var minutes by remember { mutableIntStateOf(15) }
    var t by remember { mutableFloatStateOf(0f) } // 세션 초. 멈춘 동안에는 흐르지 않는다
    var hold by remember { mutableStateOf(false) }
    var wake by remember { mutableIntStateOf(0) }
    var awake by remember { mutableStateOf(false) }
    var rising by remember { mutableStateOf(false) }
    var returnAt by remember { mutableFloatStateOf(0f) }
    var handoff by remember { mutableStateOf("") }
    var policy by remember { mutableStateOf<EndingPolicy?>(null) }
    val levers by car.levers.collectAsState()
    val held = hold || paused
    val inRoom = phase != Phase.OFFER && phase != Phase.DONE

    fun begin() {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        policy = EndingPolicy(EndingContext(intendedSec = if (demoSec > 0) demoSec else minutes * 60, hour = hour))
        t = 0f; hold = false; rising = false; awake = false
        car.enter()
        phase = Phase.SILL
    }

    /** quiet = 일찍 마침 또는 출발: 문장도 종도 없이 되돌린다. */
    fun end(quiet: Boolean) {
        val now = Calendar.getInstance()
        val hour = now.get(Calendar.HOUR_OF_DAY)
        // 건넴: 메뉴 없이 때로 짐작한 한 문장. 위치는 읽지 않는다
        handoff = when {
            quiet -> ""
            hour >= 20 || hour < 5 -> "천천히 올라가세요."
            else -> "${if (hour % 12 == 0) 12 else hour % 12}시 ${now.get(Calendar.MINUTE)}분이에요."
        }
        car.restore()
        phase = Phase.DONE
    }

    // 물러남: 방 안에서 P를 벗어나면 그 순간 말없이 되돌리고 사라진다
    LaunchedEffect(moment) {
        if (moment != Moment.PARKED && inRoom) { car.restore(); phase = Phase.OFFER }
    }
    LaunchedEffect(wake) { if (wake > 0) { awake = true; delay(5000); awake = false } }
    LaunchedEffect(phase) { if (phase == Phase.DONE) { delay(30_000); phase = Phase.OFFER } }

    LaunchedEffect(phase, held) {
        if (!inRoom || held) return@LaunchedEffect
        var last = withFrameNanos { it }
        while (true) {
            val now = withFrameNanos { it }
            val prev = t
            t += (now - last) / 1e9f
            last = now
            when (phase) {
                Phase.SILL -> {
                    if (prev < BELL_AT && t >= BELL_AT) Bell.ring()
                    if (t >= SILL_SEC) { car.breath(true); phase = Phase.BREATH }
                }
                Phase.BREATH -> {
                    val b = (t - SILL_SEC) % 10f
                    val pb = (prev - SILL_SEC) % 10f
                    if (b < pb) car.breath(true)
                    if (pb < 4f && b >= 4f) car.breath(false)
                    if (t >= SILL_SEC + BREATH_SEC) { car.stay(); phase = Phase.STAY }
                }
                Phase.STAY -> if (t.toInt() != prev.toInt()) {
                    val stage = policy?.tick(t.toDouble()) ?: EndingStage.STAY
                    if (stage != EndingStage.STAY && !rising) { rising = true; car.comeBack() }
                    if (stage == EndingStage.CLOSING_WORDS) { returnAt = t; Bell.ring(); phase = Phase.RETURN }
                }
                Phase.RETURN -> if (t - returnAt >= 25f) end(quiet = false)
                else -> {}
            }
        }
    }

    Box(
        Modifier.fillMaxSize().background(RoomBg).pointerInput(inRoom) {
            if (inRoom) detectTapGestures(
                onTap = {
                    wake++
                    // 화면 터치는 "마칠 준비"의 약한 증거다. 묻지 않고 마침 모델에 넣는다
                    if (phase == Phase.STAY) policy?.observe(EndingSignal.SCREEN_TOUCH)
                },
                onLongPress = { hold = !hold },
            )
        },
    ) {
        Sill(phase, t, held)

        when (phase) {
            Phase.OFFER -> Offer(moment, minutes, { minutes = if (minutes >= 20) 5 else minutes + 5 }, ::begin, leave)
            Phase.DONE -> Done(handoff, levers)
            else -> {
                val words = when {
                    held -> "잠시 멈췄어요."
                    phase == Phase.SILL && t >= WORDS_AT -> "문을 닫았어요. 숨을 한 번 고를게요."
                    phase == Phase.RETURN -> "이제 천천히 돌아올게요."
                    else -> ""
                }
                val inhale = (t - SILL_SEC) % 10f < 4f
                val sub = when {
                    held -> "길게 누르면 이어져요."
                    phase == Phase.SILL && t >= WORDS_AT -> "네 골방에 들어가 문을 닫고  ·  마태복음 6:6"
                    phase == Phase.BREATH -> if (inhale) "네 골방에 들어가" else "문을 닫고"
                    phase == Phase.STAY && t < SILL_SEC + BREATH_SEC + VERSE_SEC -> VERSE
                    else -> ""
                }
                // 첫 숨만 말로 이끈다
                val cue = if (phase == Phase.BREATH && !held && t < SILL_SEC + 10f) (if (inhale) "들이쉬고" else "내쉬고") else ""

                Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(Modifier.fillMaxHeight(0.56f).fillMaxWidth(), contentAlignment = Alignment.BottomCenter) {
                        Fading(words) { Text(it, style = Voice, fontSize = 54.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(bottom = 56.dp)) }
                    }
                    Spacer(Modifier.height(if (phase == Phase.STAY) 116.dp else 132.dp))
                    Fading(sub) {
                        Text(it, style = Voice, color = Text2, fontSize = if (phase == Phase.STAY && !held) 30.sp else 28.sp, textAlign = TextAlign.Center, lineHeight = 1.7.em)
                    }
                }

                // 숨 원 한가운데(문틈 위 244dp)에 놓는다
                Box(Modifier.fillMaxHeight(0.62f).fillMaxWidth(), contentAlignment = Alignment.BottomCenter) {
                    Fading(cue) { Text(it, style = Voice, fontSize = 38.sp, modifier = Modifier.padding(bottom = 218.dp)) }
                }

                // 문턱에서만: 차가 바꾼 것의 이름. 설명은 없다
                if (phase == Phase.SILL || phase == Phase.RETURN) Row(
                    Modifier.align(Alignment.BottomStart).padding(start = 72.dp, bottom = 76.dp),
                    horizontalArrangement = Arrangement.spacedBy(44.dp),
                ) {
                    if (phase == Phase.SILL) Lever.entries.forEach { l -> levers[l]?.let { Text("${l.label} $it", style = Info) } }
                    else Text("빛 올리는 중", style = Info)
                }

                // 마치기는 늘 같은 자리. 머묾에서는 일부러 흐리고, 두드리면 5초 또렷해진다
                val endColor by animateColorAsState(if (phase == Phase.STAY && !awake && !held) TextRest else Text2, tween(600), label = "end")
                Box(
                    Modifier.align(Alignment.BottomEnd).padding(end = 72.dp, bottom = 56.dp)
                        .widthIn(min = 176.dp).height(88.dp)
                        .border(1.dp, endColor.copy(alpha = 0.35f), RoundedCornerShape(2.dp))
                        .clickable { end(quiet = true) },
                    contentAlignment = Alignment.Center,
                ) { Text("마치기", style = Info, color = endColor, fontSize = 21.sp, fontWeight = FontWeight.Medium) }
            }
        }
    }
}

/** 문구는 600ms에 8px 올라오며 들어오고 400ms에 나간다. */
@Composable
private fun Fading(text: String, content: @Composable (String) -> Unit) {
    AnimatedContent(
        targetState = text,
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center,
        // 크기 전환 중에 글자가 잘리지 않게 자르지 않는다
        transitionSpec = { (fadeIn(tween(600)) + slideInVertically(tween(600)) { 8 }) togetherWith fadeOut(tween(400)) using SizeTransform(clip = false) },
        label = "words",
    ) { if (it.isNotEmpty()) content(it) else Spacer(Modifier.height(1.dp)) }
}

/** 문틈의 빛: 화면에 있는 단 하나의 장식. 단계마다 폭과 색만 바뀐다. 숨에서는 그 위에 원 하나. */
@Composable
private fun Sill(phase: Phase, t: Float, held: Boolean) {
    val width = remember { Animatable(0.30f) }
    LaunchedEffect(phase) {
        when (phase) {
            Phase.OFFER -> width.animateTo(0.30f, tween(1200))
            Phase.SILL -> {
                // 닫히는 문틈: 넓게 열렸다가 7초에 걸쳐 좁아지고, 종과 함께 가운데로 모였다 가라앉는다
                width.animateTo(1f, tween(500, easing = FastOutSlowInEasing))
                width.animateTo(0.62f, tween(6500, easing = LinearEasing))
                width.animateTo(0.10f, tween(600, easing = FastOutSlowInEasing))
                width.animateTo(0.46f, tween(1800, easing = FastOutSlowInEasing))
            }
            Phase.BREATH -> width.animateTo(0.46f, tween(1200))
            Phase.STAY -> width.animateTo(0.26f, tween(4000))
            Phase.RETURN -> width.animateTo(0.78f, tween(25_000, easing = LinearEasing))
            Phase.DONE -> width.animateTo(0.90f, tween(1500))
        }
    }
    val color by animateColorAsState(
        when (phase) { Phase.OFFER -> Text3; Phase.SILL, Phase.BREATH -> LightSill; Phase.STAY -> LightStay; else -> LightReturn },
        tween(2500), label = "sill",
    )
    val b = (t - SILL_SEC) % 10f
    val ease = { x: Float -> x * x * (3 - 2 * x) }
    // 0 = 날숨 끝, 1 = 들숨 끝
    val lung = if (phase != Phase.BREATH) 0.5f else if (b < 4f) ease(b / 4f) else 1f - ease((b - 4f) / 6f)
    val glow by animateFloatAsState(
        when { held -> 0.3f; phase == Phase.OFFER -> 0.35f; phase == Phase.STAY -> 0.42f; phase == Phase.BREATH -> 0.6f + 0.3f * lung; else -> 0.92f },
        tween(if (phase == Phase.BREATH) 120 else 1500), label = "glow",
    )
    val ring by animateFloatAsState(if (phase == Phase.BREATH && !held) 1f else 0f, tween(1200), label = "ring")
    // 제안에서는 왼쪽 문장 아래에 놓였다가, 머물기를 누르면 가운데로 온다
    val centered by animateFloatAsState(if (phase == Phase.OFFER) 0f else 1f, tween(500), label = "anchor")

    Canvas(Modifier.fillMaxSize()) {
        val y = size.height * 0.62f
        val d = 1.dp.toPx()
        val w = size.width * width.value
        val cx = (96 * d + w / 2) * (1 - centered) + size.width / 2 * centered
        val line = Brush.horizontalGradient(listOf(Color.Transparent, color, color, Color.Transparent), cx - w / 2, cx + w / 2)
        // 바닥에 번지는 빛
        clipRect(top = y) {
            scale(1f, 0.42f, Offset(cx, y)) {
                drawCircle(Brush.radialGradient(listOf(color.copy(alpha = 0.26f * glow), Color.Transparent), Offset(cx, y), w / 2), w / 2, Offset(cx, y))
            }
        }
        drawRect(line, Offset(cx - w / 2, y - 5 * d), Size(w, 10 * d), alpha = 0.22f * glow)
        drawRect(line, Offset(cx - w / 2, y - 1.5f * d), Size(w, 3 * d), alpha = glow)
        if (ring > 0f) {
            val r = (130 + 70 * lung) * d
            val c = Offset(cx, y - 244 * d)
            drawCircle(LightSill, r, c, alpha = 0.85f * ring, style = Stroke(1.5f * d))
            drawCircle(LightSill, r * 0.62f, c, alpha = 0.18f * ring, style = Stroke(d))
        }
    }
}

@Composable
private fun Offer(moment: Moment, minutes: Int, cycle: () -> Unit, stay: () -> Unit, leave: () -> Unit) {
    // 방은 주차(P)에서만 열린다. 주행 중에는 아무것도 띄우지 않는다
    if (moment == Moment.DRIVING) return
    Text("룸19", style = Info, fontSize = 18.sp, letterSpacing = 0.08.em, modifier = Modifier.padding(start = 96.dp, top = 56.dp))
    Column(Modifier.fillMaxSize().padding(start = 96.dp)) {
        // 문장은 문틈의 빛(62%) 위에, 버튼은 그 아래에
        Column(Modifier.fillMaxHeight(0.56f), verticalArrangement = Arrangement.Bottom) {
            if (moment != Moment.PARKED) Text("주차하면 방이 열려요", style = Voice, color = Text2, fontSize = 40.sp)
            else {
                Text("잠시 머물다 갈까요", style = Voice, fontSize = 60.sp)
                Text("기도 ${minutes}분", style = Info, color = Text2, fontSize = 26.sp, modifier = Modifier.padding(top = 8.dp).clickable(onClick = cycle).padding(vertical = 10.dp))
            }
        }
        Spacer(Modifier.height(150.dp))
        // 거절해도 되는 제안: 두 버튼은 같은 크기
        if (moment == Moment.PARKED) Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Choice("머물기", filled = true, onClick = stay)
            Choice("오늘은 그냥 갈게요", filled = false, onClick = leave)
        }
    }
}

@Composable
private fun Choice(label: String, filled: Boolean, onClick: () -> Unit) {
    Box(
        Modifier.width(300.dp).height(92.dp)
            .background(if (filled) Color.White.copy(alpha = 0.10f) else Color.Transparent, RoundedCornerShape(2.dp))
            .border(1.dp, Color.White.copy(alpha = if (filled) 0.22f else 0.13f), RoundedCornerShape(2.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) { Text(label, style = Info, color = if (filled) Text1 else Text2, fontSize = 24.sp, fontWeight = if (filled) FontWeight.SemiBold else FontWeight.Medium) }
}

/** 끝: 누를 것이 없다. 되돌린 값을 한 줄씩 보여 주고, 내리거나 출발하면 그것으로 끝난다. */
@Composable
private fun Done(handoff: String, levers: Map<Lever, String>) {
    Row(Modifier.fillMaxSize().padding(horizontal = 96.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f).padding(bottom = 150.dp)) {
            Text("끝났어요.", style = Voice, fontSize = 76.sp)
            if (handoff.isNotEmpty()) Text(handoff, style = Info, color = Text2, fontSize = 27.sp, modifier = Modifier.padding(top = 18.dp))
        }
        Column(Modifier.width(420.dp).padding(bottom = 150.dp)) {
            Lever.entries.forEach { l ->
                val v = levers[l]
                Row(Modifier.fillMaxWidth().height(58.dp).alpha(if (v == null) 0.35f else 1f), verticalAlignment = Alignment.CenterVertically) {
                    Text(l.label, style = Info, modifier = Modifier.weight(1f))
                    Text(v ?: "되돌리는 중", style = Info, color = if (v == null) Text3 else Text1)
                }
            }
        }
    }
}
