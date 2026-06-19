// audio.js — 효과음/배경음 매니저
// sounds/ 폴더의 실제 파일명에 매핑. 파일 없으면 조용히 무시.
const Sound = (() => {
  const FILES = {
    button:   'sounds/button.mp3',     // UI 버튼 클릭
    door:     'sounds/closedoor.mp3',  // 문 닫기
    start:    'sounds/racestart.mp3',  // 게임 시작 카운트다운(3·2·1·START)
    tick:     'sounds/tick.mp3',       // (예비) 카운트다운 틱
    fail:     'sounds/fail.mp3',       // 실패(충돌)
    recover:  'sounds/recover.mp3',    // 하트 회복
    clear:    'sounds/victory.mp3',    // 단계 클리어
    gameover: 'sounds/youlose.mp3',    // 게임 오버
    bgm:      'sounds/bgm.mp3',        // 배경음악(루프)
  };
  const cache = {};
  let sfxOn = true, bgmOn = true;
  let bgmEl = null;

  function initPrefs(){
    try {
      sfxOn = localStorage.getItem('ee_sfx') !== '0';
      bgmOn = localStorage.getItem('ee_bgm') !== '0';
    } catch (e) {}
  }
  function isSfxOn(){ return sfxOn; }
  function isBgmOn(){ return bgmOn; }

  function base(name){
    if(cache[name]) return cache[name];
    const a = new Audio(FILES[name]);
    a.preload = 'auto';
    cache[name] = a;
    return a;
  }

  // 효과음: clone 으로 겹쳐 재생 허용
  function play(name, vol){
    if(!sfxOn || !FILES[name]) return;
    try {
      const a = base(name).cloneNode();
      a.volume = vol == null ? 1 : vol;
      const p = a.play();
      if(p && p.catch) p.catch(() => {});
    } catch (e) {}
  }

  function startBgm(){
    if(!bgmOn || !FILES.bgm) return;
    try {
      if(!bgmEl){ bgmEl = new Audio(FILES.bgm); bgmEl.loop = true; bgmEl.volume = 0.4; }
      const p = bgmEl.play();
      if(p && p.catch) p.catch(() => {});
    } catch (e) {}
  }
  function stopBgm(){ if(bgmEl){ try { bgmEl.pause(); } catch (e) {} } }

  function toggleSfx(){
    sfxOn = !sfxOn;
    try { localStorage.setItem('ee_sfx', sfxOn ? '1' : '0'); } catch (e) {}
    return sfxOn;
  }
  function toggleBgm(){
    bgmOn = !bgmOn;
    try { localStorage.setItem('ee_bgm', bgmOn ? '1' : '0'); } catch (e) {}
    if(bgmOn) startBgm(); else stopBgm();
    return bgmOn;
  }

  return { initPrefs, isSfxOn, isBgmOn, play, startBgm, stopBgm, toggleSfx, toggleBgm };
})();
