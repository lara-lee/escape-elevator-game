# 효과음 파일 넣는 곳 (sounds/)

아래 **파일명 그대로** mp3를 이 폴더에 넣으면 자동으로 재생됩니다.
파일이 없으면 그냥 무음으로 동작합니다(에러 없음). 매핑은 `js/audio.js` 에 있습니다.

| 파일명 | 재생 시점 | 검색용 영어 키워드 |
| --- | --- | --- |
| `button.mp3`   | UI 버튼 클릭        | `ui click`, `tap`, `pop`, `menu select` |
| `door.mp3`     | 문 닫기 시작        | `elevator door close`, `sliding door`, `whoosh`, `swoosh` |
| `tick.mp3`     | 카운트다운 3·2·1    | `countdown tick`, `clock tick`, `beep`, `blip` |
| `success.mp3`  | 출발 성공(한 층 하강)| `ding`, `chime`, `success`, `level up`, `correct` |
| `fail.mp3`     | 실패(승객 충돌)     | `buzzer`, `error`, `wrong`, `thud`, `bump`, `fail` |
| `recover.mp3`  | 하트 회복           | `power up`, `heal`, `coin`, `sparkle`, `pickup` |
| `clear.mp3`    | 단계 클리어(승리)   | `fanfare`, `victory`, `win jingle`, `level complete` |
| `gameover.mp3` | 게임 오버(실패)     | `game over`, `lose`, `defeat`, `sad trombone` |
| `bgm.mp3`      | 배경음악(루프, 선택)| `casual game loop`, `8-bit background music`, `chiptune loop` |

## 팁
- 형식: **mp3** 권장(가장 호환성 좋음). 길이는 효과음 0.2~1초, bgm은 루프되는 곡.
- 무료 음원 사이트: freesound.org, pixabay.com/sound-effects, mixkit.co, zapsplat.com
- 다른 파일명을 쓰고 싶으면 `js/audio.js` 의 `FILES` 매핑만 바꾸면 됩니다.
- bgm은 브라우저 자동재생 정책상 **첫 버튼 클릭(게임 시작/연습) 후** 재생됩니다.
