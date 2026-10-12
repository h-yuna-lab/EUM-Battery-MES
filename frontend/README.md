# 이음 배터리 MES 프론트엔드 · 기술 안내

React 관리 화면의 실행·세션 인증·API 연결 안내입니다. 프로젝트 소개·개인 담당 업무·화면·회고는 [최상위 README](../README.md)에 있습니다.

## 의존성

| 구분 | 사용 기술 |
| --- | --- |
| UI | React 19 · JavaScript |
| 라우팅 | React Router 7 |
| 스타일 | styled-components 6 · styled-reset · Pretendard |
| API | Axios · 세션/쿠키 인증 |
| 시각화·입력 | Recharts 3 · react-datepicker · react-icons |
| 빌드 | Create React App / react-scripts 5 |

세부 의존성과 버전 범위는 [package.json](package.json), 원본 잠금 파일은 [yarn.lock](yarn.lock)에 있습니다.

## 실행·API 설정·빌드

Node.js와 패키지 매니저가 필요합니다. 백엔드는 `http://localhost:8111`에서 먼저 실행합니다.

```bash
npm install
npm start
```

기본 접속 주소는 `http://localhost:3000`입니다. API 요청은 상대경로 `/api/mes/...`를 사용하며, [package.json](package.json)의 개발 프록시가 `http://localhost:8111`로 전달합니다. Axios의 `withCredentials: true`로 세션 쿠키를 사용합니다.

백엔드 최초 로컬 실행 시 기본 관리자 계정은 `admin / 1234`입니다([DataSeeder](../backend/src/main/java/com/mes/backend/config/DataSeeder.java)). 학습용 초기 계정이므로 외부 운영 전에 비밀번호와 계정 정책을 변경해야 합니다.

```bash
npm run build
```

정적 빌드 배포에서는 CRA 개발 프록시가 동작하지 않으므로 `/api` 요청을 백엔드로 전달하도록 웹 서버를 설정해야 합니다.

## 화면 코드 위치

| 화면 | 구현 내용 | 관련 코드 |
| --- | --- | --- |
| 작업지시 목록 | 상태·번호·납기일 검색, 상태 집계, 진행률 표시, 주기적 목록 갱신 | [WorkOrderList](src/pages/production/WorkOrderList.js) |
| 작업지시 등록·상세 | 제품·지시수량·납기일 입력, BOM 및 자재 재고 확인, 상세 Drawer | [등록](src/pages/production/WorkOrderNewEdit.js) · [상세](src/pages/production/WorkOrderDetail.js) |
| 완제품 LOT | 제품·작업지시·상태 검색, 수량·검사 합격률, 공정·자재·설비 상세 탭 | [목록](src/pages/production/ProductLotList.js) · [상세](src/pages/production/ProductLotDetail.js) |
| 자재 기준정보 | 자재코드·이름·단위·안전재고, 검색·등록·수정·삭제 | [목록](src/pages/master/MaterialList.js) · [입력](src/pages/master/MaterialNewEdit.js) |
| 작업자 | 사원번호·이름·권한·출퇴근 상태·입사일, 검색·등록·수정·상세 | [목록](src/pages/master/WorkerList.js) · [입력](src/pages/master/WorkerNewEdit.js) · [상세](src/pages/master/WorkerDetail.js) |
| BOM | 제품별 자재 구성, 표준 소요수량·투입공정, 수정·상세 Drawer | [목록](src/pages/master/BomList.js) · [수정](src/pages/master/BomEdit.js) · [상세](src/pages/master/BomDetail.js) |

작업지시는 등록·조회 기능을 제공하며 수정 API는 없습니다. 위 경로는 팀 통합 수정이 포함된 현재 코드 위치입니다.

## 화면·데이터 처리

### 목록에서 상세까지 이어지는 생산관리 UI

작업지시의 영문 상태 값을 화면용 한국어 상태로 변환하고, 지시수량과 실적수량으로 진행률을 계산합니다. 목록은 2초 간격으로 갱신하며, 선택된 작업지시도 최신 목록 값으로 반영합니다. 상세 화면을 Drawer로 열어 목록의 검색 맥락을 유지하도록 구성했습니다.

### 작업지시와 BOM·자재 재고 연결

제품을 선택하면 BOM을 조회하고, `제품 1개당 소요량 × 지시수량`을 현재 자재 재고와 비교합니다. 동일 자재가 여러 BOM 항목에 존재하는 경우 필요량을 합산합니다. 화면의 사전 확인과 함께 백엔드에서도 등록 시 재고를 검증합니다.

### LOT 중심의 정보 구성

완제품 LOT 목록에서 상세 조회 API를 호출해 검사 합격률과 공정·자재 이력을 표시합니다. 생산상태·검사결과·투입자재를 하나의 LOT 상세 화면에서 연결해 표시합니다.

## 확인 범위

- 포트폴리오 정리 시 프론트엔드 프로덕션 빌드 성공
- 브라우저에서 로그인, 대시보드, 작업지시 등록·상세, LOT 상세, 자재·작업자·BOM 화면 확인
- 이번 정리에서는 Spring Boot·MySQL·C 시뮬레이터의 전체 연동 실행은 수행하지 않음

설치·빌드 환경 및 원본과의 차이는 [출처와 검증 기록](docs/SOURCE.md)을 참고해주세요.

## 문서

- [프로젝트 포트폴리오·전체 화면·회고](../README.md)
- [백엔드 API·DB·초기 데이터 설정](../backend/README.md)
- [시뮬레이터 통신·빌드](../simulator/README.md)
- [화면 촬영 조건](docs/SCREENSHOTS.md)
- [통합 출처](../SOURCE.md) · [프론트 복사 기준](docs/SOURCE.md)
