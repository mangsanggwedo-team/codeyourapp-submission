# scenarios.json 생성기. session.p는 core EndingPolicy.kt와 같은 식으로 계산한다. 값을 바꾸면 이 파일을 고치고 python3 gen_scenarios.py
import json, math, copy
def ncdf(z): return 0.5*(1+math.erf(z/math.sqrt(2)))
def base(intent, drive, hour):
    b=max(60,intent-90); d=0.10*math.log(max(drive,1)/30); l=-0.10 if (hour>=22 or hour<5) else 0
    return b*math.exp(d+l)
SIG=0.18
LR={"SCREEN_TOUCH":3.0,"SEAT_BACKREST_FORWARD":6.0,"SEAT_BACKREST_BACK":0.3,"SEATBELT_FASTENED":8.0,"SEATBELT_UNFASTENED":0.5,
    "HEADLAMP_ON":5.0,"HVAC_MANUAL":2.0,"WINDOW_MANUAL":2.5,"BRAKE_PRESSED":10.0,"TURN_SIGNAL":10.0}
TH=[0.5,0.7,0.85]; STAGES=["STAY","LIGHT_RISE","SOUND_FADE","CLOSING_WORDS"]
class Model:
    def __init__(s,intent,drive,hour): s.mu=math.log(base(intent,drive,hour)); s.p=0; s.last=0; s.st=0
    def F(s,t): return 0 if t<=0 else ncdf((math.log(t)-s.mu)/SIG)
    def tick(s,t):
        if t<=s.last: return
        f0=s.F(s.last); h=1 if f0>=1 else (s.F(t)-f0)/(1-f0); s.p+=(1-s.p)*h; s.last=t; s.re()
    def obs(s,name):
        if s.p<=0: return
        o=s.p/(1-s.p)*LR[name]; s.p=min(o/(1+o),1-1e-9); s.re()
    def re(s):
        while s.st<3 and s.p>TH[s.st]: s.st+=1
        while s.st>0 and s.p<TH[s.st-1]-0.1: s.st-=1

