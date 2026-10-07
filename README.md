# 하루결 · 오늘의 운세

이름·생년월일·태어난 시각으로 보는 규칙 기반 오늘의 운세 사이트입니다.
브라우저에서만 계산하고 서버로 아무것도 보내지 않습니다. 같은 사람은 하루 동안 같은 결과를 보고, 날짜가 바뀌면 결과도 바뀝니다.
API나 서버가 필요 없는 정적 사이트라 무료로 올릴 수 있습니다.

## 폴더 구조

| 경로 | 역할 |
|---|---|
| `index.html` | 페이지 |
| `css/style.css` | 디자인 (라이트/다크 모드) |
| `js/fortune.js` | 운세 생성 규칙과 문장 모음 |
| `js/app.js` | 화면 동작 |

## 인터넷에 올리기 (GitHub Pages, 무료)

1. GitHub에 가입하고 새 저장소(Repository)를 **Public**으로 만듭니다.
2. 저장소 화면의 **uploading an existing file**을 눌러 `index.html`, `README.md`, `css`, `js`를 끌어다 놓고 **Commit changes**를 누릅니다.
3. **Settings → Pages**에서 Source를 `Deploy from a branch`, Branch를 `main` / `/ (root)`로 저장합니다.
4. 1~3분 뒤 `https://<아이디>.github.io/<저장소이름>/` 주소로 사이트가 열립니다.

## 자주 바꿀 만한 것

- 사이트 이름: `index.html`의 `하루결`
- 운세 문장: `js/fortune.js`의 `OVERALL`, `CATEGORIES`, `ADVICE`, `QUOTES`
