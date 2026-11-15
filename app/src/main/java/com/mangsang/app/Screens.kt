package com.mangsang.app

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Canvas
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size

/** "ROOM 19" 글자. 길게 누르면 시연용 패널이 열린다(숨은 기능). */
@OptIn(ExperimentalFoundationApi::class)
@Composable
internal fun Wordmark(modifier: Modifier = Modifier, size: Int = 18, color: Color = Text3, onLongPress: () -> Unit = {}) {
    Text(
        "ROOM 19", color = color, fontSize = size.sp, letterSpacing = 0.42.em, fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Light,
        modifier = modifier.combinedClickable(onClick = {}, onLongClick = onLongPress).padding(12.dp),
    )
}

/** 처음 여는 순간: 검은 화면, 1초 고요, 가는 빛이 자라고, 이름, 한 줄, 어떻게 되는지 세 줄. 언제든 건너뛸 수 있다. */
@Composable
internal fun Intro(done: () -> Unit) {
    val line = remember { Animatable(0f) }
    var step by remember { mutableIntStateOf(0) } // 0 고요, 1 빛, 2 이름, 3 한 줄, 4 세 줄, 5 시작
    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(1000)
        step = 1
        line.animateTo(1f, tween(2200, easing = FastOutSlowInEasing))
        step = 2; kotlinx.coroutines.delay(1800)
        step = 3; kotlinx.coroutines.delay(2400)
        step = 4; kotlinx.coroutines.delay(3000)
        step = 5
    }
    Box(Modifier.fillMaxSize().background(Color.Black)) {
        Canvas(Modifier.fillMaxSize()) {
            val y = size.height * 0.42f
            val w = size.width * 0.5f * line.value
            val d = 1.dp.toPx()
            val b = Brush.horizontalGradient(listOf(Color.Transparent, LightSill, LightSill, Color.Transparent), size.width / 2 - w / 2, size.width / 2 + w / 2)
            drawRect(b, Offset(size.width / 2 - w / 2, y - 6 * d), Size(w, 12 * d), alpha = 0.18f)
            drawRect(b, Offset(size.width / 2 - w / 2, y - 1 * d), Size(w, 2 * d), alpha = 0.95f)
        }
        Column(Modifier.fillMaxSize().padding(horizontal = 96.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Spacer(Modifier.weight(0.52f))
            Box(Modifier.height(170.dp), contentAlignment = Alignment.BottomCenter) {
                Appear(step >= 2) { Text("ROOM 19", color = Text1, fontSize = 72.sp, letterSpacing = 0.5.em, fontWeight = FontWeight.Light, modifier = Modifier.padding(bottom = 48.dp)) }
            }
            Spacer(Modifier.height(48.dp))
            Appear(step >= 3) { Text("주차한 차가 잠시 기도의 방이 됩니다", style = Voice, fontSize = 40.sp, textAlign = TextAlign.Center) }
            Spacer(Modifier.height(36.dp))
            Appear(step >= 4) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf(
                        "머물기를 한 번 누르면 차가 문을 잠그고 빛을 낮춥니다",
                        "숨을 고르고, 말씀 앞에 잠시 머뭅니다",
                        "끝나면 차는 처음 자리로 돌아옵니다",
                    ).forEach { Text(it, style = Info, color = Text2, fontSize = 24.sp, textAlign = TextAlign.Center) }
                }
            }
            Spacer(Modifier.weight(0.48f))
            Box(Modifier.height(140.dp)) { Appear(step >= 5) { Choice("시작하기", filled = true, onClick = done) } }
        }
        Text(
            "건너뛰기", style = Info, color = Text3, fontSize = 22.sp,
            modifier = Modifier.align(Alignment.TopEnd).padding(32.dp).clickable(onClick = done).padding(horizontal = 24.dp, vertical = 18.dp),
        )
    }
}

@Composable
private fun Appear(visible: Boolean, content: @Composable () -> Unit) {
    val a = remember { Animatable(0f) }
    LaunchedEffect(visible) { a.animateTo(if (visible) 1f else 0f, tween(900, easing = FastOutSlowInEasing)) }
    Box(Modifier.alpha(a.value)) { content() }
}

