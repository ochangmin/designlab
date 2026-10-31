# BIPKO Studio

브라우저에서 동작하는 디자인·레이아웃 보드입니다. 다중 페이지 문서, 벡터 요소 모델,
템플릿, 그리고 화면과 동일한 결과를 내는 내보내기를 갖추고 있습니다.

[BIPKO](https://bipko.ai/)가 아이디어에서 영상까지를 잇는다면, Studio는 그 과정에서
계속 필요한 정지 이미지 — 썸네일, 포스터, 슬라이드 — 를 만드는 자리입니다. 지금은
독립 제품이고, 나중에 BIPKO로 흡수될 수 있게 만들어져 있습니다: [BRAND.md](BRAND.md).

**데모: <https://ochangmin.github.io/designlab/>** — `main`에 푸시하면
[GitHub Actions](.github/workflows/pages.yml)가 타입 검사·테스트·빌드를 거쳐 배포합니다.

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # 타입 검사 + 단위 테스트
npm run build      # dist/ 로 정적 빌드
```

Node 22.19 이상이 필요합니다(`package.json#engines`). 런타임 의존성은
React와 ReactDOM 둘뿐이며, 상태 관리·캔버스·아이콘 라이브러리는 쓰지 않습니다.

## 기능

**문서**

- 다중 페이지, 페이지 추가·복제·삭제·순서 변경
- 10가지 문서 크기 프리셋과 직접 입력, 작업 중 크기 변경
- 자동 저장(디바운스 700ms), 프로젝트 목록, `.designlab.json` 가져오기·내보내기
- 로그아웃 상태에서는 이 브라우저에, 로그인하면 계정에 저장

**요소**

- 도형 10종(사각형·원·삼각형·마름모·오각형·육각형·별·화살표·말풍선·선)
- 텍스트: 글꼴 10종(한글 글꼴 3종 포함), 굵기, 자간, 줄 간격, 정렬, 대문자, 밑줄, 기울임
- 이미지 업로드(PNG·JPEG·WebP·GIF·SVG, 8MB 한도)와 밝기·대비·채도·흑백·블러 보정
- 아이콘 25종, 단색/그라디언트 채우기, 외곽선, 점선, 그림자

**편집**

- 드래그 이동, 8방향 크기 조절, 회전(Shift로 15° 스냅), 회전된 요소도 정확히 처리
- 요소·페이지 가장자리와 중심에 대한 정렬 스냅 가이드
- 마키 선택, Shift 다중 선택, 그룹/그룹 해제, 잠금, 숨김
- 정렬 6종, 균등 분배, z-순서 변경, 페이지 중앙 배치
- 제스처 단위 실행 취소/다시 실행(최대 80단계)
- 캔버스에서 더블클릭해 바로 텍스트 편집, 입력에 따라 상자 높이 자동 조정

**내보내기**

- PNG / JPG (1×·2×·3×), SVG, PPTX(파워포인트), PDF, 편집용 JSON
- 다중 페이지 일괄 내보내기

**가져오기**

- `.pptx` — 슬라이드·도형·텍스트·이미지를 문서로 변환합니다. 자리표시자는 레이아웃에서 위치를
  물려받고, 표·차트처럼 대응 요소가 없는 개체는 **열기 전에 무엇이 빠지는지 목록으로** 알려줍니다.
  포맷 엔진이 포함된 빌드에서만 동작합니다(아래 참조).
- `.pdf` — 각 쪽을 렌더링해 한 장의 이미지로 가져옵니다. PDF에는 "수정할 수 있는 텍스트
  요소"라는 개념이 없으므로, 글자나 도형을 따로 고칠 수는 없고 그 위에 요소를 올려 편집합니다.
  이 점을 열기 전에 명시합니다.
- `.designlab.json` — 내보낸 디자인 파일

**계정**

- 이메일·비밀번호 가입과 로그인, 비밀번호 재설정
- Google, 카카오 로그인
- 관리자용 회원 관리: 가입 경로·가입일·상태 확인, 권한 변경, 사용 중지
- 계정 서버가 연결되지 않은 빌드에서는 편집과 로컬 저장이 그대로 동작

## 단축키

| 키 | 동작 |
| --- | --- |
| `Ctrl+Z` / `Ctrl+Shift+Z` | 실행 취소 / 다시 실행 |
| `Ctrl+C` / `Ctrl+X` / `Ctrl+V` | 복사 / 잘라내기 / 붙여넣기 |
| `Ctrl+D` | 복제 |
| `Ctrl+A` | 전체 선택 |
| `Ctrl+G` / `Ctrl+Shift+G` | 그룹 / 그룹 해제 |
| `Ctrl+[` / `Ctrl+]` | 뒤로 / 앞으로 (Shift: 맨 뒤·맨 앞) |
| `Ctrl+0` / `Ctrl+±` | 100% / 확대·축소 |
| `Delete` | 삭제 |
| 방향키 (`Shift`) | 1px (10px) 이동 |
| `Space` + 드래그 | 화면 이동 |
| `Ctrl` + 스크롤 | 커서 기준 확대·축소 |
| `Alt` + 드래그 | 스냅 없이 이동 |
| `Shift` + 크기 조절 | 비율 유지 |

## 구조

의존성은 안쪽으로만 흐릅니다. 자세한 내용은 [ARCHITECTURE.md](ARCHITECTURE.md)를 보세요.

```
src/domain/       순수 모델 — 문서, 기하, 변형, 줄바꿈, 파싱, 템플릿, 브랜드
src/application/  워크플로 — 에디터 스토어, 저장소, 인증, 자산, 내보내기 렌더러
src/ui/           React 어댑터 — 대시보드, 에디터 셸, 패널, 캔버스
supabase/         스키마와 RLS 정책 (migrations)
tests/            도메인·경계 단위 테스트 (vitest)
```

## 배포

두 곳에 떠 있고, 갱신 방식이 다릅니다.

| 대상 | 주소 | 갱신 |
| --- | --- | --- |
| GitHub Pages | <https://ochangmin.github.io/designlab/> | `main`에 푸시하면 자동 (타입 검사·테스트 통과 시) |
| Vercel | <https://designlab-gold.vercel.app> | 아래 명령으로 수동 |

```bash
npx vercel deploy --prod
```

Pages를 자동 배포 경로로 쓰고 Vercel은 필요할 때만 올리기로 했습니다. Vercel 프로젝트는
GitHub 저장소에 연결되어 있지 않으므로 푸시로는 갱신되지 않습니다 — 연결하려면 저장소에
쓰기 권한이 있는 GitHub 계정으로 Vercel 프로젝트의 Settings → Git에서 직접 연결해야
합니다. 빌드 설정은 [vercel.json](vercel.json)에 있고, 업로드 제외 목록은
[.vercelignore](.vercelignore)에 있습니다.

커스텀 도메인은 두 대상 중 한 곳에만 연결할 수 있습니다.

## 계정 서버 설정

계정 기능은 Supabase(Postgres + Auth)를 씁니다. 설정하지 않아도 앱은 그대로
동작하며, 이때 디자인은 브라우저에만 저장되고 로그인 버튼 자리에 "로컬 저장"이
표시됩니다.

**아래 작업은 계정과 키가 필요하므로 직접 하셔야 합니다.**

### 1. Supabase 프로젝트

[supabase.com](https://supabase.com)에서 프로젝트를 만들고, Project Settings →
API에서 **Project URL**과 **anon public** 키를 복사합니다. `service_role` 키는
절대 클라이언트에 넣지 마세요 — 이 앱은 anon 키만 사용하며, 접근 통제는 전부
아래 RLS가 담당합니다.

### 2. 스키마 적용

[supabase/migrations/0001_accounts_and_designs.sql](supabase/migrations/0001_accounts_and_designs.sql)을
SQL Editor에 붙여넣고 실행하거나, CLI로 적용합니다.

```bash
npx supabase db push
```

`profiles`·`designs` 테이블, 가입 시 프로필을 만드는 트리거, 그리고 본인 행만
읽고 쓰도록 하는 RLS 정책이 함께 만들어집니다.

### 3. 환경변수

로컬 개발은 저장소 루트에 `.env.local`을 만듭니다 (`.gitignore`에 이미
포함되어 커밋되지 않습니다).

```
VITE_SUPABASE_URL=https://<프로젝트>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public 키>
```

브랜드를 BIPKO 하우스 아이덴티티로 바꾸려면 `VITE_BRAND=bipko`를 더합니다. 기본값은
독립 브랜드(`studio`)이고, 자세한 내용은 [BRAND.md](BRAND.md)에 있습니다.

GitHub Pages 배포에도 넣으려면 저장소 Settings → Secrets and variables →
Actions에 같은 이름으로 등록하고, `.github/workflows/pages.yml`의 빌드 단계에
`env:`로 전달해야 합니다. anon 키는 공개되어도 되는 값이지만, 빌드 결과물에
포함되므로 이를 알고 쓰는 편이 좋습니다.

### 4. Google 로그인

[Google Cloud Console](https://console.cloud.google.com)에서 OAuth 2.0 클라이언트
ID를 만들고, 승인된 리디렉션 URI에 Supabase가 알려주는 콜백 주소를 넣습니다.

```
https://<프로젝트>.supabase.co/auth/v1/callback
```

발급된 클라이언트 ID와 secret을 Supabase의 Authentication → Providers → Google에
입력하고 켭니다.

### 5. 카카오 로그인

[Kakao Developers](https://developers.kakao.com)에서 앱을 만들고 카카오 로그인을
활성화한 뒤, Redirect URI에 위와 같은 Supabase 콜백 주소를 등록합니다. REST API
키와 Client Secret을 Supabase의 Authentication → Providers → Kakao에 입력합니다.
동의 항목에서 이메일을 받도록 설정해야 회원 목록에 이메일이 표시됩니다.

### 6. 앱으로 돌아올 주소

Supabase의 Authentication → URL Configuration에서 Site URL과 Redirect URLs에
앱 주소를 등록합니다. 개발용과 배포용을 모두 넣어야 합니다.

```
http://localhost:5173
https://ochangmin.github.io/designlab/
```

### 7. 첫 관리자

모든 계정은 `member`로 시작합니다. 본인 계정으로 가입한 뒤 SQL Editor에서 한 번만
승격하세요.

```sql
update public.profiles set role = 'admin' where email = '본인이메일';
```

클라이언트에서는 이 변경이 거부됩니다. 관리자는 데이터베이스를 가진 사람만 만들 수
있다는 뜻이고, 그게 의도입니다. 관리자는 자신의 권한과 상태를 바꿀 수 없어서
혼자뿐인 관리자가 스스로를 잠가버리는 일도 일어나지 않습니다.

## 설계상 알아둘 점

- **로그아웃 상태의 저장은 브라우저 로컬입니다.** `localStorage`에 저장되므로 같은
  브라우저에서만 목록이 보이고, 사이트 데이터를 지우면 함께 사라집니다. 로그인하면
  같은 포트를 통해 계정으로 저장되지만, 로컬에 있던 기존 디자인이 자동으로 옮겨가지는
  않습니다 — JSON으로 내보냈다가 로그인 후 다시 열면 됩니다.
- **결제·구독 기능은 없습니다.** 회원 관리까지만 구현되어 있습니다.
- **업로드한 이미지는 데이터 URL로 문서 안에 들어갑니다.** 그래서 저장·공유가 단순한
  대신 `localStorage` 용량(보통 5MB 내외)을 빠르게 소모합니다. 한도를 넘으면 자동 저장이
  실패했다고 명확히 알립니다.
- **PDF는 포맷 엔진이 씁니다.** 각 페이지를 렌더링해 PdfCraft가 그 둘레에 문서를 조립하므로,
  인쇄 창을 거치지 않고 바로 내려받습니다. 페이지 크기는 포인트 단위로 정확합니다(1920×1080px
  문서 → 1440×810pt). 엔진이 없는 빌드에서는 예전처럼 인쇄 창으로 넘어갑니다.
- **포맷 엔진은 선택 사항입니다.** `engine/`은 ArtCraft의 PPTX 리더·라이터
  ([storytold/deckcraft](https://github.com/storytold/deckcraft))와 PDF 리더·라이터
  ([storytold/pdfcraft](https://github.com/storytold/pdfcraft)) — 모두 Apache-2.0 또는 MIT —
  를 wasm32로 컴파일해 앱 옆에 서빙하는 다리입니다. CI가 별도 잡으로 빌드하며 실패해도 배포를
  막지 않고, 로컬에는 Rust 툴체인이 없어도 됩니다. 엔진이 없으면 앱이 그 사실을 알리고 내장
  라이터와 인쇄 창으로 동작합니다.
- **엔진은 7MB입니다**(PDF 렌더링 스택 포함, gzip 전송). 페이지 로드에는 포함되지 않고
  PPTX·PDF 작업을 처음 할 때만 받아옵니다.
- **PdfCraft의 렌더러는 vendor 포크에 의존합니다.** 상위 저장소가 `hayro` 계열과 `lopdf`를
  `[patch.crates-io]`로 포크에 연결하는데, git 의존성은 그 patch를 물려받지 못합니다. 그래서
  [engine/Cargo.toml](engine/Cargo.toml)이 같은 저장소를 git patch로 다시 가리킵니다. 이걸
  빼면 렌더러가 공개 crate의 없는 API를 참조해 17개 오류로 컴파일에 실패합니다.
- **PPTX는 텍스트만 편집 가능합니다.** 페이지를 z-순서대로 잘라 텍스트가 아닌 구간은
  이미지 레이어로 굽고, 텍스트 요소는 실제 파워포인트 텍스트 상자로 내보냅니다. 그래서
  제목은 수정할 수 있고 그라디언트·사용자 도형·이미지 보정은 모양이 유지되며, 텍스트 위에
  놓인 도형도 위에 남습니다. 도형 자체를 파워포인트에서 편집할 수는 없습니다. 글꼴이 보는
  사람의 PC에 없으면 대체 글꼴로 바뀝니다.
- **글꼴은 Google Fonts에서 불러옵니다.** 오프라인에서는 대체 글꼴로 렌더링되며, 이때
  줄바꿈 위치가 달라질 수 있습니다.
- **협업 기능은 없습니다.** 실시간 편집, 댓글, 공유 링크는 구현 범위 밖입니다.
