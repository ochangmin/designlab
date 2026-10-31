# BIPKO Studio — 브랜드

## 무엇인가

BIPKO Studio는 **디자인·레이아웃 보드**입니다. BIPKO(<https://bipko.ai/>)가
아이디어 → 스토리보드 → 영상 → 피드백을 잇는다면, Studio는 그 과정에서 계속
필요한 **정지 이미지**를 만드는 자리입니다 — 썸네일, 포스터, 슬라이드, 소셜 컷.

지금은 독립 제품으로 서 있고, 나중에 BIPKO에 흡수될 수 있도록 만들어졌습니다.
그 흡수가 재설계가 아니라 **스위치 하나**가 되도록 아래 구조를 잡았습니다.

## 한 줄

> 생각한 그대로를 바로 디자인으로

## 이름

- 정식: **BIPKO Studio**
- 짧게: **Studio** (BIPKO 제품군 안에서 맥락이 분명할 때만)
- 쓰지 않는 표기: BipkoStudio, BIPKO-Studio, 빕코 스튜디오

BIPKO는 항상 대문자입니다. 제품명을 코드에 직접 적지 않습니다 —
`src/domain/brand.ts`의 `wordmark`를 읽습니다.

## 마크

한 귀퉁이가 들린 프레임(=레이아웃 중인 페이지)과 그 어깨의 작은 스파크.
32단위 그리드에 그려져 있고 `domain/brand.ts`가 path를 소유합니다.

- **BIPKO의 하우스 로고가 아닙니다.** 둘은 나란히 놓이는 별개의 마크입니다.
  BIPKO 로고 파일(`bipko-logo-v3.svg`)은 이 저장소에 포함하지 않습니다.
- 최소 크기 20px. 그 아래에서는 스파크가 뭉개지므로 워드마크만 씁니다.
- 여백은 타일 한 변의 1/4 이상.
- 타일 그라디언트를 단색으로 바꾸거나, 글리프 색을 흰색 외로 바꾸지 않습니다.

## 색

BIPKO에서 그대로 가져왔습니다. 합쳐지는 날 두 화면이 한 제품으로 보이게 하는 것이
이 선택의 전부입니다.

| 역할 | 값 | 쓰는 곳 |
| --- | --- | --- |
| Primary | `#fa168b` | 주 버튼, 선택 상태, 스냅 가이드, 강조 텍스트 |
| Primary ink | `#ffffff` | Primary 위의 글자 |
| Primary soft | `#ffe9f4` | 선택된 탭·칩의 바탕 |
| Deep | `#100b2b` | 히어로 같은 마케팅 지면 |
| Ink | `#171431` | 본문 |
| Ink soft | `#6b687b` | 보조 설명 |
| Ink faint | `#9a97a8` | 메타·캡션 |
| Line / Line strong | `#e6e4ef` / `#cfccdd` | 경계선, 입력 테두리 |
| Surface / Sunken | `#ffffff` / `#f6f5fa` | 패널, 가라앉은 바탕 |
| Workspace | `#ebe9f3` | 에디터에서 페이지 뒤 |

중간색이 필요하면 새 색을 만들지 말고 `color-mix`로 위 값들 사이에서 꺼냅니다.
스타일시트에 브랜드 색을 직접 적지 않습니다.

## 타이포그래피

```
Inter, "Noto Sans KR", "Noto Sans JP", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif
```

bipko.ai와 **같은 스택**입니다. 제목은 800, 본문은 400, 자간은 제목에서 -0.02em~-0.03em.
모서리 반경은 10px(= bipko.ai의 `0.625rem`).

## 말투

BIPKO 영문 카피는 짧은 평서문입니다("See Your Ideas. Turn Them Into Stories.").
한국어 UI는 그 결을 따르되 과장하지 않습니다.

- 할 수 있는 것을 말하고, 안 되는 것은 안 된다고 적습니다.
  "저장 안 됨"이 아니라 "저장 공간이 부족합니다 — 사용하지 않는 디자인을 지우거나
  파일로 내보내 주세요."처럼 다음 행동까지 적습니다.
- 느낌표와 "완벽한", "혁신적인" 같은 말은 쓰지 않습니다.
- 사용자를 주어로 둡니다. "시스템이 처리했습니다"가 아니라 "저장했습니다".

## 코드에서 어디에 있는가

| 파일 | 소유하는 것 |
| --- | --- |
| `src/domain/brand.ts` | 브랜드 자체 — 이름, 태그라인, 팔레트, 폰트, 마크 path. 순수 데이터 |
| `src/ui/brand.ts` | 이 빌드가 입는 브랜드를 고르고, 첫 렌더 전에 토큰을 문서에 씁니다 |
| `src/ui/Wordmark.tsx` | 마크와 워드마크를 그리는 유일한 컴포넌트 |
| `src/ui/styles.css` | 구조 토큰(그림자, 레일 폭). 브랜드 색을 적지 않습니다 |

`styles.css`의 `:root`에 있는 색은 스크립트가 돌기 전 한 프레임을 위한
**대체값**이고, 권위는 `domain/brand.ts`에 있습니다.

## bipko.ai와 합치는 길

### 1. 스위치

```bash
VITE_BRAND=bipko npm run build
```

`studio` → `bipko`로 바꾸면 제품이 하우스 아이덴티티를 입습니다: 워드마크가
`BIPKO`가 되고, 별도 제품명을 내세우지 않으며, 태그라인이 BIPKO의 것으로 바뀝니다.
팔레트와 타이포는 이미 같으므로 **CSS는 한 줄도 바뀌지 않습니다**.

`src/domain/brand.ts`의 `bipko` 항목은 공개된 사이트에서 읽은 값만 담고 있습니다.
실제 합병 시점에 BIPKO 브랜드 키트의 워드마크·로고 자산으로 교체해야 합니다.

### 2. 토큰 맞추기

bipko.ai는 shadcn/Tailwind 어휘를 oklch로 씁니다. 우리 토큰과의 대응은 이렇습니다.

| bipko.ai | BIPKO Studio |
| --- | --- |
| `--background` | `--surface` |
| `--foreground` | `--ink` |
| `--primary` | `--accent` |
| `--primary-foreground` | `--accent-ink` |
| `--muted` | `--surface-sunken` |
| `--muted-foreground` | `--ink-soft` |
| `--border`, `--input` | `--line`, `--line-strong` |
| `--radius` (`0.625rem`) | `--radius` (`10px`) |

양쪽 모두 `:root`의 커스텀 프로퍼티 하나만 보므로, 공용 컴포넌트를 옮길 때는
위 표대로 별칭만 추가하면 됩니다. 값 변환은 필요 없습니다 — 이미 같은 색입니다.

### 3. 계정 합치기

Studio는 Supabase 인증을 씁니다(`README.md`의 “계정 서버 설정”). BIPKO가 자체
계정 체계를 쓴다면 합치는 방법은 둘 중 하나입니다.

- **같은 Supabase 프로젝트를 보게 한다** — 환경변수만 BIPKO 쪽 값으로 바꾸면
  됩니다. `profiles`·`designs` 테이블과 RLS는 그대로 올라갑니다.
- **BIPKO의 인증으로 갈아탄다** — `src/application/auth/authPort.ts` 하나를
  구현하면 됩니다. UI는 이 포트만 알고 있고, SDK는
  `src/application/supabase/` 밖으로 나가지 않습니다
  (`tests/moduleBoundaries.test.ts`가 이를 검사합니다).

### 4. 배치

Studio는 정적 SPA라 BIPKO 안에 **보드 하나**로 끼워 넣기 쉽습니다. 서브경로
(`bipko.ai/studio`)로 올리거나 iframe 보드로 띄울 수 있습니다. Vite의
`base`는 현재 `'./'`이므로 어느 하위 경로에서도 자산 경로가 깨지지 않습니다.

## 확인하지 않은 것

- bipko.ai의 색·폰트·반경은 2026년 10월 31일 공개 페이지에서 **측정한 값**입니다.
  공식 브랜드 가이드를 받으면 `domain/brand.ts`의 값과 대조해야 합니다.
- BIPKO의 로고 자산, 영문/일문 카피 규칙, 상표 사용 범위는 확인하지 않았습니다.
- `VITE_BRAND=bipko` 빌드는 토큰 교체까지만 검증했고, 실제 BIPKO 자산으로는
  아직 돌려보지 않았습니다.