/** 첫 설정 세 걸음: 기도 전통, 길이, 편안함. 기기 안에만 저장한다. 가입은 없다. */
@Composable
internal fun Setup(initial: Settings, done: (Settings) -> Unit) {
    var step by remember { mutableIntStateOf(0) }
    var s by remember { mutableStateOf(initial) }
    Column(Modifier.fillMaxSize().background(RoomBg).padding(horizontal = 96.dp, vertical = 64.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Wordmark()
            Spacer(Modifier.weight(1f))
            Text("${step + 1} / 3", style = Info, fontSize = 20.sp)
        }
        Spacer(Modifier.height(40.dp))
        when (step) {
            0 -> {
                Title("어떤 기도로 머물까요")
                Options {
                    Chip("개신교", true) {}
                    listOf("가톨릭", "불교", "그 밖의 전통").forEach { Chip("$it  예정", false, enabled = false) {} }
                }
                Hint("지금은 개신교 말씀(마태복음 6:6)으로 머뭅니다. 다른 전통은 준비 중이에요.")
            }
            1 -> {
                Title("보통 얼마나 머물까요")
                Options { Settings.LENGTHS.forEach { m -> Chip(Settings.lengthLabel(m), s.minutes == m) { s = s.copy(minutes = m) } } }
                Hint("'알아서'는 끝 시각을 정하지 않아요. 앱이 조용히 끝을 짐작하고, 묻지 않고 마칩니다.")
            }
            else -> {
                Title("차를 얼마나 바꿀까요")
                Label("등받이")
                Options { (0..2).forEach { r -> Chip(Settings.reclineLabel(r), s.recline == r) { s = s.copy(recline = r) } } }
                Label("빛 상한")
                Options { Settings.CAPS.forEach { c -> Chip("$c%", s.lightCap == c) { s = s.copy(lightCap = c) } } }
                Label("바람")
                Options { Chip("1단으로 낮춤", s.fanLow) { s = s.copy(fanLow = true) }; Chip("그대로", !s.fanLow) { s = s.copy(fanLow = false) } }
                Hint("원래 쓰던 밝기보다 밝게 하지 않아요. 끝나면 모두 처음 값으로 돌려놓습니다.")
            }
        }
        Spacer(Modifier.weight(1f))
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            if (step > 0) Choice("이전", filled = false) { step-- }
            Choice(if (step < 2) "다음" else "마치기", filled = true) { if (step < 2) step++ else done(s.copy(onboarded = true)) }
        }
    }
}

/** 설정: 길이, 빛 상한, 등받이, 바람, 종, 말씀, 소개 다시 보기, 데이터 지우기. */
@Composable
internal fun SettingsScreen(initial: Settings, save: (Settings) -> Unit, replayIntro: () -> Unit, reset: () -> Unit, back: () -> Unit) {
    var s by remember { mutableStateOf(initial) }
    fun put(n: Settings) { s = n; save(n) }
    Column(Modifier.fillMaxSize().background(RoomBg).padding(horizontal = 96.dp, vertical = 48.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("설정", style = Voice, fontSize = 44.sp)
            Spacer(Modifier.weight(1f))
            Choice("돌아가기", filled = false, onClick = back)
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(top = 24.dp)) {
            SettingRow("기도 전통") { Chip("개신교", true) {}; Chip("다른 전통  예정", false, enabled = false) {} }
            SettingRow("길이") { Settings.LENGTHS.forEach { m -> Chip(Settings.lengthLabel(m), s.minutes == m) { put(s.copy(minutes = m)) } } }
            SettingRow("빛 상한") { Settings.CAPS.forEach { c -> Chip("$c%", s.lightCap == c) { put(s.copy(lightCap = c)) } } }
            SettingRow("등받이") { (0..2).forEach { r -> Chip(Settings.reclineLabel(r), s.recline == r) { put(s.copy(recline = r)) } } }
            SettingRow("바람") { Chip("1단으로", s.fanLow) { put(s.copy(fanLow = true)) }; Chip("그대로", !s.fanLow) { put(s.copy(fanLow = false)) } }
            SettingRow("종소리") { Chip("켬", s.bell) { put(s.copy(bell = true)) }; Chip("끔", !s.bell) { put(s.copy(bell = false)) } }
            SettingRow("말씀 보기") { Chip("켬", s.verse) { put(s.copy(verse = true)) }; Chip("끔", !s.verse) { put(s.copy(verse = false)) } }
            SettingRow("") { Chip("소개 다시 보기", false, onClick = replayIntro); Chip("기기 안 데이터 지우기", false, onClick = reset) }
            Hint("설정은 이 기기 안에만 있어요. 계정, 서버, 마이크를 쓰지 않습니다.")
        }
    }
}

