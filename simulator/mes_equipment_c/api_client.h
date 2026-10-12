#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <stdbool.h>
#include <stdint.h>

/* 원본 C#의 Models/WorkOrderDto.cs 대응 */
typedef struct {
    long id;
    char product_code[64];
    int target_qty;
    int current_qty;
    char status[32];
} WorkOrder;

/*
 * 원본 C#의 Models/ProductionReportDto.cs 대응 - 6개 공정 원시 측정값 보고용으로 재설계됨.
 * 판정(OK/NG)은 C가 안 함(백엔드 책임) - result/defect_code 필드 제거됨.
 * process_type은 L1 protocol.h의 MSG_* 원본 타입 바이트를 그대로 사용 (L2는 의미 해석 안 함).
 */
typedef struct {
    long order_id;
    char machine_id[64];
    char serial_no[128];
    uint8_t process_type; /* MSG_ELECTRODE_THICKNESS 등 0x31~0x36 원본 타입 */

    /* 단일값 공정(전극/조립/활성화/팩/포장, 0x31/0x32/0x33/0x34/0x36) 전용 */
    int32_t value;

    /* 검사공정(0x35) 전용 3필드. process_type==MSG_INSPECTION_QUALITY일 때만 유효 */
    int32_t voltage_x100;
    int32_t capacity_x1000;
    int32_t resistance_mohm;
} ProductionReport;

/* libcurl 전역 초기화/정리. 프로그램 시작/종료 시 한 번씩만 호출 */
int api_client_init(void);
void api_client_cleanup(void);

/* 작업 지시 폴링.
 * 반환값: 할당된 작업이 있으면 true(out에 채움), 없거나 통신 실패면 false */
bool api_poll_work_order(const char *base_url, const char *machine_id, WorkOrder *out);

/* 생산 실적 보고.
 * 반환값(정적 문자열): "OK" | "SHORTAGE" | "SERVER_ERROR" | "NETWORK_ERROR" */
const char *api_report_production(const char *base_url, const ProductionReport *report);

/* 환경센서(온도/습도/전압) 보고. QualityInspection/BOM차감/판정과 무관한 별도 엔드포인트(/machine/environment)로 전송.
 * report->value에 값을 담아서 호출(온도/습도/전압 공통, voltage_x100 등 검사 전용 필드는 안 씀).
 * 반환값(정적 문자열): "OK" | "SERVER_ERROR" | "NETWORK_ERROR" */
const char *api_report_environment(const char *base_url, const ProductionReport *report);

#endif /* API_CLIENT_H */
