// storage.js — 저장소 추상화 (단계별 최고 점수, F-012)
// LocalStorage 단일 접근점. 미지원/차단 시 메모리 폴백.
const Storage = (() => {
  const PFX = 'ee_best_';
  const mem = {};         // 폴백용 메모리 저장
  let usable = true;

  const key = stage => PFX + (stage || 1);

  function getBest(stage){
    if(!usable) return mem[stage] || 0;
    try {
      const v = parseInt(localStorage.getItem(key(stage)) || '0', 10);
      return Number.isFinite(v) ? v : 0;
    } catch (e) {
      usable = false;
      return mem[stage] || 0;
    }
  }

  function setBest(stage, v){
    mem[stage] = v;
    if(!usable) return;
    try {
      localStorage.setItem(key(stage), String(v));
    } catch (e) {
      usable = false;
    }
  }

  return { getBest, setBest };
})();
