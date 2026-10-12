#ifndef PROTOCOL_H
#define PROTOCOL_H

#include <stdint.h>

/*
 * mes_machine(L1) <-> mes_equipment(L2) 사이의 통신 프로토콜
 * 원본 C# 버전과 100% 동일한 포맷을 유지한다.
 *
 * [STX 0x02][msgType 1byte][value 4byte, 리틀엔디언][ETX 0x03]  = 총 7바이트
 *
 * msgType 0x10 : 온도 데이터        (L1 -> L2)
 * msgType 0x11 : 습도 데이터        (L1 -> L2)
 * msgType 0x12 : 전압 데이터        (L1 -> L2)
 * msgType 0x20 : 생산실적(L1 -> L2) 또는 작업지시(L2 -> L1) - 방향에 따라 의미가 다름
 */

#define PACKET_SIZE 7
#define STX 0x02
#define ETX 0x03

#define MSG_TEMPERATURE       0x10
#define MSG_HUMIDITY          0x11
#define MSG_VOLTAGE           0x12
#define MSG_PRODUCTION_OR_ORDER 0x20

/*
 * 공정별 신규 타입 (옵션 1.5: 타입별 고정크기, 기존 7바이트 포맷은 안 바꿈)
 * 전극/조립/활성화/팩/포장 = 기존 packet_build/packet_get_value 그대로 재사용(7바이트).
 * 검사(0x35)만 3필드짜리라 아래 QualityData 전용 함수를 따로 씀(16바이트).
 */
#define MSG_ELECTRODE_THICKNESS   0x31 /* 전극 - 두께(μm) */
#define MSG_ASSEMBLY_ALIGNMENT    0x32 /* 조립 - 정렬오차(mm), 음수 가능 */
#define MSG_ACTIVATION_CURRENT    0x33 /* 활성화 - 초기충전전류(A) */
#define MSG_PACK_TORQUE           0x34 /* 팩 - 체결토크(N·m) */
#define MSG_INSPECTION_QUALITY    0x35 /* 검사 - QualityData 3필드, 16바이트 전용 포맷 */
#define MSG_PACKAGING_WEIGHT      0x36 /* 포장 - 중량(g) */

/* value를 리틀엔디언 4바이트로 직접 인코딩한다 (호스트 엔디언에 의존하지 않음) */
void packet_build(uint8_t out7[PACKET_SIZE], uint8_t msg_type, int32_t value);

/* STX/ETX가 올바른지 검사 */
int packet_validate(const uint8_t buf7[PACKET_SIZE]);

/* msgType 추출 */
uint8_t packet_get_type(const uint8_t buf7[PACKET_SIZE]);

/* value 추출 (리틀엔디언으로 직접 디코딩) */
int32_t packet_get_value(const uint8_t buf7[PACKET_SIZE]);

/*
 * 검사(0x35) 전용 패킷: [STX(1)][type(1)][전압(4)][용량(4)][내부저항(4)][reserved(1)][ETX(1)] = 16바이트
 * 3필드 모두 리틀엔디언 int32로 직접 인코딩(컴파일러 구조체 패딩에 의존하지 않음). reserved는 0 고정, 예약용.
 */
#define QUALITY_PACKET_SIZE 16

typedef struct {
    int32_t voltage_x100;    /* 전압 V*100, 예: 3.7V -> 370 (배터리 셀 기준 3.2~4.2V) */
    int32_t capacity_x1000;  /* 용량 Ah*1000, 예: 2.5Ah -> 2500 */
    int32_t resistance_mohm; /* 내부저항 mΩ, 스케일링 없이 정수 그대로 */
} QualityData;

/* QualityData를 16바이트 패킷으로 인코딩 */
void quality_packet_build(uint8_t out16[QUALITY_PACKET_SIZE], const QualityData *data);

/* STX/ETX가 올바른지 검사 */
int quality_packet_validate(const uint8_t buf16[QUALITY_PACKET_SIZE]);

/* 16바이트 패킷에서 QualityData를 복원 */
void quality_packet_get(const uint8_t buf16[QUALITY_PACKET_SIZE], QualityData *out);

#endif /* PROTOCOL_H */