def build(meta, start, frames, model=None, s0=None, pauses=(), endT=10**9):
    out=[]; lev=copy.deepcopy(start); paused=0
    for f in frames:
        t=f["t"]; lev=copy.deepcopy(lev)
        for k,v in f.get("levers",{}).items():
            if k=="ambient": lev["ambient"]={**lev["ambient"],**v}
            else: lev[k]=v
        kf={"t":t,"clock":None,"stage":f["stage"],"levers":lev,
            "screen":f.get("screen",{"title":"","body":"","buttons":[]}),
            "sound":f.get("sound",{"tts":"","bgm":"none","vol":None}),
            "signals":f.get("signals",[])}
        if model and s0 is not None and s0<=t<=endT:
            s=t-s0-sum(min(max(t-a,0),b-a) for a,b in pauses)
            if not f.get("frozen"): model.tick(s)
            for sg in kf["signals"]:
                if sg.startswith("ending:"): model.obs(sg.split(":")[1])
            kf["session"]={"s":s,"p":round(model.p,3),"endingStage":STAGES[model.st]}
        h,m,sec=meta["t0"]; tot=h*3600+m*60+sec+t
        kf["clock"]="%02d:%02d:%02d"%(tot//3600,(tot%3600)//60,tot%60)
        out.append(kf)
    return out
START={"hvacC":22.0,"fan":3,"recirc":False,"seatHeat":0,"backrest":0.55,
       "ambient":{"pct":30,"hex":"#FFFFFF","ms":0},"window":0,"lock":True,"mirrorFolded":False}
S=lambda title="",body="",buttons=None:{"title":title,"body":body,"buttons":buttons or []}
SND=lambda tts="",bgm="none",vol=None:{"tts":tts,"bgm":bgm,"vol":vol}
VERSE="너는 기도할 때에 네 골방에 들어가 문을 닫고 은밀한 중에 계신 네 아버지께 기도하라"

# ---------- A ----------
A=[
 {"t":-60,"stage":"drive","signals":["gear:D","speedKph:9","seat.driver.occupied:true"]},
 {"t":-20,"stage":"park-in","signals":["gear:R","speedKph:3"]},
 {"t":0,"stage":"arrive","signals":["gear:P","speedKph:0","door.driver.open:false"]},
 {"t":7,"stage":"offer","screen":S("잠시 머물다 갈까요","기도 · 15분",["머물기","오늘은 그냥 갈게요"]),"signals":["gear:P"]},
 {"t":14,"stage":"threshold","screen":S("","문을 닫고, 숨을 한 번 고를게요.",["마치기"]),
  "levers":{"ambient":{"pct":20,"hex":"#FFB15C","ms":8000}},
  "sound":SND("문을 닫고, 숨을 한 번 고를게요.","none",-12),"signals":["ui:start","saved:get_all"]},
 {"t":16,"stage":"threshold","levers":{"fan":2,"seatHeat":1}},
 {"t":17,"stage":"threshold","levers":{"backrest":0.62}},
 {"t":19,"stage":"threshold","levers":{"fan":1}},
 {"t":22,"stage":"threshold","sound":SND("","bell_once",-14)},
 {"t":24,"stage":"breath","screen":S("","들이쉬고",["마치기"]),"levers":{"ambient":{"pct":20,"hex":"#FFB15C","ms":4000}},"sound":SND("들이쉬고","none",-14)},
 {"t":28,"stage":"breath","screen":S("","내쉬고",["마치기"]),"levers":{"ambient":{"pct":15,"hex":"#FF9A3C","ms":6000}},"sound":SND("내쉬고","none",-14)},
 {"t":34,"stage":"breath","screen":S("","",["마치기"]),"levers":{"ambient":{"pct":20,"hex":"#FFB15C","ms":4000}}},
 {"t":38,"stage":"breath","levers":{"ambient":{"pct":15,"hex":"#FF9A3C","ms":6000}}},
 {"t":84,"stage":"stay","screen":S("","● ○ ○",["마치기"]),"levers":{},
  "sound":SND(VERSE,"none",-12)},
 {"t":100,"stage":"stay","screen":S("","",["마치기"]),"sound":SND("","none",None)},
 {"t":614,"stage":"stay","screen":S("","",["마치기"])},
 {"t":734,"stage":"stay"},
 {"t":844,"stage":"stay","screen":S("","● ● ○",["마치기"]),"signals":["ending:SCREEN_TOUCH"],
  "levers":{"ambient":{"pct":17,"ms":60000}}},
 {"t":894,"stage":"closing","signals":["ending:SEAT_BACKREST_FORWARD","seat.backrest:user_forward"],"levers":{"backrest":0.68}},
 {"t":898,"stage":"closing","sound":SND("이제 천천히 돌아올게요.","none",-14),"screen":S("","이제 천천히 돌아올게요.",["마치기"])},
 {"t":903,"stage":"return","sound":SND("","bell_once",-14),"levers":{"ambient":{"pct":30,"hex":"#FFC489","ms":25000}}},
 {"t":915,"stage":"return","screen":S("","좌석을 원래대로 돌리고 있어요.",[]),"levers":{"backrest":0.55}},
 {"t":933,"stage":"return","levers":{"fan":2}},
 {"t":943,"stage":"return","levers":{"fan":3}},
 {"t":945,"stage":"done","screen":S("끝났어요.","좌석과 공조를 원래대로 돌렸어요.",["닫기"])},
 {"t":960,"stage":"done","levers":{"seatHeat":0,"ambient":{"pct":30,"hex":"#FFFFFF","ms":1500}},"signals":["ignition:OFF_requested"]},
 {"t":972,"stage":"leave","signals":["door.driver.open:true","seat.driver.occupied:false"],"screen":S("","",[])},
 {"t":980,"stage":"leave","signals":["door.driver.open:false"]},
 {"t":990,"stage":"leave","levers":{"mirrorFolded":True,"ambient":{"pct":0,"ms":3000}},"signals":["vehicle:auto_lock","vehicle:mirror_auto_fold"]},
 {"t":1062,"stage":"after","signals":["prior.update:readySec=880"]},
]
mA=Model(900,40,21)
scA={"id":"A","title":"평일 밤 귀가 직전, 지하주차장 기도","persona":"정은 씨 (가상, 30대 후반, 개신교)",
 "context":{"intendedSec":900,"driveMin":40,"hour":21,"pack":"protestant","place":"아파트 지하주차장 B2","outsideC":6,"car":"그랜저 하이브리드 [가정]"},
 "t0Clock":"21:40:00","sessionStartT":14,
 "keyframes":build({"t0":(21,40,0)},START,A,mA,14,endT=903)}

# ---------- B ----------
B=[
 {"t":-60,"stage":"drive","signals":["gear:D","speedKph:15","seat.driver.occupied:true"]},
 {"t":-12,"stage":"park-in","signals":["gear:D","speedKph:2"]},
 {"t":0,"stage":"arrive","signals":["gear:P","speedKph:0"]},
 {"t":6,"stage":"offer","screen":S("잠시 머물다 갈까요","조용히 머물기 · 12시 28분까지",["머물기","오늘은 그냥 갈게요"])},
 {"t":9,"stage":"threshold","screen":S("","문을 닫고, 숨을 한 번 고를게요.",["마치기"]),
  "levers":{"ambient":{"pct":25,"hex":"#FFB15C","ms":8000}},
  "sound":SND("문을 닫고, 숨을 한 번 고를게요.","wood_x3",-12),"signals":["ui:start","saved:get_all"]},
 {"t":11,"stage":"threshold","levers":{"fan":2,"hvacC":22.0}},
 {"t":14,"stage":"threshold","signals":["ending:SEATBELT_UNFASTENED","seatbelt.driver:off"]},
 {"t":19,"stage":"breath","screen":S("","들이쉬고",["마치기"]),"sound":SND("들이쉬고","none",-14)},
 {"t":23,"stage":"breath","screen":S("","내쉬고",["마치기"]),"sound":SND("내쉬고","none",-14)},
 {"t":49,"stage":"stay","screen":S("","● ○ ○",["마치기"]),"levers":{"ambient":{"pct":20,"hex":"#FF9A3C","ms":15000}},
  "sound":SND("","leaves_wind",-18)},
 {"t":189,"stage":"stay","sound":SND("","none",None),"screen":S("","",["마치기"])},
 {"t":309,"stage":"stay","sound":SND("","leaves_wind",-24)},
 {"t":399,"stage":"stay","screen":S("","● ● ○",["마치기"]),"levers":{"ambient":{"pct":21,"ms":30000}}},
 {"t":409,"stage":"stay","signals":["ending:SEAT_BACKREST_BACK","seat.backrest:user_back"],"levers":{"backrest":0.50,"ambient":{"pct":20,"ms":20000}},
  "sound":SND("","leaves_wind",-24)},
 {"t":454,"stage":"stay","signals":["ending:SCREEN_TOUCH"],"screen":S("","12:27",["마치기"])},
 {"t":461,"stage":"closing","signals":["ending:SEAT_BACKREST_FORWARD","seat.backrest:user_forward"],"levers":{"backrest":0.60},
  "sound":SND("","leaves_wind",-40)},
 {"t":465,"stage":"closing","sound":SND("이제 천천히 돌아올게요.","none",-14),"screen":S("","이제 천천히 돌아올게요.",["마치기"])},
 {"t":470,"stage":"return","sound":SND("","wood_x3",-14),"levers":{"ambient":{"pct":30,"hex":"#FFC489","ms":20000}}},
 {"t":478,"stage":"return","levers":{"backrest":0.55}},
 {"t":490,"stage":"done","screen":S("끝났어요.","12시 28분이에요.",["닫기"]),"levers":{"fan":3}},
 {"t":500,"stage":"leave","levers":{"ambient":{"pct":30,"hex":"#FFFFFF","ms":1500}},"signals":["ignition:OFF","door.driver.open:true"]},
 {"t":515,"stage":"leave","levers":{"mirrorFolded":True,"ambient":{"pct":0,"ms":3000}},"signals":["vehicle:auto_lock"]},
 {"t":590,"stage":"after","signals":["prior.update:readySec=452"]},
]
mB=Model(480,12,12)
scB={"id":"B","title":"점심 회사 주차장, 조용히 머물기","persona":"정은 씨의 동료 하늘 씨 (가상, 20대 후반, 무교)",
 "context":{"intendedSec":480,"driveMin":12,"hour":12,"pack":"none","place":"회사 옥외 주차장","outsideC":12,"car":"그랜저 하이브리드 [가정]"},
 "t0Clock":"12:20:00","sessionStartT":9,
 "keyframes":build({"t0":(12,20,0)},START,B,mB,9,endT=470)}

# ---------- C ----------
C=[
 {"t":-60,"stage":"drive","signals":["gear:D","speedKph:10","wiper:INTERMITTENT"]},
 {"t":0,"stage":"arrive","signals":["gear:P","speedKph:0"]},
 {"t":8,"stage":"threshold","screen":S("","문을 닫고, 숨을 한 번 고를게요.",["마치기"]),
  "levers":{"ambient":{"pct":20,"hex":"#FFB15C","ms":8000},"fan":2,"seatHeat":1},"sound":SND("문을 닫고, 숨을 한 번 고를게요.","wood_x3",-12),"signals":["ui:start","saved:get_all"]},
 {"t":11,"stage":"threshold","levers":{"backrest":0.62,"fan":1}},
 {"t":78,"stage":"stay","levers":{"ambient":{"pct":15,"hex":"#FF9A3C","ms":20000}},"sound":SND("","none",None),"screen":S("","● ○ ○",["마치기"]),"signals":["wiper:OFF_after_park","bgm:skip_rain_because_real_rain"]},
 {"t":208,"stage":"pause_call","signals":["audiofocus:LOSS_TRANSIENT"],"sound":SND("","none",None),
  "screen":S("","잠시 멈춰 둘게요.",["마치기"]),"levers":{"ambient":{"pct":22,"ms":3000}}},
 {"t":278,"stage":"resume","signals":["audiofocus:GAIN"],"frozen":True,"screen":S("","이어서 머물러요.",["마치기"]),
  "levers":{"ambient":{"pct":15,"ms":8000}},"sound":SND("","none",None)},
 {"t":420,"stage":"door_open","signals":["door.driver.open:true"],"sound":SND("","none",None),
  "levers":{"ambient":{"pct":30,"hex":"#FFFFFF","ms":1500}},"screen":S("","",[])},
 {"t":475,"stage":"door_closed","signals":["door.driver.open:false","seat.driver.occupied:true"],
  "screen":S("이어서 머물까요?","",["이어서 머물기","마치기"])},
 {"t":482,"stage":"resume","signals":["ui:resume"],"levers":{"ambient":{"pct":15,"hex":"#FF9A3C","ms":8000}},"sound":SND("","none",None),"screen":S("","",["마치기"])},
 {"t":560,"stage":"safety_exit","signals":["gear:R"],"sound":SND("","none",None),
  "levers":{"ambient":{"pct":30,"hex":"#FFFFFF","ms":0},"fan":3,"seatHeat":0},"screen":S("","원래대로 돌렸어요.",[])},
 {"t":561,"stage":"safety_exit","signals":["seat.backrest:set_rejected_50001"],"levers":{}},
 {"t":575,"stage":"drive","signals":["gear:D","speedKph:6"],"screen":S("","",[])},
 {"t":650,"stage":"after","signals":["gear:P","prior.update:skipped_censored"],"screen":S("","등받이를 운전 자세로 돌릴까요?",["돌리기","그대로"]),"levers":{}},
]
mC=Model(600,25,18)
scC={"id":"C","title":"예외: 전화, 문 열림, 기어 이탈","persona":"정은 씨 (가상)",
 "context":{"intendedSec":600,"driveMin":25,"hour":18,"pack":"none","place":"마트 옥상 주차장, 비","outsideC":9,"car":"그랜저 하이브리드 [가정]"},
 "t0Clock":"18:50:00","sessionStartT":8,
 "keyframes":build({"t0":(18,50,0)},START,C,mC,8,pauses=((208,278),(420,482)),endT=560)}

doc={"version":1,"generated":"2026-11-15","note":"웹 시뮬레이터 재생용. t는 기어 P가 된 순간 0 기준 초. levers는 매 키프레임 전체 상태(차분 아님). ambient.ms는 그 값까지 가는 전이 시간. backrest 0~1은 세움 정도(SDK는 위치 지정 불가, 이동·정지만, P에서만). mirrorFolded는 앱 제어 불가, 차량 자체 동작 표시. vol은 앱 기준 음량 대비 dB, null은 무음. session.p는 EndingPolicy 사후확률(코드와 같은 식).",
 "assumptions":["intendedSec·운전 시간·LR·비용·σ는 [가정] 초깃값","외기온·차종은 [가정]","bell_once·wood_x3·leaves_wind는 자체 녹음 또는 CC0 예정 음원 이름"],
 "endingModel":{"prior":{"family":"lognormal","baseline":"max(60, intendedSec-90) * exp(0.10*ln(driveMin/30) + (hour>=22||hour<5 ? -0.10 : 0))",
   "nig":{"m":0.0,"kappa":2.0,"alpha":3.0,"beta":0.0648},"predictiveSigma":0.18},
   "update":"p <- p + (1-p) * (F(t)-F(t_prev))/(1-F(t_prev)); 신호마다 odds <- odds * LR",
   "likelihoodRatios":LR,"costs":{"lightEarly":1.0,"soundEarly":7/3,"wordsEarly":17/3,"late":1.0},
   "thresholds":{"LIGHT_RISE":0.5,"SOUND_FADE":0.7,"CLOSING_WORDS":0.85},"hysteresis":0.10,"hardCapSec":1800,"returnSec":90,
   "outputs":{"LIGHT_RISE":"앰비언트 +2%/분","SOUND_FADE":"배경음 -1dB/5초 페이드 시작","CLOSING_WORDS":"마침 문장 TTS 1회, 3분 안 재발화 금지"}},
 "scenarios":[scA,scB,scC]}
import os; json.dump(doc,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"scenarios.json"),"w"),ensure_ascii=False,indent=1)
for sc in doc["scenarios"]:
    print(sc["id"]); [print(" ",k["t"],k["clock"],k["stage"],k.get("session")) for k in sc["keyframes"] if "session" in k]
