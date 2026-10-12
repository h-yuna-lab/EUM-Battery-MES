/* POSIX에서 nanosleep을 쓰기 위해 필요 */
#ifndef _WIN32
    #define _POSIX_C_SOURCE 199309L
#endif

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <pthread.h>

#include "net.h"
#include "protocol.h"
#include "api_client.h"
#include "collector.h"
#include "config.h"

#ifdef _WIN32
    #include <windows.h>
#endif

static void sleep_ms(int ms)
{
#ifdef _WIN32
    Sleep(ms);
#else
    struct timespec ts;
    ts.tv_sec = ms / 1000;
    ts.tv_nsec = (long)(ms % 1000) * 1000000L;
    nanosleep(&ts, NULL);
#endif
}

/* L1 6개 설비 포트/이름 - mes_machine_c/main.c와 이름 통일(grep으로 대조 확인함) */
typedef struct {
    int port;
    const char *station_name;
} StationConfig;

static const StationConfig STATIONS[6] = {
    { ELECTRODE_PORT,  "전극" },
    { ASSEMBLY_PORT,   "조립" },
    { ACTIVATION_PORT, "활성화" },
    { PACK_PORT,       "팩" },
    { INSPECTION_PORT, "검사" },
    { PACKAGING_PORT,  "포장" },
};

int main(void)
{
#ifdef _WIN32
    SetConsoleOutputCP(CP_UTF8);
#endif

    srand((unsigned int)time(NULL));

    if (net_init() != 0) {
        fprintf(stderr, "네트워크 초기화 실패\n");
        return 1;
    }
    if (api_client_init() != 0) {
        fprintf(stderr, "libcurl 초기화 실패\n");
        net_cleanup();
        return 1;
    }

    printf("수집기 가동 시작....\n");

    /* 6개 설비용 Collector 배열. 각자 자기 포트를 알고(port 필드), 각자 수신 스레드를 가짐 */
    Collector collectors[6];
    for (int i = 0; i < 6; i++) {
        collector_init(&collectors[i], STATIONS[i].port);
    }

    /* 원본 C#의 `_ = Task.Run(...)`에 대응: 수신 루프를 별도 스레드로 계속 실행.
     * collector_receive_loop() 안에 "연결 안 됐으면 연결" 로직이 이미 있어서, 여기서 별도로
     * 최초 연결을 기다릴 필요 없음 - 스레드 안에서 알아서 연결하고 계속 수신함. */
    pthread_t recv_tids[6];
    for (int i = 0; i < 6; i++) {
        pthread_create(&recv_tids[i], NULL, collector_receive_loop, &collectors[i]);
        pthread_detach(recv_tids[i]);
    }

    for (;;) {
        WorkOrder order;
        bool has_order = api_poll_work_order(BASE_URL, MACHINE_ID, &order);

        if (has_order) {
            printf("작업 수주 : %s / 진행:%d/%d / 상태:%s\n",
                   order.product_code, order.current_qty, order.target_qty, order.status);

            /* 전극만 작업지시 게이팅이 있어서 실제로 패킷을 전달함. 나머지 5개는 작업지시
             * 개념이 없지만, 리포트에 order_id를 붙여야 하므로 상태만 동기화한다. */
            collector_dispatch_work_order(&collectors[0], order.id, order.product_code, order.target_qty);
            for (int i = 1; i < 6; i++) {
                collector_set_current_order(&collectors[i], order.id, order.product_code);
            }
        } else {
            printf("[-] 현재 할당된 작업이 없습니다.\n");
        }

        sleep_ms(POLLING_INTERVAL_MS);
    }

    /* 도달하지 않지만 형식상 정리 코드 */
    for (int i = 0; i < 6; i++) {
        collector_destroy(&collectors[i]);
    }
    api_client_cleanup();
    net_cleanup();
    return 0;
}
