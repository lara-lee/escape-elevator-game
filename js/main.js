// main.js — 게임 루프(rAF + delta time) + 입력 + 글루
const game = new Game();

// PWA: 서비스워커 등록 (file:// 에서는 동작 안 하므로 건너뜀)
if('serviceWorker' in navigator && location.protocol !== 'file:'){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

window.addEventListener('DOMContentLoaded', () => {
  UI.init();
  Sound.initPrefs();
  UI.showScreen('menu');

  const $ = id => document.getElementById(id);

  // 버튼 클릭 효과음 (문 닫기·오디오 토글 버튼 제외)
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if(b && b.id !== 'btnClose' && b.id !== 'btnSfx' && b.id !== 'btnBgm') Sound.play('button');
  });

  // 효과음 / 배경음 토글 (각각)
  const btnBgm = $('btnBgm'), btnSfx = $('btnSfx');
  function refreshAudio(){
    const b = Sound.isBgmOn(), s = Sound.isSfxOn();
    btnBgm.classList.toggle('off', !b); $('bgmState').textContent = b ? 'ON' : 'OFF';
    btnSfx.classList.toggle('off', !s); $('sfxState').textContent = s ? 'ON' : 'OFF';
  }
  refreshAudio();
  btnBgm.addEventListener('click', () => { Sound.toggleBgm(); refreshAudio(); });
  btnSfx.addEventListener('click', () => { Sound.toggleSfx(); refreshAudio(); });
  // ⚙ 설정 패널 토글 + 바깥 클릭 시 닫기
  $('btnSettings').addEventListener('click', (e) => {
    e.stopPropagation();
    $('btnQuit').style.display = (game.state.screen === 'menu') ? 'none' : 'block';  // 메인에선 숨김
    $('settingsPanel').classList.toggle('open');
  });
  document.addEventListener('click', (e) => { if(!e.target.closest('.settings-wrap')) $('settingsPanel').classList.remove('open'); });
  // 설정 → 메인으로 나가기 (게임 중 종료)
  $('btnQuit').addEventListener('click', () => {
    $('settingsPanel').classList.remove('open');
    game.paused = false; UI.setPaused(false);
    game.toMenu(); UI.showScreen('menu'); Sound.startBgm();
  });

  // 일시정지 제어
  function setPause(on){
    if(game.state.screen !== 'playing') return;
    game.paused = on;
    UI.setPaused(on);
    if(on) Sound.stopBgm(); else Sound.startBgm();   // 일시정지 시 배경음도 멈춤/재개
  }

  // 메인 → 단계 선택
  $('btnStart').addEventListener('click', () => { Sound.startBgm(); UI.renderStageSelect(); UI.showScreen('stage'); });
  $('btnBack').addEventListener('click', () => UI.showScreen('menu'));

  // 연습 게임
  $('btnPractice').addEventListener('click', () => { Sound.startBgm(); game.startGame(0); });

  // 게임 방법
  $('btnHelp').addEventListener('click', () => UI.showScreen('help'));
  $('btnHelpBack').addEventListener('click', () => UI.showScreen('menu'));

  // 일시정지 / 재개 / 메인
  $('btnPause').addEventListener('click', () => setPause(!game.paused));
  $('btnResume').addEventListener('click', () => setPause(false));
  $('btnPauseHome').addEventListener('click', () => { setPause(false); game.toMenu(); UI.showScreen('menu'); });

  // 게임 중 나가기(🏠) → 메인
  $('btnExit').addEventListener('click', () => { game.paused = false; UI.setPaused(false); game.toMenu(); UI.showScreen('menu'); Sound.startBgm(); });

  // PWA 설치 버튼 (항상 표시)
  let deferredPrompt = null;
  const btnInstall = $('btnInstall');
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
  btnInstall.addEventListener('click', async () => {
    if(deferredPrompt){
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    } else {
      alert('앱 설치 방법\n\n• PC 크롬/엣지: 주소창 오른쪽 설치(⊕) 아이콘 또는 ⋮ 메뉴 → "앱 설치"\n• 안드로이드 크롬: ⋮ → "앱 설치"\n• 아이폰 사파리: 공유 → "홈 화면에 추가"\n\n※ file:// 가 아니라 localhost 또는 https 주소에서만 됩니다.');
    }
  });
  // 이미 설치되어 실행 중이면 버튼 숨김
  if(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) btnInstall.style.display = 'none';
  window.addEventListener('appinstalled', () => { btnInstall.style.display = 'none'; });

  // 단계 카드 → 게임 시작
  document.querySelectorAll('.stage-card').forEach(card => {
    card.addEventListener('click', () => game.startGame(parseInt(card.dataset.stage, 10)));
  });

  // 결과 화면 버튼 (배경음 재개)
  $('btnNext').addEventListener('click', () => {
    const s = game.state;
    Sound.startBgm();
    if(s.practice){ UI.renderStageSelect(); UI.showScreen('stage'); }
    else if(s.stageId < 5){ game.startGame(s.stageId + 1); }
  });
  $('btnRetry').addEventListener('click', () => { Sound.startBgm(); game.startGame(game.state.stageId); });
  $('btnHome').addEventListener('click', () => { Sound.startBgm(); game.toMenu(); UI.showScreen('menu'); });

  // 핵심 조작: pointerdown (터치+마우스 통합)
  $('btnClose').addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    if(game.paused) return;
    game.pressClose();
  });

  // 보너스 하트 탭해서 획득
  $('lane').addEventListener('pointerdown', (ev) => {
    const node = ev.target.closest('.heart-item');
    if(!node || game.paused) return;
    ev.preventDefault();
    game.collectHeart(parseInt(node.dataset.id, 10));
  });

  // 키보드: Esc/P 일시정지, Space/↓/Enter 문 닫기
  window.addEventListener('keydown', (ev) => {
    if(ev.repeat) return;
    if((ev.code === 'Escape' || ev.code === 'KeyP') && game.state.screen === 'playing'){
      ev.preventDefault(); setPause(!game.paused); return;
    }
    if(ev.code === 'Space' || ev.code === 'ArrowDown' || ev.code === 'Enter'){
      if(game.state.screen === 'playing' && !game.paused){ ev.preventDefault(); game.pressClose(); }
    }
  });

  // 게임 루프
  let last = 0;
  function frame(now){
    requestAnimationFrame(frame);
    if(!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if(dt > 0.05) dt = 0.05;            // 백그라운드 복귀 폭주 방지

    if(game.state.screen === 'playing' && !game.paused && !document.hidden){
      game.update(dt);
      for(const e of game.drainEvents()) UI.onEvent(e, game.state);
      UI.render(game.state);
    } else {
      for(const e of game.drainEvents()) UI.onEvent(e, game.state);
    }
  }
  requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => { last = 0; });
});
