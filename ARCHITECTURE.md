# 구조

레퍼런스로 학습한 REA(`rea-agents`) 저장소의 규율을 그대로 따릅니다:
의존성은 안쪽으로만 흐르고, 모든 해석에는 주인이 하나뿐이며, 예상 가능한 실패는
태그된 오류와 `Result`로 표현합니다.

```
  ┌──────────────────────────────────────────────┐
  │ src/ui/            React 어댑터               │  ← 여기서만 DOM과 React를 안다
  │  Dashboard · Editor 셸 · 패널 · Workspace     │
  └───────────────┬──────────────────────────────┘
                  │ 명령 호출 / 상태 구독
  ┌───────────────▼──────────────────────────────┐
  │ src/application/   워크플로와 포트             │
  │  EditorStore · projectRepository · assets     │
  │  export/{raster,svg,exportDesign}             │
  └───────────────┬──────────────────────────────┘
                  │ 순수 함수 호출
  ┌───────────────▼──────────────────────────────┐
  │ src/domain/        순수 모델 (부작용 없음)      │
  │  document · elements · mutations · geometry   │
  │  textLayout · shapes · snapping · parse       │
  │  templates · presets · icons · color · result │
  └──────────────────────────────────────────────┘
```

역방향 import는 없습니다. `domain/`은 `window`, React, 저장소를 알지 못하므로
Node에서 그대로 테스트됩니다.

## 소유권 경계

한 가지 사실은 한 곳에서만 해석합니다. 아래가 그 목록입니다.

| 주인 | 소유하는 사실 |
| --- | --- |
| `domain/document.ts` | 디자인이 무엇인가 — 페이지, 요소, z-순서, 그룹 |
| `domain/geometry.ts` | 상자와 회전의 관계 — 모서리, 경계, 핸들 리사이즈 |
| `domain/textLayout.ts` | 줄바꿈 위치 |
| `domain/shapes.ts` | 도형의 윤곽선(SVG path) |
| `domain/mutations.ts` | 문서의 구조적 변경 |
| `domain/parse.ts` | 외부 JSON → `Design` (유일한 입력 경계) |
| `domain/account.ts` | 회원이 무엇인가 — 역할, 가입 경로, 사용 중지, 자격 검사 |
| `application/editorStore.ts` | 선택, 뷰포트, 실행 취소 스택 |
| `application/auth/accountStore.ts` | 누가 로그인했는가 |
| `application/projectStore.ts` | 디자인이 어디에 저장되는가 |
| `application/projectRepository.ts` | 로컬 저장소 키 형식 |
| `application/supabase/` | Supabase SDK와 닿는 모든 코드 |
| `ui/ElementRenderer.tsx` | 요소를 화면에 그리는 방법 |

핵심 결과 하나: **에디터, PNG, SVG가 같은 줄바꿈과 같은 path를 읽습니다.**
`layoutText`가 만든 줄을 `ElementRenderer`는 블록으로, 래스터 렌더러는 `fillText`로,
SVG 렌더러는 `<tspan>`으로 그립니다. 브라우저의 자동 줄바꿈에 맡기지 않기 때문에
내보낸 파일이 화면과 어긋날 수 없습니다. 도형도 `shapePath()` 문자열 하나를
`<path d>`, `Path2D`, SVG가 함께 사용합니다.

## 계정과 저장 위치

로그인 여부에 따라 디자인이 브라우저에 남을지 계정으로 갈지가 달라지지만, 화면은
그 차이를 모릅니다. `application/projectStore.ts`가 비동기 포트 하나를 정의하고
로컬 어댑터와 Supabase 어댑터를 모두 그 뒤에 두며, `chooseProjectStore()`가 선택을
단독으로 소유합니다. 디자인을 열고 저장하고 지우는 세 지점은 포트만 호출하므로,
원격 저장을 추가하면서 두 번째 코드 경로가 화면으로 번지지 않았습니다.

