# 통합 기준 및 출처

통합일: 2026-10-12 (한국 시간)

기존 개인 포트폴리오 저장소의 아래 커밋을 기준으로 통합했습니다. 각 저장소의 파일은 대응하는 하위 폴더로 가져오고, 기존 커밋 이력도 통합 저장소의 조상 커밋으로 보존했습니다.

| 통합 폴더 | 개인 저장소 | 기준 커밋 |
| --- | --- | --- |
| frontend | [MES-Battery-frontend](https://github.com/h-yuna-lab/MES-Battery-frontend) | `7ed081c202d229259f2c4f7d05cb13fe6d88eebf` |
| backend | [MES-Battery-backend](https://github.com/h-yuna-lab/MES-Battery-backend) | `14aee4ffe52919deff4ad04fdec0842c14a618f6` |
| simulator | [MES-Battery-Simulator](https://github.com/h-yuna-lab/MES-Battery-Simulator) | `1f719e86ebd82a9b00e4b3191c9f7f98c33f7ab0` |

## 변경 범위

- 최상위 README에 프로젝트 소개·개인 담당 업무·화면·실행 방법·회고를 정리했습니다.
- 모듈 README의 개인 저장소 연결 링크를 통합 저장소 내부 경로로 조정했습니다.
- 소스 코드, 의존성 및 잠금 파일, 화면 이미지, 설정 예시, 빌드 도구는 기존 저장소와 동일하게 보존했습니다.
- 기존 분리 저장소와 원본 팀 저장소는 변경·삭제하지 않았습니다.

## 원본 팀 코드 출처

각 모듈의 기존 README와 docs/SOURCE.md(있는 경우)에 원본 팀 저장소·복사 기준·개인 담당 범위를 보존했습니다. 최초 팀 개발 이력은 해당 원본 팀 저장소에서 확인할 수 있습니다. 개인 포트폴리오에 이미 포함된 이력을 가져온 것이며, 삭제되었던 과거 이력을 복원한 것은 아닙니다.

## 검증 범위

통합 전후 파일 목록과 Git blob을 대조해 모듈 README 외의 파일이 동일함을 확인했습니다. 각 개인 저장소 기준 커밋의 이력 연결, 문서의 로컬 링크·화면 이미지 경로, 커밋 상태도 확인했습니다. 이번 통합에서 백엔드·DB·외부 서비스·시뮬레이터의 전체 실행을 새로 검증하지 않았습니다. 이전 실행·캡처 확인 범위는 각 모듈 README에 있습니다.
