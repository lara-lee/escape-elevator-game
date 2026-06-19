// game.js — 게임 상태 + 순수 로직 (DOM 비의존)
class Game {
  constructor(){
    this._id = 0;
    this.events = [];
    this.paused = false;
    this.stage = CONFIG.STAGES[1];   // 기본 2단계 (freshState 안전용)
    this.state = this.freshState();
  }

  // id 0 = 연습, 1~4 = 일반 단계
  getStage(id){
    if(id === 0) return CONFIG.PRACTICE;
    return CONFIG.STAGES.find(s => s.id === id) || CONFIG.STAGES[1];
  }

  // 단계 빌딩 높이에 맞춰 하트 회복 체크포인트(내려간 층수) 계산
  recoverCheckpoints(st){
    const r = st.recovers || 0;
    const pts = [];
    if(r > 0){
      const seg = (st.floors - 1) / (r + 1);
      for(let i = 1; i <= r; i++) pts.push(Math.round(i * seg));
    }
    return pts;
  }

  freshState(){
    const st = this.stage;
    return {
      screen: 'menu',                // 'menu' | 'stage' | 'playing' | 'gameover'
      stageId: st.id,
      practice: !!st.practice,        // 연습 모드 여부(위험 미리보기)
      totalFloors: st.floors,        // 빌딩 총 층수(시작 = 꼭대기)
      floor: st.floors,              // 현재 층(꼭대기에서 시작 → 1층으로 하강)
      heartCheckpoints: this.recoverCheckpoints(st),
      introTimer: 0,                  // 시작 카운트다운(3·2·1·START)
      won: false,
      score: 0,
      combo: 0,
      lives: st.lives,
      maxLives: st.lives,
      door: 'open',                  // 'open' | 'closing' | 'departing'
      progress: 0,
      departTimer: 0,
      delayTimer: 0,
      passengers: [],
      items: [],                     // 보너스 하트 아이템 {id,pos}
      spawnTimer: 0,
      gameOver: false,
      newRecord: false,
      best: 0,
      bestFloor: 0,                  // 단계별 최고 도달 층(가장 깊이 내려간 층)
      // 통계
      fails: 0,
      successes: 0,
      elapsed: 0,
    };
  }

  drainEvents(){ const e = this.events; this.events = []; return e; }

  // ---------- 화면 전환 ----------
  toMenu(){ this.paused = false; this.state = this.freshState(); this.state.screen = 'menu'; }

  // F-001 게임 시작 / F-011 다시하기 (단계 지정, 0=연습)
  startGame(stageId){
    const st = this.getStage(stageId);
    this.stage = st;
    this.paused = false;
    this.state = this.freshState();
    this.state.best = Storage.getBest(st.id);
    this.state.bestFloor = Storage.getBestFloor(st.id);
    this.state.screen = 'playing';
    this.state.introTimer = CONFIG.INTRO_TIME;   // 시작 카운트다운
    this.state.spawnTimer = this.spawnInterval();
    this.events.push({ type: 'start' });
  }

  // ---------- 입력 ----------
  pressClose(){                       // F-002
    const s = this.state;
    if(s.screen !== 'playing' || s.door !== 'open') return;
    if(s.introTimer > -0.6) return;    // 시작 카운트다운 중에는 무시
    if(s.delayTimer > 0){ this.events.push({ type:'blocked', reason:'delay' }); return; }
    s.door = 'closing';
    s.progress = 0;
    this.events.push({ type: 'closing' });
  }

  // ---------- 메인 업데이트 (delta time) ----------
  update(dt){
    const s = this.state;
    if(s.screen !== 'playing') return;

    // 시작 카운트다운(3·2·1·START) 동안 대기 — 생성/이동/입력 정지
    if(s.introTimer > -0.6){
      s.introTimer -= dt;
      if(s.introTimer <= -0.6) s.spawnTimer = this.spawnInterval();
      return;
    }

    s.elapsed += dt;
    if(s.delayTimer > 0) s.delayTimer = Math.max(0, s.delayTimer - dt);

    if(s.door === 'departing'){
      s.departTimer -= dt;
      if(s.departTimer <= 0){
        if(s.won){ this.finishGame(true); return; }   // 1층 도착 → 퇴근 성공
        s.door = 'open';
        s.progress = 0;
        s.spawnTimer = this.spawnInterval();
      }
      return;
    }

    // F-004 승객 생성
    s.spawnTimer -= dt;
    if(s.spawnTimer <= 0){
      this.spawn();
      s.spawnTimer = this.spawnInterval();
    }

    // F-005 이동 + F-006 충돌
    const scale = this.speedScale();
    const remain = [];
    for(const p of s.passengers){
      p.pos -= p.speed * scale * dt;
      if(p.pos <= 0){
        if(s.door === 'closing' && !s.gameOver) this.fail(p);
        // 도착 승객 제거
      } else {
        // 연습 모드: 지금 닫으면 3초 안에 도착할 승객 = 위험
        if(s.practice) p.danger = (p.pos / (p.speed * scale)) < CONFIG.DEPART_TIME;
        remain.push(p);
      }
    }
    s.passengers = remain;
    if(s.gameOver) return;

    // 보너스 하트 낙하(바닥 도달 시 미획득 → 사라짐)
    if(s.items.length){
      const ri = [];
      for(const it of s.items){
        it.y += CONFIG.HEART_FALL * dt;
        if(it.y < 1) ri.push(it);
      }
      s.items = ri;
    }

    // F-003 출발 판정
    if(s.door === 'closing'){
      s.progress += dt;
      if(s.progress >= CONFIG.DEPART_TIME) this.depart();
    }
  }

