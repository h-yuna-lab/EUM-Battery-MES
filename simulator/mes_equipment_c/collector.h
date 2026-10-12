#ifndef COLLECTOR_H
#define COLLECTOR_H

#include "net.h"
#include <pthread.h>

/*
 * L1(설비)과의 TCP 연결 및 상태를 관리한다.
 * 원본 C#의 MachineSimulator.cs 중 TCP 관련 부분에 대응.
 */
typedef struct {
    socket_t sock;
    pthread_mutex_t lock;   /* sock, connected, current_* 필드를 메인/수신 스레드가 공유하므로 보호 */
    volatile int connected;
    int port;                /* 이 Collector가 담당하는 L1 포트. 재연결 시 자기 포트로 다시 붙기 위해 필요 */

    /* 현재 진행 중인 작업지시 (생산실적 보고 시 필요) */
    long current_order_id;
    char current_product_code[64];
    int has_order;
} Collector;

/* port: 이 Collector가 평생 담당할 L1 포트 (재연결 시에도 이 값을 씀) */
void collector_init(Collector *c, int port);
void collector_destroy(Collector *c);

/* L1(설비)에 연결될 때까지 블로킹 상태로 재시도 */
void collector_connect_to_device(Collector *c, const char *ip, int port);

/* L1 -> L2 수신 루프: 온도/생산실적 패킷을 처리한다. 별도 스레드로 실행할 것 */
void *collector_receive_loop(void *arg);

/* 작업지시 상태만 갱신(패킷 전송 없음) - 작업지시 개념이 없는 공정(조립~포장)의 리포트에 order_id를 붙이기 위해 씀 */
void collector_set_current_order(Collector *c, long order_id, const char *product_code);

/* 새 작업지시를 L1에 전달하고, 현재 작업지시로 캐싱한다 (전극 전용 - 작업지시 게이팅이 있는 설비만) */
void collector_dispatch_work_order(Collector *c, long order_id, const char *product_code, int target_qty);

#endif /* COLLECTOR_H */
