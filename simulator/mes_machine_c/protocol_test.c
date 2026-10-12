/* 확장된 protocol.h 6개 타입 단독 검증 - build->parse 왕복 테스트, 네트워크/스레드 없음 */
#include <stdio.h>
#include "protocol.h"

static int g_all_ok = 1;

static void check(int condition, const char *label)
{
    if (condition) {
        printf("[PASS] %s\n", label);
    } else {
        printf("[FAIL] %s\n", label);
        g_all_ok = 0;
    }
}

/* 단일값 타입(7바이트) 하나를 build -> parse 왕복시켜서 검증한다 */
static void test_single_value(uint8_t msg_type, int32_t value, const char *label)
{
    uint8_t packet[PACKET_SIZE];
    packet_build(packet, msg_type, value);

    int valid = packet_validate(packet);
    uint8_t type_out = packet_get_type(packet);
    int32_t value_out = packet_get_value(packet);

    printf("-- %s (type=0x%02X, value=%d) --\n", label, msg_type, value);
    check(valid, "STX/ETX validate");
    check(type_out == msg_type, "type 왕복 일치");
    check(value_out == value, "value 왕복 일치");
}

static void test_quality_data(void)
{
    QualityData input;
    input.voltage_x100 = 370;     /* 3.7V */
    input.capacity_x1000 = 2500;  /* 2.5Ah */
    input.resistance_mohm = 25;   /* 25mΩ */

    uint8_t packet[QUALITY_PACKET_SIZE];
    quality_packet_build(packet, &input);

    printf("-- 검사(QualityData) (전압=3.7V, 용량=2.5Ah, 내부저항=25mΩ) --\n");
    check(quality_packet_validate(packet), "STX/ETX validate");
    check(packet[1] == MSG_INSPECTION_QUALITY, "type 바이트 확인");

    QualityData output;
    quality_packet_get(packet, &output);

    check(output.voltage_x100 == input.voltage_x100, "전압 왕복 일치 (370 -> 3.7V)");
    check(output.capacity_x1000 == input.capacity_x1000, "용량 왕복 일치 (2500 -> 2.5Ah)");
    check(output.resistance_mohm == input.resistance_mohm, "내부저항 왕복 일치 (25mΩ)");
}

int main(void)
{
    test_single_value(MSG_ELECTRODE_THICKNESS, 150, "전극(두께 150μm)");
    test_single_value(MSG_ASSEMBLY_ALIGNMENT, -2, "조립(정렬오차 -2mm, 음수)");
    test_single_value(MSG_ACTIVATION_CURRENT, 15, "활성화(초기충전전류 15A)");
    test_single_value(MSG_PACK_TORQUE, 45, "팩(체결토크 45N·m)");
    test_single_value(MSG_PACKAGING_WEIGHT, 350, "포장(중량 350g)");
    test_quality_data();

    if (g_all_ok) {
        printf("\n=== 검증 성공: 6개 타입 모두 build->parse 왕복 일치 ===\n");
        return 0;
    }

    printf("\n=== 검증 실패 ===\n");
    return 1;
}
