# 퇴근 엘리베이터 (Escape Elevator)

문이 닫히기 직전 뛰어드는 사람들을 피해 엘리베이터를 출발시키는 캐주얼 웹게임.
기획·명세는 [docs/](docs/) 참고 ([기획안](docs/planning.html) · [기능 명세서](docs/기능명세서.html) · [사용자 흐름](docs/user-flow.html)).

## 실행

별도 빌드 없음. `index.html` 을 브라우저로 열면 됩니다.

> LocalStorage(최고 점수)는 `file://` 에서도 동작하지만, 일부 브라우저 정책상
> 로컬 서버로 여는 것이 안전합니다: `npx serve` 또는 `python -m http.server`

## 플레이 방법

- **🚪 문 닫기** 버튼을 눌러 문을 닫습니다.
- 3초 동안 방해받지 않으면 **출발 성공** → 층수↑ · 점수+100 · 스트레스−10.
- 닫는 도중 승객이 도착하면 **실패** → 문 재개방 · 스트레스 증가.
- 스트레스가 **100%** 가 되면 게임 오버.

| 승객 | 확률 | 스트레스 | 특징 |
| --- | --- | --- | --- |
| 🧑‍💼 일반 사원 | 60% | +5 | 기본 |
| 🧑‍🎓 인턴 | 20% | +3 | 느림 |
| 📦 택배 기사 | 10% | +10 | 지연 유발 |
| 🤵 부장님 | 10% | +20 | 빠름·최대 위협 |

## 구조

```
index.html        진입점 (3개 화면: 메인/게임/결과)
styles.css        스타일 (모바일 우선, DOM 렌더링)
js/
  config.js       밸런스 상수 · 승객 정의
  storage.js      LocalStorage 추상화 (F-012)
  game.js         게임 상태 + 순수 로직 (DOM 비의존)
  ui.js           상태 → DOM 렌더링 + 연출
  main.js         게임 루프(rAF+delta time) + 입력(pointer)
docs/             기획·명세 문서 (HTML)
```

설계 원칙(로직/화면 분리, 저장소 추상화, pointer 입력, delta-time 루프)은
[기획안 11장 PWA 전환 계획](docs/planning.html) 을 따랐습니다.

## 다음 단계 (2차 · PWA)

`manifest.webmanifest` + Service Worker(cache-first) 추가로 오프라인·설치형 앱으로
전환 가능. 현재 코드는 모두 상대경로 + 클라이언트 완결 구조라 추가 작업만으로 됩니다.
