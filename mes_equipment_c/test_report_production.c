/* api_report_production()이 지금 실제로 어떤 JSON을 보내는지 확인하는 단독 테스트 (가짜 백엔드 필요) */
#include <stdio.h>
#include <string.h>
#include "api_client.h"
#include "protocol.h"
#include "config.h"

int main(void)
{
    if (api_client_init() != 0) {
        fprintf(stderr, "libcurl 초기화 실패\n");
        return 1;
    }

    /* 단일값 공정(예: 전극 두께) 리포트 */
    ProductionReport single;
    memset(&single, 0, sizeof(single));
    single.order_id = 1;
    snprintf(single.machine_id, sizeof(single.machine_id), "%s", MACHINE_ID);
    snprintf(single.serial_no, sizeof(single.serial_no), "TEST-SERIAL-0001");
    single.process_type = MSG_ELECTRODE_THICKNESS;
    single.value = 150;

    const char *status1 = api_report_production(BASE_URL, &single);
    printf("단일값 리포트 결과: %s\n", status1);

    /* 검사공정(QualityData 3필드) 리포트 */
    ProductionReport quality;
    memset(&quality, 0, sizeof(quality));
    quality.order_id = 1;
    snprintf(quality.machine_id, sizeof(quality.machine_id), "%s", MACHINE_ID);
    snprintf(quality.serial_no, sizeof(quality.serial_no), "TEST-SERIAL-0002");
    quality.process_type = MSG_INSPECTION_QUALITY;
    quality.voltage_x100 = 370;
    quality.capacity_x1000 = 2500;
    quality.resistance_mohm = 25;

    const char *status2 = api_report_production(BASE_URL, &quality);
    printf("검사 리포트 결과: %s\n", status2);

    api_client_cleanup();
    return 0;
}
