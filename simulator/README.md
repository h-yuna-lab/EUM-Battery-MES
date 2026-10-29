# 이음 배터리 MES 시뮬레이터 · 기술 안내

C L1 설비와 L2 수집기의 빌드·TCP 패킷·서버 연결 안내입니다. 프로젝트 소개·개인 담당 업무·전체 구조·회고는 [최상위 README](../README.md)에 있습니다.

## 모듈 구성

| 모듈 | 역할 |
| --- | --- |
| L1 `mes_machine_c` | 6개 공정 설비 시뮬레이션, 생산 수량 처리, 센서·품질 측정 데이터 생성 |
| 공정 간 큐 | 전극부터 포장까지 생산 흐름을 큐와 스레드로 연결 |
| TCP 프로토콜 | STX/ETX 검증, 리틀엔디언 데이터 인코딩·디코딩 |
| L2 `mes_equipment_c` | 설비별 TCP 수집 스레드, 작업지시 폴링·전송, HTTP 실적·환경 보고 |
| 연동 | 설비 포트가 포함된 machineId로 MES 설비·공정과 매핑 |
| 테스트 소스 | 큐·패킷·보고 API 테스트 및 Python 가짜 설비·서버 |

## 빌드 의존성

- C11 · GCC · Make
- TCP Socket · pthread
- libcurl: MES HTTP 요청
- cJSON: JSON 요청·응답 처리
- Python: 연동 테스트 보조 도구

## 폴더 구조

```text
mes_machine_c/
  main.c        # 6개 공정 설비와 생산 흐름
  queue.c/h     # 공정 간 큐
  net.c/h       # TCP 소켓
  protocol.c/h  # 패킷 처리
  Makefile
mes_equipment_c/
  main.c        # 수집기 실행과 폴링
  collector.c/h # 설비별 수집·처리
  api_client.c/h# MES HTTP 연동
  config.h      # 서버 주소·공정 포트·폴링 주기
  net.c/h
  protocol.c/h
  Makefile
```

## 빌드·실행·연결 설정

먼저 [백엔드](../backend/README.md)를 실행하고 제품·BOM·자재 재고·작업지시를 준비합니다. [config.h](mes_equipment_c/config.h)의 서버 주소는 기본 `http://localhost:8111/`이며 폴링 간격은 5초입니다. L1과 L2가 같은 컴퓨터에서 실행되는 설정입니다.

### 빌드 준비

GCC, Make, pthread, libcurl, cJSON, pkg-config가 필요합니다. Linux 예시:

```bash
sudo apt install build-essential libcurl4-openssl-dev libcjson-dev pkg-config
```

macOS는 컴파일 도구를 준비한 후 `brew install curl cjson pkg-config`를 사용합니다. Windows는 MSYS2 MinGW64 환경에서 Makefile 주석의 패키지를 설치합니다.

```bash
pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-make mingw-w64-x86_64-curl mingw-w64-x86_64-cjson mingw-w64-x86_64-pkg-config
```

### L1과 L2 실행

프로젝트 루트에서 각각 별도 터미널로 실행합니다.

```bash
# 터미널 1: L1
cd mes_machine_c
make
./mes_machine
```

```bash
# 터미널 2: L2
cd mes_equipment_c
make
./mes_equipment
```

Windows의 MinGW Make는 환경에 따라 `mingw32-make`를 사용하고, 실행 파일 이름은 `mes_machine.exe` / `mes_equipment.exe`입니다. 빌드 결과물은 저장소에 포함하지 않았습니다.

| 공정 | TCP 포트 | 기본 machineId |
| --- | --- | --- |
| 전극 | 5006 | `LINE-01-M01-5006` |
| 조립 | 5007 | `LINE-01-M01-5007` |
| 활성화 | 5008 | `LINE-01-M01-5008` |
| 팩 | 5009 | `LINE-01-M01-5009` |
| 검사 | 5010 | `LINE-01-M01-5010` |
| 포장 | 5011 | `LINE-01-M01-5011` |

작업지시 폴링에는 기본 `LINE-01-M01`을 사용하고, 공정별 실적·환경 보고에는 위처럼 포트가 붙은 machineId를 사용합니다. 백엔드 초기 설비 포트와 L2의 보고용 machineId 생성 규칙이 일치해야 합니다. 사용 포트가 이미 점유되어 있다면 관련 L1·L2·백엔드 설정을 함께 조정합니다.

## TCP 패킷

[L1 프로토콜 정의](mes_machine_c/protocol.h)와 [L2 프로토콜 정의](mes_equipment_c/protocol.h)는 같은 패킷 형식을 사용합니다.

| 유형 | 형식·내용 |
| --- | --- |
| 기본 패킷 | `[STX 1][type 1][value 4][ETX 1]`, 총 7바이트 |
| 검사 패킷 | `[STX 1][type 1][전압 4][용량 4][저항 4][예약 1][ETX 1]`, 총 16바이트 |
| `0x10 / 0x11 / 0x12` | 온도 / 습도 / 전압 |
| `0x20` | L2→L1 작업지시, L1→L2 생산실적 |
| `0x31 ~ 0x36` | 전극 두께, 조립 정렬, 활성화 전류, 체결 토크, 검사 품질, 포장 중량 |

4바이트 수치는 리틀엔디언 정수로 직렬화하며 검사 데이터는 전압·용량 등의 소수 값을 일정 배수로 곱해 정수로 표현합니다. 센서 값은 시뮬레이션용 생성 값이며 실물 배터리의 공정 규격을 보증하는 데이터는 아닙니다.

## 테스트·확인 범위

원본에는 [패킷 테스트](mes_machine_c/protocol_test.c), [큐 테스트](mes_machine_c/queue_test.c), [실적 보고 테스트](mes_equipment_c/test_report_production.c), [가짜 백엔드](mes_equipment_c/fake_backend.py) 등의 테스트 도구가 있습니다.

소스·Makefile·프로토콜·연결 지점은 코드로 검토했습니다. **시뮬레이터 빌드와 실제 백엔드 연동 테스트는 실행하지 않았습니다**.

## 문서

- [프로젝트 포트폴리오·담당 업무·회고](../README.md)
- [백엔드 API·생산 준비](../backend/README.md)
- [프론트 화면·API 연결](../frontend/README.md)
- [통합 출처](../SOURCE.md) · [시뮬레이터 출처 기록](docs/SOURCE.md)