@Composable
private fun SettingRow(label: String, content: @Composable () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = Info, color = Text2, fontSize = 24.sp, modifier = Modifier.width(200.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) { content() }
    }
}

@Composable private fun Title(t: String) = Text(t, style = Voice, fontSize = 52.sp, modifier = Modifier.padding(bottom = 36.dp))
@Composable private fun Label(t: String) = Text(t, style = Info, color = Text2, fontSize = 22.sp, modifier = Modifier.padding(top = 16.dp, bottom = 10.dp))
@Composable private fun Hint(t: String) = Text(t, style = Info, fontSize = 21.sp, modifier = Modifier.padding(top = 28.dp))
@Composable private fun Options(content: @Composable () -> Unit) = Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) { content() }

@Composable
internal fun Chip(label: String, selected: Boolean, enabled: Boolean = true, onClick: () -> Unit) {
    Box(
        Modifier.widthIn(min = 132.dp).heightIn(min = 76.dp).alpha(if (enabled) 1f else 0.4f)
            .background(if (selected) LightSill.copy(alpha = 0.16f) else Color.Transparent, RoundedCornerShape(2.dp))
            .border(1.dp, if (selected) LightSill.copy(alpha = 0.7f) else Color.White.copy(alpha = 0.14f), RoundedCornerShape(2.dp))
            .clickable(enabled = enabled, onClick = onClick).padding(horizontal = 26.dp),
        contentAlignment = Alignment.Center,
    ) { Text(label, style = Info, color = if (selected) Text1 else Text2, fontSize = 22.sp) }
}

/** 시연용 패널(ROOM 19 길게 누르기). 세 가지 문제 상황과 빠르게 보기를 흉내 낸다. */
@Composable
internal fun DebugPanel(
    fast: Boolean, fakeDrive: Boolean, interrupt: String?, seatFail: Boolean,
    onFast: () -> Unit, onDrive: () -> Unit, onDoor: () -> Unit, onCall: () -> Unit, onSeatFail: () -> Unit, close: () -> Unit,
) {
    Column(
        Modifier.padding(start = 96.dp, top = 120.dp).width(560.dp).background(Color(0xF0141218), RoundedCornerShape(4.dp))
            .border(1.dp, Color.White.copy(alpha = 0.15f), RoundedCornerShape(4.dp)).padding(28.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("시연 패널", style = Info, color = Text1, fontSize = 24.sp)
        Chip("빠르게 보기 ×10", fast, onClick = onFast)
        Chip("(가) 기어가 P를 벗어남", fakeDrive, onClick = onDrive)
        Chip("(나) 문 열림", interrupt == DOOR_OPEN, onClick = onDoor)
        Chip("(나) 전화 옴", interrupt == PHONE_CALL, onClick = onCall)
        Chip("(다) 등받이 거부 50001", seatFail, onClick = onSeatFail)
        Chip("닫기", false, onClick = close)
    }
}

internal const val DOOR_OPEN = "문이 열렸어요. 닫으면 그 자리에서 이어갈게요."
internal const val PHONE_CALL = "통화가 끝나면 그 자리에서 이어갈게요."
