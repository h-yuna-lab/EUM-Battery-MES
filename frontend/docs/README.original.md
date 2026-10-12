# MES 프론트엔드 협업 규칙

## 팀 구성

| 이름 | 담당 | 비고 |
| ---- | ---- | ---- |
| 미   | 대시보드 | |
| 나   | 품질관리, 리포트/조회 | quality/report 페이지 수 축소됨 (아래 참고) |
| 현   | 기준정보관리 | |
| 유   | 생산관리 (작업지시, 완제품 LOT) | |
| 상   | 자재/재고관리 (자재 재고, 원료 LOT) | |

---

## 개발 방침 (중요)

**백엔드 연동 없이 일단 UI만 먼저 개발합니다.**

- 각자 페이지는 실제 axios 호출 대신 **mock/더미 데이터**로 화면부터 완성합니다.
- `api/*.js` 도메인 파일은 뼈대만 있는 상태이며, 실제 함수 구현(axios 호출)은 백엔드 완성 후 진행합니다.
- 페이지 컴포넌트 안에서 `useState`로 더미 배열을 만들어 화면을 구성하고, 나중에 `useEffect` + api 함수 호출로 교체하는 방식을 권장합니다.

```jsx
// 지금 단계 예시
const [rows, setRows] = useState([
  { id: 1, lotNo: "LOT-001", productName: "12V-STD", ... },
]);

// 나중에 백엔드 연동 시 이렇게 교체
useEffect(() => {
  productionApi.getLots().then((res) => setRows(res.data));
}, []);
```

---

## 인증 방식

**세션/쿠키 기반**으로 확정 (JWT 아님).

- `api/axiosInstance.js`에 `withCredentials: true` 설정 완료
- 개발 서버 간 origin 문제는 `package.json`의 `"proxy"` 필드로 해소 (CRA 프록시)
- `context/AuthContext.js`, `context/AuthGuard.js` 뼈대 완성, 로그인 흐름 테스트 완료
- `pages/Login.js` UI 완성, 실제 로그인 API는 백엔드 완성 후 연결 (현재는 위 개발 방침대로 미연동 상태)

---

## 화면 구성 (최종 확정)

이전 기수 자료를 참고해 화면을 설계했고, 아래 2개는 **별도 페이지로 만들지 않고 다른 화면에 통합**하기로 결정했습니다.

| 통합 대상 | 통합된 위치 | 이유 |
| --- | --- | --- |
| ProcessLog (공정별 로그) | `report/trace` (Traceability) 상세화면 안에 공정 타임라인(공정명/설비명/작업자/시작·종료시간)으로 포함 | Traceability와 데이터 결이 겹치며, LOT 상세 화면에서 drill-down으로 보여주는 게 더 직관적 |
| DefectLog (불량이력) | `quality/test-log` (TestLog)에 불합격 필터로 통합 | TestLog의 부분집합에 가까움. 추후 여유되면 상태/담당자 필드 확장 검토 |

**판단 기준**: 화면 통합·분리는 현직(실무) 기준을 최대한 참고하되, 팀 역량과 2주 타임라인에 맞게 현실적으로 조정합니다.

### 용어 구분 주의 (헷갈리기 쉬운 지점)

- **자재 "마스터"**(`master/material`, 현 담당) vs **자재 "재고"**(`inventory/material-list`, 상 담당): 전자는 자재 종류 정의(등록/수정), 후자는 실물 재고 + 안전재고 비교 로직이 들어간 별도 화면입니다. 둘은 역할이 달라 분리 유지합니다.
- **완제품 LOT**(`production/product-lot`, 유 담당) vs **원료 LOT**(`inventory/material-lot`, 상 담당): 서로 다른 엔티티이며, 나중에 `MaterialTx`로 연결됩니다. 필드명(`lotId` 등) 통일은 백엔드 연동 시작 전 팀 전체 합의가 필요합니다.

---

## 프로젝트 구조