  // F-006 출발 실패 → 하트 -1
  fail(p){
    const s = this.state;
    s.door = 'open';
    s.progress = 0;
    s.combo = 0;
    s.fails++;
    s.lives = Math.max(0, s.lives - 1);
    if(p.effect === 'delay') s.delayTimer = Math.max(s.delayTimer, CONFIG.DELAY_TIME);
    this.events.push({ type:'fail', passenger:p, lives:s.lives, force:p.effect === 'force' });
    if(s.lives <= 0) this.finishGame(false);   // 하트 소진 → 야근(실패)
  }

  // F-003 출발 성공(한 층 하강) / F-008 / F-009 / F-013 + 하트 회복
  depart(){
    const s = this.state;
    s.floor--;                                 // 한 층 내려감 (퇴근 방향)
    s.combo++;
    s.successes++;
    const bonus = s.combo > 1 ? (s.combo - 1) * CONFIG.COMBO_BONUS : 0;
    const gained = CONFIG.SUCCESS_SCORE + bonus;
    s.score += gained;

    // 체크포인트 도달 시 보너스 하트 아이템 등장(탭해서 획득)
    if(s.heartCheckpoints.indexOf(s.successes) !== -1) this.spawnHeart();

    const reachedLobby = s.floor <= 1;
    if(reachedLobby){ s.floor = 1; s.won = true; }

    s.door = 'departing';
    s.departTimer = CONFIG.DEPART_ANIM;
    s.progress = CONFIG.DEPART_TIME;
    this.events.push({ type:'success', gained, combo:s.combo, floor:s.floor, last:reachedLobby });
  }

  // F-010 종료 (won=true: 퇴근 성공 / false: 야근 실패) + F-012 단계별 최고 점수
  finishGame(won){
    const s = this.state;
    s.gameOver = true;
    s.won = won;
    s.screen = 'gameover';
    s.door = 'open';
    if(!s.practice){                       // 연습은 기록 저장 안 함
      const prev = Storage.getBest(s.stageId);
      if(s.score > prev){
        s.best = s.score;
        s.newRecord = true;
        Storage.setBest(s.stageId, s.score);
      } else {
        s.best = prev;
      }
      // 최고 도달 층(가장 낮은=깊은 층) 갱신
      const pf = Storage.getBestFloor(s.stageId);
      if(!pf || s.floor < pf){ Storage.setBestFloor(s.stageId, s.floor); s.bestFloor = s.floor; }
      else { s.bestFloor = pf; }
    }
    this.events.push({ type:'gameover', won });
  }

  // 보너스 하트 아이템 (하늘에서 낙하 — x: 가로위치, y: 0=위 → 1=바닥)
  spawnHeart(){ this.state.items.push({ id: this._id++, x: 0.1 + Math.random() * 0.8, y: 0 }); }

  collectHeart(id){
    const s = this.state;
    const i = s.items.findIndex(it => it.id === id);
    if(i < 0) return;
    s.items.splice(i, 1);
    if(s.lives < s.maxLives){ s.lives++; this.events.push({ type:'heartget', full:false }); }
    else { s.score += 50; this.events.push({ type:'heartget', full:true }); }
  }

  // ---------- 헬퍼 ----------
  spawn(){
    const d = this.pickType();
    this.state.passengers.push({
      id: this._id++,
      type: d.type, label: d.label, emoji: d.emoji,
      effect: d.effect, speed: d.speed, color: d.color, trait: d.trait,
      pos: 1.0,
    });
  }

  pickType(){
    const extra = this.stage.extra || [];
    const pool = CONFIG.PASSENGERS.filter(d => !d.stageOnly || extra.indexOf(d.type) !== -1);
    const total = pool.reduce((a, d) => a + d.prob, 0);
    let r = Math.random() * total, acc = 0;
    for(const d of pool){ acc += d.prob; if(r <= acc) return d; }
    return pool[0];
  }

  spawnInterval(){
    const prog = this.state.successes;          // 내려간 층수 = 진행도
    const t = Math.min(CONFIG.SPAWN_FLOOR_MAX, prog * CONFIG.SPAWN_FLOOR_FACTOR);
    const mn = this.stage.spawnMin * (1 - t);
    const mx = this.stage.spawnMax * (1 - t);
    return mn + Math.random() * (mx - mn);
  }

  speedScale(){
    return this.stage.speedMul *
      (1 + Math.min(CONFIG.SPEED_FLOOR_MAX, this.state.successes * CONFIG.SPEED_FLOOR_FACTOR));
  }
}