인증도 같은 모양입니다. `application/auth/authPort.ts`가 이 앱의 어휘로 계약을
적고, `application/supabase/`만 SDK를 만집니다. 이 경계는 설명이 아니라 검사입니다
— `tests/moduleBoundaries.test.ts`가 `@supabase/*` import가 그 디렉터리 밖에
나타나지 않는지, domain이 상위 레이어를 import하지 않는지, application 레이어에
React가 섞이지 않는지를 소스에서 직접 확인합니다.

**권한을 막는 것은 UI가 아닙니다.** 클라이언트는 anon 키만 쥐고 있고, 누가 무엇을
읽고 쓸 수 있는지는 전부 `supabase/migrations/`의 RLS 정책과 트리거가 정합니다.
회원 관리 화면을 관리자가 아닌 사람에게 숨기는 것은 예의일 뿐이고, 실제로 거절하는
쪽은 데이터베이스입니다. 역할을 바꾸는 열 하나까지 트리거가 지키기 때문에, 회원이
자기 행을 고쳐 관리자가 될 수 없습니다.

## 모델이 납작한 이유

그룹은 트리가 아니라 요소의 속성(`groupId`)입니다. 페이지는 요소의 정렬된 배열
하나만 가집니다. 그래서 z-순서, 히트 테스트, 내보내기가 모두 같은 하나의 순서를
읽으며, 중첩 변환 스택을 각자 다시 계산할 일이 없습니다. 대신 "그룹 안에서 상대
좌표" 같은 기능은 없습니다 — 선택 시 그룹 전체로 확장(`expandGroups`)하는 방식으로
같은 사용감을 만듭니다.

## 실패를 다루는 방식

예상 가능한 실패는 던지지 않고 `Result<T, StudioError>`로 돌려줍니다.
오류는 `domain/errors.ts`의 태그된 합 타입이며, 각 오류는 자신을 만든 경계와
사람이 조치할 수 있는 최소한의 증거를 담습니다.

```ts
{ kind: 'document-malformed', at: '$.pages[0].elements[3].type', detail: '…' }
{ kind: 'asset-too-large',    fileName: 'hero.png', bytes: 9_000_000, limitBytes: 8_388_608 }
{ kind: 'storage-quota-exceeded', detail: 'QuotaExceededError' }
```

`describeError()`가 문구를 소유하고, UI는 배치만 정합니다. 저장소를 쓸 수 없는
브라우저에서도 편집은 계속되며, 자동 저장이 되지 않는다는 사실만 알립니다.

## 실행 취소의 입자 크기

제스처 하나가 되돌리기 하나입니다. 드래그는 포인터 이벤트마다 문서를 바꾸지만,
`CommitOptions.coalesce` 키가 같고 900ms 안이면 히스토리 항목을 교체합니다.
슬라이더 한 번 쓸기, 텍스트 한 번 입력도 같은 방식입니다.

## 제스처 처리

포인터 제스처는 `Workspace.tsx`에서만 해석합니다. 각 제스처는 시작 시점의 스냅샷을
들고 있고, 변형은 항상 "시작 상태 + 누적 델타"로 계산합니다. 이벤트마다 직전 값에
더하지 않으므로 긴 드래그에서도 오차가 쌓이지 않습니다.

회전된 요소의 리사이즈는 `geometry.resizeRect()`가 담당합니다. 포인터 델타를 요소
자신의 좌표계로 가져와 크기를 바꾼 뒤, 반대쪽 앵커가 화면에서 움직이지 않도록 위치를
보정합니다. 이 불변식은 `tests/geometry.test.ts`가 직접 검증합니다.

## 테스트

`tests/`는 도메인만 다룹니다(35개). 측정 포트가 주입식이라 줄바꿈 테스트는 캔버스
없이 결정적으로 돌고, 변형 테스트는 입력 문서가 변하지 않음까지 확인합니다.
템플릿 10종은 JSON 왕복 파싱으로 검증합니다. UI와 내보내기 바이트는 자동 테스트로
덮지 않았고, 이번 작업에서는 브라우저에서 직접 확인했습니다.