```
src/
├── api/                      # 도메인별 axios 레이어 (현재는 뼈대만 존재)
│   ├── axiosInstance.js       # 공용 axios 인스턴스 (세션 쿠키 자동 포함)
│   ├── monitoring.js          (담당: 미)
│   ├── master.js              (담당: 현)
│   ├── production.js          (담당: 유)
│   ├── quality.js             (담당: 나)
│   ├── inventory.js           (담당: 상)
│   └── report.js              (담당: 나)
├── components/
│   └── ui/                   # 공용 UI 컴포넌트 (Button/Badge/Card/Table 완성됨)
├── context/
│   ├── AuthContext.js         # 로그인 상태 관리 (완성)
│   └── AuthGuard.js           # 라우트 보호 (완성)
├── pages/
│   ├── Login.js               # 로그인 페이지 (완성, API 미연동)
│   ├── monitoring/            # 대시보드 (담당: 미)
│   ├── master/                 # 기준정보관리 - 설비/공정/제품/자재/BOM/작업자 (담당: 현)
│   ├── production/             # 생산관리 - 작업지시/완제품LOT (담당: 유)
│   ├── quality/                 # 품질관리 - test-log (불량 통합됨) (담당: 나)
│   ├── inventory/               # 자재/재고관리 - 자재재고/자재이력/원료LOT (담당: 상)
│   └── report/                   # 리포트 - trace (Traceability, 공정이력 통합됨) (담당: 나)
├── style/            # GlobalStyle.js (DESIGN.md 기반 디자인 토큰, 완성)
└── App.js            # 라우터 (완성, 각 페이지는 Empty placeholder로 연결된 상태)
```

- 페이지 파일은 `목록.js` + `상세.js` 형제 파일로 분리 (예: `MachineList.js`, `MachineDetail.js`)
- 자기 담당 폴더(`pages/{담당그룹}/*`) 안에서만 작업
- **페이지 파일은 반드시 실제 라우트와 같은 이름의 폴더에 생성** (예: `inventory` 라우트에 쓰이는 파일은 `pages/inventory/`에 위치 — 폴더 위치와 라우트가 어긋나지 않도록 주의)

### App.js 사용법 (각자 페이지 완성 시)
```jsx
// 1. import를 실제 컴포넌트로 교체
import ProductLot from "./pages/production/ProductLot";

// 2. element를 Empty에서 실제 컴포넌트로 교체
<Route path="product-lot" element={<ProductLot />} />
```
App.js 구조 자체는 이미 완성되어 있으므로, 이 두 줄만 바꾸면 됩니다. App.js 전체를 다시 짤 필요 없음

---

## Git 브랜치 전략

```
main  ←(PR, 리뷰 후 머지)  dev  ←(PR, 리뷰 후 머지)  feature/{이름}-{기능}
```

- `main`: 배포/발표용, 항상 정상 동작 상태만 유지
- `dev`: 팀 통합 브랜치, 평소 작업은 전부 여기로 모임
- `feature/{이름}-{기능}`: 개인 작업 브랜치, `dev`에서 분기

### 브랜치 네이밍 예시

```
feature/hyun-machine-list
feature/hyun-bom-detail
feature/yu-workorder-list
feature/sang-material-inventory
feature/mi-dashboard
feature/na-test-log
```

---

## 커밋 메시지 컨벤션

```
<type>: <설명>
```

| type     | 의미                              |
| -------- | --------------------------------- |
| feat     | 새 기능                           |
| fix      | 버그 수정                         |
| style    | 스타일/포맷 변경 (로직 변경 없음) |
| refactor | 코드 리팩터링                     |
| docs     | 문서 수정                         |
| chore    | 빌드/설정 등 기타                 |

예: `feat: 완제품 LOT 목록 페이지 UI 구현 (mock 데이터)`

---

## PR 규칙

- PR 대상 브랜치: `dev`
- PR 제목: `[담당그룹] 작업 내용 요약` (예: `[생산관리] 완제품 LOT 목록/상세 페이지`)

---

## 공용 파일 수정 규칙

아래 파일은 여러 명이 동시에 건드리면 충돌이 잦으므로, **수정 전 팀 채널에 미리 공지**:

- `App.js` (라우터) — 단, 각자 페이지 연결 시엔 import/element 두 줄만 바꾸면 되므로 공지만 하고 개별 수정 가능
- `api/axiosInstance.js` (공용 axios 설정)
- `components/ui/*` (공용 컴포넌트) — 이미 최소 세트(Button/Badge/Card/Table)는 완성됨. 새 공용 컴포넌트가 필요하면 추가 전 공지
- `style/GlobalStyle.js`, 디자인 토큰 파일