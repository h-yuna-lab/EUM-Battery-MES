# 이음 배터리 MES 백엔드 · 기술 안내

Spring Boot 생산·품질·재고 API의 설정·실행·데이터 처리 안내입니다. 프로젝트 소개·개인 담당 업무·전체 구조·회고는 [최상위 README](../README.md)에 있습니다.

## 의존성

| 구분 | 사용 기술 |
| --- | --- |
| 언어 | Java 17 |
| 서버 | Spring Boot 4.1.0 · Spring Web MVC |
| 데이터 | Spring Data JPA · Hibernate · MySQL |
| 인증 | Spring Security · 세션 쿠키 · BCrypt |
| 기타 | Lombok · Gradle Wrapper 9.5.1 |

버전은 복사한 브랜치의 [build.gradle](build.gradle) 및 [Gradle 설정](gradle/wrapper/gradle-wrapper.properties) 기준입니다.

## DB·설정·실행·빌드

Java 17 및 MySQL을 준비합니다. MySQL에 `mes_portfolio` 데이터베이스를 만들고, 해당 DB에 접근 가능한 로컬 사용자를 설정합니다.

```sql
CREATE DATABASE mes_portfolio CHARACTER SET utf8mb4;
```

원본 DB 접속 정보는 공개 복사본에서 제외했습니다. [설정 예시](src/main/resources/application.example.properties)를 복사한 뒤 환경변수로 DB 정보를 지정합니다.

```powershell
Copy-Item src/main/resources/application.example.properties src/main/resources/application.properties
$env:DB_URL = 'jdbc:mysql://localhost:3306/mes_portfolio?serverTimezone=Asia/Seoul&characterEncoding=UTF-8'
$env:DB_USERNAME = '본인의 로컬 DB 사용자'
$env:DB_PASSWORD = '본인의 로컬 DB 비밀번호'
.\gradlew.bat bootRun
```

macOS/Linux에서는 동일한 DB 환경변수를 설정하고 `./gradlew bootRun`으로 실행합니다. 서버 포트는 **8111**입니다. 최초 실행 시 [DataSeeder](src/main/java/com/mes/backend/config/DataSeeder.java)가 관리자(`admin / 1234`), 6개 공정·설비 및 품질 규격을 준비합니다. 제품·자재·BOM·재고 등 생산 준비 데이터는 화면에서 등록합니다.

```powershell
.\gradlew.bat test
.\gradlew.bat build
```

기본 계정과 설비 API 접근 정책은 학습 프로젝트의 로컬 환경 기준입니다. 외부 운영 시 관리자 비밀번호와 설비 인증·접근 정책을 환경에 맞게 설정해야 합니다.

## 주요 API

| 경로 | 용도 |
| --- | --- |
| `/api/mes/auth/login`, `/me`, `/logout` | 로그인·현재 사용자·로그아웃 |
| `/api/mes/work-orders` | 작업지시 목록·상세·등록 |
| `/api/mes/product-lots` | 완제품 LOT 목록·상세 |
| `/api/mes/products/{productId}/bom-items` | 제품별 BOM 조회·수정 |
| `/api/mes/materials`, `/workers`, `/processes`, `/equipment`, `/products` | 기준정보 |
| `/api/mes/inventory/*` | 자재 재고·자재 LOT·입출고 |
| `/api/mes/quality/*` | 검사 기록·요약·추이·불량 집계 |
| `/api/mes/report/*` | LOT 추적·생산 집계 |
| `/api/mes/dashboard`, `/notifications` | 대시보드·알림 |
| `GET /api/mes/machine/poll?machineId=...` | 설비 작업지시 조회, 대기 작업이 없으면 204 |
| `POST /api/mes/machine/report` | 생산·품질 실적 수신 |
| `POST /api/mes/machine/environment` | 온도·습도·전압 수신 |

정확한 메서드·요청·응답은 [Controller](src/main/java/com/mes/backend/controller)와 [DTO](src/main/java/com/mes/backend/dto)를 기준으로 확인할 수 있습니다. API 경로별 접두사를 생략한 표 항목은 동일한 `/api/mes` 아래 경로입니다.

## 생산 데이터 처리

1. 관리자가 제품·BOM·자재 재고를 준비하고 작업지시를 등록합니다.
2. L2 수집기가 기본 `machineId`로 작업지시를 폴링합니다.
3. 백엔드가 대기 작업을 할당하고 제품 LOT를 준비합니다.
4. L1에서 생성한 생산·품질 데이터를 L2가 HTTP로 보고합니다.
5. 서버가 공정·검사·자재 투입 이력을 기록하고 실적과 LOT 상태를 갱신합니다.
6. React 화면에서 진행률, 품질 결과, 자재 이력을 조회합니다.

핵심 처리 코드는 [ProductionService](src/main/java/com/mes/backend/service/ProductionService.java)에 있습니다. 제품별 BOM과 자재 LOT를 연결하고, FIFO 투입 이력을 제품 LOT와 함께 저장해 추적성 정보를 구성합니다.

## 확인 범위

복사 브랜치, 컨트롤러·DTO·서비스 흐름 및 프론트엔드 연결 지점을 확인했습니다. 이번 포트폴리오 정리 환경에는 Java/MySQL 실행 환경이 없어 **백엔드 빌드·DB 통합 테스트는 실행하지 않았습니다**. 프론트 화면 캡처는 예시 데이터 기반이며 서버 연동 완료 증거로 사용하지 않았습니다.

## 문서

- [프로젝트 포트폴리오·담당 업무·회고](../README.md)
- [프론트 API 연결·화면 코드](../frontend/README.md)
- [시뮬레이터 통신·빌드](../simulator/README.md)
- [통합 출처](../SOURCE.md) · [백엔드 복사 기준](docs/SOURCE.md)
