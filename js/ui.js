// ui.js — 상태 → DOM 렌더링 + 화면 전환 + 연출 (게임 로직 비의존)
const UI = (() => {
  const $ = id => document.getElementById(id);
  let el = {};
  const nodes = new Map();   // passenger id -> DOM element
  const itemNodes = new Map(); // 보너스 하트 id -> DOM element
  const PW = 54;             // 승객 노드 폭(px)
  let lastFloor = 1;
  let dispScore = 0;         // 점수 롤링 표시값
  let lastCountStr = null;   // 카운트다운 직전 표시값

  const lerp = (a, b, t) => Math.round(a + (b - a) * t);
  function vibrate(ms){ try { if(navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  function init(){
    el = {
      menu:$('menu'), helpScreen:$('helpScreen'), stageScreen:$('stageScreen'), game:$('game'), result:$('result'),
      hudFloor:$('hudFloor'), hudScore:$('hudScore'), hudCombo:$('hudCombo'), hudComboN:$('hudComboN'),
      timeStat:$('timeStat'), hudTime:$('hudTime'),
      hearts:$('hearts'), stageTag:$('stageTag'), descentFill:$('descentFill'),
      descentRail:$('descentRail'), goalTag:$('goalTag'),
      stage:$('stage'), lane:$('lane'), elevator:$('elevator'), eleFloor:$('eleFloor'),
      doorLeft:$('doorLeft'), doorRight:$('doorRight'),
      btnClose:$('btnClose'), closeLabel:$('closeLabel'), closeFill:$('closeFill'),
      flash:$('flash'), countdown:$('countdown'), pauseOverlay:$('pauseOverlay'), sky:$('sky'),
      rEmoji:$('rEmoji'), rTitle:$('rTitle'), btnNext:$('btnNext'),
      rScore:$('rScore'), rStage:$('rStage'), rFloor:$('rFloor'), rSucc:$('rSucc'),
      rFail:$('rFail'), rTime:$('rTime'), rBest:$('rBest'), rBestFloor:$('rBestFloor'), rRecord:$('rRecord'),
    };
  }

  function showScreen(name){
    const map = { menu:el.menu, help:el.helpScreen, stage:el.stageScreen, game:el.game, result:el.result };
    for(const k in map) map[k].classList.toggle('active', k === name);
  }

  // 단계 선택 카드의 최고 점수 채우기
  function renderStageSelect(){
    for(const st of CONFIG.STAGES){
      const b = $('best' + st.id);
      if(b) b.textContent = Storage.getBest(st.id);
      const f = $('floor' + st.id);
      if(f){ const v = Storage.getBestFloor(st.id); f.textContent = v ? v + 'F' : '-'; }
    }
  }

  function clearLane(){ el.lane.innerHTML = ''; nodes.clear(); itemNodes.clear(); }

  function stageById(id){ return id === 0 ? CONFIG.PRACTICE : (CONFIG.STAGES.find(s => s.id === id) || CONFIG.STAGES[1]); }

  // ---------- 매 프레임 렌더 ----------
  function render(s){
    el.hudFloor.textContent = s.floor;
    el.eleFloor.textContent = s.floor;

    // 점수 롤링 애니메이션
    if(Math.abs(s.score - dispScore) < 1) dispScore = s.score;
    else dispScore += (s.score - dispScore) * 0.25;
    el.hudScore.textContent = Math.round(dispScore).toLocaleString();

    // 층별 배경 (고층=어두운 밤하늘 → 로비=따뜻하고 밝게) + 별/도시 불빛
    const bt = Math.min(1, s.successes / Math.max(1, s.totalFloors - 1));
    const top = lerp(22, 64, bt) + ',' + lerp(26, 50, bt) + ',' + lerp(52, 58, bt);
    const bot = lerp(12, 40, bt) + ',' + lerp(14, 28, bt) + ',' + lerp(32, 34, bt);
    el.stage.style.background = 'linear-gradient(180deg, rgb(' + top + ') 0%, rgb(' + bot + ') 100%)';
    if(el.sky) el.sky.style.opacity = ((1 - bt) * 0.85).toFixed(2);   // 고층일수록 진하게

    // 시작 카운트다운 (3·2·1·START)
    let cd = null, isGo = false;
    if(s.introTimer > 0) cd = String(Math.ceil(s.introTimer));
    else if(s.introTimer > -0.6){ cd = 'START'; isGo = true; }
    if(cd !== null){
      if(cd !== lastCountStr){
        el.countdown.textContent = cd;
        el.countdown.classList.toggle('go', isGo);
        el.countdown.classList.remove('show'); void el.countdown.offsetWidth; el.countdown.classList.add('show');
        lastCountStr = cd;
      }
    } else if(lastCountStr !== null){
      el.countdown.classList.remove('show'); lastCountStr = null;
    }

    if(s.combo > 1){
      el.hudCombo.style.display = 'flex';
      el.hudComboN.textContent = s.combo;
    } else {
      el.hudCombo.style.display = 'none';
    }

    // 제한 시간
    const stTime = stageById(s.stageId).time || 0;
    if(stTime > 0){
      el.timeStat.style.display = 'flex';
      el.hudTime.textContent = fmtTime(Math.max(0, s.timeLeft));
      el.timeStat.classList.toggle('low', s.timeLeft <= 15);
    } else {
      el.timeStat.style.display = 'none';
    }

    renderHearts(s);

    // 하강 진행도 (꼭대기 → 1층)
    const denom = Math.max(1, s.totalFloors - 1);
    el.descentFill.style.height = Math.min(100, (s.successes / denom) * 100) + '%';

    // 남은 층 / "거의 다 왔어요!"
    const remaining = Math.max(0, s.floor - 1);
    const near = remaining <= 3 && remaining > 0;
    el.goalTag.textContent = remaining <= 0 ? '🏁 로비 도착!'
      : near ? '🏁 거의 다 왔어요!'
      : '로비까지 ' + remaining + '층';
    el.goalTag.classList.toggle('near', near);
    el.descentRail.classList.toggle('near', near);

    // 문
    const frac = s.door === 'departing' ? 1
      : s.door === 'closing' ? Math.min(1, s.progress / CONFIG.DEPART_TIME) : 0;
    el.doorLeft.style.width = (frac * 50) + '%';
    el.doorRight.style.width = (frac * 50) + '%';

    // 닫기 버튼
    let txt = '🚪 문 닫기', dis = false;
    if(s.delayTimer > 0){ txt = '🚧 지연...'; dis = true; }
    else if(s.door === 'closing'){ txt = '닫는 중...'; dis = true; }
    else if(s.door === 'departing'){ txt = '🛗 출발!'; dis = true; }
    el.closeLabel.textContent = txt;
    el.btnClose.disabled = dis;
    el.closeFill.style.width = (frac * 100) + '%';

    renderPassengers(s);
    renderItems(s);
  }

  function renderItems(s){
    const spanX = Math.max(40, el.lane.clientWidth - PW);
    const spanY = Math.max(40, el.lane.clientHeight - 70);
    const seen = new Set();
    for(const it of s.items){
      seen.add(it.id);
      let n = itemNodes.get(it.id);
      if(!n){
        n = document.createElement('div');
        n.className = 'heart-item';
        n.dataset.id = it.id;
        n.innerHTML = '<span class="hi-emoji">❤️</span>';
        el.lane.appendChild(n);
        itemNodes.set(it.id, n);
      }
      n.style.transform = 'translate(' + (it.x * spanX).toFixed(1) + 'px,' + (it.y * spanY).toFixed(1) + 'px)';
    }
    for(const [id, n] of itemNodes){
      if(!seen.has(id)){ n.remove(); itemNodes.delete(id); }
    }
  }

  function renderHearts(s){
    let h = '';
    for(let i = 0; i < s.maxLives; i++){
      h += '<span class="heart">' + (i < s.lives ? '❤️' : '🤍') + '</span>';
    }
    el.hearts.innerHTML = h;
  }

  function renderPassengers(s){
    const span = Math.max(40, el.lane.clientWidth - PW);
    const seen = new Set();
    for(const p of s.passengers){
      seen.add(p.id);
      let n = nodes.get(p.id);
      if(!n){
        n = document.createElement('div');
        n.className = 'passenger';
        n.dataset.type = p.type;
        n.style.setProperty('--pc', p.color);
        n.innerHTML =
          (p.trait ? '<span class="p-trait">' + p.trait + '</span>' : '') +
          '<span class="p-emoji">' + p.emoji + '</span>' +
          '<span class="p-name">' + p.label + '</span>';
        el.lane.appendChild(n);
        nodes.set(p.id, n);
      }
      n.style.transform = 'translateX(' + (p.pos * span).toFixed(1) + 'px)';
      n.classList.toggle('danger', !!p.danger);   // 연습 모드 위험 표시
    }
    for(const [id, n] of nodes){
      if(!seen.has(id)){ n.remove(); nodes.delete(id); }
    }
  }

  // ---------- 이벤트 연출 ----------
  function onEvent(e, s){
    switch(e.type){
      case 'start': {
        clearLane();
        lastFloor = s.floor;
        dispScore = 0;
        lastCountStr = null;
        el.countdown.classList.remove('show');
        el.pauseOverlay.classList.remove('show');
        const st = stageById(s.stageId);
        el.stageTag.textContent = s.practice ? '🎯 연습 게임' : (st.label + ' · ' + st.floors + '층 빌딩');
        showScreen('game');
        Sound.play('start');           // 3·2·1·START 사운드
        break;
      }
      case 'closing':
        Sound.play('door');
        break;
      case 'fail':
        flash('fail');
        shake(e.force);
        el.hearts.classList.remove('hit'); void el.hearts.offsetWidth; el.hearts.classList.add('hit');
        floatText('💔 -1', 'fail');
        Sound.play('fail');
        vibrate(e.force ? [40, 50, 80] : 60);
        break;
      case 'success':
        flash('success');
        floatText('+' + e.gained, 'success');
        descend();
        popFloor();
        break;
      case 'heartget':
        el.hearts.classList.remove('pop'); void el.hearts.offsetWidth; el.hearts.classList.add('pop');
        floatText(e.full ? '+50' : '❤️ +1', 'heart');
        Sound.play('recover');
        break;
      case 'blocked':
        bump(el.btnClose);
        break;
      case 'gameover':
        Sound.stopBgm();              // 결과 화면에서 배경음 정지
        renderResult(s);
        showScreen('result');
        if(s.won){ Sound.play('clear'); vibrate([0, 40, 60, 40, 120]); }
        else { Sound.play('gameover'); vibrate(200); }
        break;
    }
  }

  function descend(){
    el.elevator.classList.remove('descend'); void el.elevator.offsetWidth;
    el.elevator.classList.add('descend');
    setTimeout(() => el.elevator.classList.remove('descend'), 850);
  }
  function popFloor(){
    [el.hudFloor, el.eleFloor].forEach(node => {
      node.classList.remove('pop'); void node.offsetWidth; node.classList.add('pop');
      setTimeout(() => node.classList.remove('pop'), 500);
    });
  }
  function flash(kind){
    el.flash.className = 'flash show ' + kind;
    setTimeout(() => { el.flash.className = 'flash'; }, 280);
  }
  function shake(strong){
    el.stage.classList.remove('shake', 'shake-strong'); void el.stage.offsetWidth;
    el.stage.classList.add(strong ? 'shake-strong' : 'shake');
    setTimeout(() => el.stage.classList.remove('shake', 'shake-strong'), 420);
  }
  function bump(node){
    node.classList.remove('bump'); void node.offsetWidth; node.classList.add('bump');
    setTimeout(() => node.classList.remove('bump'), 300);
  }
  function floatText(text, kind){
    const f = document.createElement('div');
    f.className = 'float ' + kind;
    f.textContent = text;
    el.stage.appendChild(f);
    setTimeout(() => f.remove(), 950);
  }

  // ---------- 결과 화면 ----------
  function setPaused(on){ el.pauseOverlay.classList.toggle('show', on); }

  function renderResult(s){
    const st = stageById(s.stageId);
    if(s.won){
      el.rEmoji.textContent = s.practice ? '🎯' : '🎉';
      el.rTitle.textContent = s.practice ? '연습 완료!' : '퇴근 성공!';
      el.rStage.textContent = s.practice ? '이제 단계에 도전해보세요!'
        : st.label + ' · ' + st.name + ' 클리어! (1층 로비 도착)';
    } else if(s.timeout){
      el.rEmoji.textContent = '⏰';
      el.rTitle.textContent = '시간 초과!';
      el.rStage.textContent = st.label + ' · ' + st.name + ' · ' + s.floor + 'F에서 시간 종료';
    } else {
      el.rEmoji.textContent = '🫠';
      el.rTitle.textContent = '퇴근 실패…';
      el.rStage.textContent = st.label + ' · ' + st.name + ' · ' + s.floor + 'F에서 야근';
    }
    // 다음 단계 버튼: 승리 시에만 (연습 → 단계 도전 / 일반 → 다음 단계)
    if(s.won && s.practice){ el.btnNext.style.display = 'inline-block'; el.btnNext.textContent = '단계 도전 ▶'; }
    else if(s.won && s.stageId < 5){ el.btnNext.style.display = 'inline-block'; el.btnNext.textContent = '다음 단계 ▶'; }
    else el.btnNext.style.display = 'none';
    el.rScore.textContent = s.score;
    el.rFloor.textContent = s.floor;
    el.rSucc.textContent = s.successes;
    el.rFail.textContent = s.fails;
    el.rTime.textContent = fmtTime(s.elapsed);
    el.rBest.textContent = s.best;
    if(el.rBestFloor) el.rBestFloor.textContent = s.practice ? '-' : (s.bestFloor ? s.bestFloor + 'F' : '-');
    el.rRecord.style.display = s.newRecord ? 'block' : 'none';
  }

  function fmtTime(sec){
    const t = Math.floor(sec);
    return Math.floor(t / 60) + ':' + (t % 60).toString().padStart(2, '0');
  }

  return { init, showScreen, renderStageSelect, clearLane, render, onEvent, setPaused };
})();
