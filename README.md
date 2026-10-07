# 하루결 · 오늘의 운세

- **오늘의 운세**: 이름·생년월일·태어난 시각으로 만드는 규칙 기반 운세. 브라우저에서만 계산하고 서버로 아무것도 보내지 않습니다. 같은 사람은 하루 동안 같은 결과를 보고, 날짜가 바뀌면 결과도 바뀝니다.
- **별자리 운세**: GitHub Actions가 매일 한국 시간 00:05에 Claude API로 12별자리 운세를 새로 써서 `data/zodiac.js`를 업데이트합니다.

## 폴더 구조

| 경로 | 역할 |
|---|---|
| `index.html` | 페이지 |
| `css/style.css` | 디자인 (라이트/다크 모드) |
| `js/fortune.js` | 오늘의 운세 생성 규칙과 문장 모음 |
| `js/app.js` | 화면 동작, 별자리 카드와 동물 |
| `data/zodiac.js` | 오늘의 별자리 운세 데이터 (자동 생성) |
| `scripts/generate-zodiac.mjs` | 별자리 운세 생성 스크립트 |
| `.github/workflows/daily-zodiac.yml` | 매일 자동 실행 설정 |

## 인터넷에 올리기 (GitHub Pages, 무료)

1. **GitHub 가입** 후 새 저장소(Repository)를 만듭니다. 공개(Public)로 만들어야 무료로 Pages를 쓸 수 있어요.
2. 저장소 페이지에서 **Add file → Upload files**를 눌러 이 폴더의 파일을 모두 끌어다 놓고 커밋합니다.
   - `.github` 폴더처럼 이름이 점으로 시작하는 폴더도 꼭 함께 올려 주세요.
3. **Anthropic API 키 발급**: https://console.anthropic.com 에서 키를 만들고 결제 수단을 등록합니다.
4. 저장소의 **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `ANTHROPIC_API_KEY`
   - Secret: 발급받은 키
5. **Settings → Pages**에서 Source를 `Deploy from a branch`, Branch를 `main` / `/ (root)`로 저장합니다.
   몇 분 뒤 `https://<아이디>.github.io/<저장소이름>/` 주소로 사이트가 열립니다.
6. **Actions** 탭 → "별자리 운세 매일 업데이트" → **Run workflow**로 한 번 수동 실행해서 잘 동작하는지 확인합니다.
   이후로는 매일 자정에 자동으로 실행됩니다.

## 자주 바꿀 만한 것

- 사이트 이름: `index.html`의 `하루결`
- 운세 문장: `js/fortune.js`의 `OVERALL`, `CATEGORIES`, `ADVICE`, `QUOTES`
- 별자리 동물과 배경색: `js/app.js`의 `ZODIAC_META`
- 별자리 운세 말투: `scripts/generate-zodiac.mjs`의 `SYSTEM`
