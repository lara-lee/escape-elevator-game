// storage.js — 저장소 추상화 (단계별 최고 점수 + 최고 도달 층, F-012)
// LocalStorage 단일 접근점. 미지원/차단 시 메모리 폴백.
const Storage = (() => {
  const PFX = 'ee_best_';        // 최고 점수
  const FPFX = 'ee_floor_';      // 최고 도달 층(가장 낮은=깊은 층)
  const mem = {}, memF = {};
  let usable = true;

  function read(prefix, store, stage){
    if(!usable) return store[stage] || 0;
    try {
      const v = parseInt(localStorage.getItem(prefix + (stage || 1)) || '0', 10);
      return Number.isFinite(v) ? v : 0;
    } catch (e) { usable = false; return store[stage] || 0; }
  }
  function write(prefix, store, stage, v){
    store[stage] = v;
    if(!usable) return;
    try { localStorage.setItem(prefix + (stage || 1), String(v)); }
    catch (e) { usable = false; }
  }

  return {
    getBest:      s => read(PFX, mem, s),
    setBest:      (s, v) => write(PFX, mem, s, v),
    getBestFloor: s => read(FPFX, memF, s),        // 0 = 기록 없음
    setBestFloor: (s, v) => write(FPFX, memF, s, v),
  };
})();
