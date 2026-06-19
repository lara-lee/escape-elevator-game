// config.js — 밸런스 상수 · 승객 · 단계 정의
const CONFIG = {
  START_FLOOR: 1,
  INTRO_TIME: 3.0,         // 게임 시작 카운트다운(3·2·1) 시간 + START 표시
  DEPART_TIME: 3.0,         // 문 닫힘 유지 → 출발 (F-003)
  DEPART_ANIM: 0.85,        // 출발/상승 연출 시간(초)
  LIVES: 3,                 // 기본 하트 수
  HEART_RECOVER: 10,        // 출발 성공 N회마다 하트 1개 회복(최대치까지)
  SUCCESS_SCORE: 100,       // 출발 성공 점수 (F-008)
  COMBO_BONUS: 30,          // 콤보 보너스/연속 성공 (F-013)
  DELAY_TIME: 1.5,          // 택배 기사 '지연' 효과(닫기 잠금, 초)

  // 진행도(내려간 층수)에 따른 추가 난이도(선택한 단계 위에 누적)
  SPAWN_FLOOR_FACTOR: 0.015,
  SPAWN_FLOOR_MAX: 0.5,
  SPEED_FLOOR_FACTOR: 0.015,
  SPEED_FLOOR_MAX: 0.9,

  // 승객 (prob 합 = 1.0)
  //  color: 위험도 색 / trait: 특징 아이콘 / speed: 레인 기준 초당 이동 비율
  //  stageOnly: 특정 단계에서만 등장(예: 대표는 stage.extra 에 'ceo' 있을 때만)
  PASSENGERS: [
    { type:'intern',   label:'인턴', emoji:'🎓',    prob:0.20, speed:0.13, effect:'reopen', color:'#10b981', trait:'🐢' },
    { type:'employee', label:'사원', emoji:'🧑‍💼', prob:0.60, speed:0.16, effect:'reopen', color:'#3b82f6', trait:''   },
    { type:'courier',  label:'택배', emoji:'📦',    prob:0.10, speed:0.20, effect:'delay',  color:'#f59e0b', trait:'⏱'  },
    { type:'manager',  label:'부장', emoji:'👔',    prob:0.10, speed:0.25, effect:'force',  color:'#ef4444', trait:'⚡'  },
    { type:'ceo',      label:'대표', emoji:'🕴️',   prob:0.16, speed:0.34, effect:'force',  color:'#a855f7', trait:'💨', stageOnly:true },
  ],

  // 단계 1~4 (spawn 간격·속도 배수가 다름). 층수 난이도는 이 위에 누적.
  //  floors: 빌딩 총 층수(꼭대기 시작 → 1층 로비 도착 시 퇴근 성공)
  //  recovers: 하강 도중 하트를 채워주는 횟수(균등 체크포인트, 최대치까지)
  STAGES: [
    { id:1, label:'1단계', name:'느긋한 오후', emoji:'☕', color:'#10b981', floors:10, recovers:1, spawnMin:2.3,  spawnMax:3.9, speedMul:0.85, lives:3, dots:1 },
    { id:2, label:'2단계', name:'평범한 퇴근', emoji:'🚶', color:'#3b82f6', floors:20, recovers:2, spawnMin:1.7,  spawnMax:3.1, speedMul:1.00, lives:3, dots:2 },
    { id:3, label:'3단계', name:'러시아워',   emoji:'🏃', color:'#f59e0b', floors:30, recovers:3, spawnMin:1.25, spawnMax:2.4, speedMul:1.20, lives:3, dots:3 },
    { id:4, label:'4단계', name:'야근 지옥',   emoji:'🔥', color:'#ef4444', floors:40, recovers:4, spawnMin:0.95, spawnMax:1.8, speedMul:1.45, lives:3, dots:4 },
    { id:5, label:'5단계', name:'대표님 등장', emoji:'😈', color:'#a855f7', floors:50, recovers:5, spawnMin:0.8,  spawnMax:1.6, speedMul:1.6,  lives:3, dots:5, extra:['ceo'] },
  ],

  // 연습 모드 — 위험 미리보기(빨간 표시) 켜짐, 쉬운 설정
  PRACTICE: { id:0, label:'연습', name:'연습 게임', emoji:'🎯', color:'#8b5cf6', floors:6, recovers:0, spawnMin:2.8, spawnMax:4.4, speedMul:0.8, lives:5, dots:0, practice:true },
};
