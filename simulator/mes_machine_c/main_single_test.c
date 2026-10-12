/*
 * 체크리스트 6단계 Phase 2: 팩(5009)/검사(5010)/포장(5011) 추가, 전극~포장 6개 전체 체인
 * - 활성화: output=NULL -> output=&Q3로 변경 (Phase 1에서 예고된 변경).
 * - 팩: input=&Q3, output=&Q4. 검사: input=&Q4, output=&Q5 (send_quality_data 재추가, 16바이트 패킷도 중간에서 흐름 확인).
 * - 포장: input=&Q5, output=NULL (체인의 끝).
 * - 두께/정렬오차/초기충전전류/체결토크/중량 랜덤 범위는 실측 스펙이 아니라 테스트용 추정치(CLAUDE.md에 명시).
 * - Phase 1에서 "다운스트림이 매 틱 즉시 비워서 큐가 안 참" 근거를 확인했는데, 6개 전체에서도 유지되는지
 *   push 직후 queue_size()로 큐 깊이를 로그에 남겨서 확인한다 (queue_try_push 필요 여부 재판단용).
 */

#ifndef _WIN32
    #define _POSIX_C_SOURCE 199309L
#endif

#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <pthread.h>

#ifdef _WIN32
    #include <windows.h>
#endif

#include "net.h"
#include "protocol.h"
#include "queue.h"

#define ELECTRODE_PORT  5006
#define ASSEMBLY_PORT   5007
#define ACTIVATION_PORT 5008
#define PACK_PORT       5009
#define INSPECTION_PORT 5010
#define PACKAGING_PORT  5011

/* 컨베이어 연결용 최소 payload - "이전 공정이 하나 완료했다"는 신호일 뿐, LOT/측정값 없음 */
typedef struct {
    int item_id; /* 보낸 쪽의 로컬 완료 카운터 값(로그 확인용). 전체 라인 공용 식별자 아님 */
} ConveyorItem;

/* 공정별 측정값 생성+전송 콜백. seed는 이 설비(스레드) 전용 state, 0=성공/-1=전송 실패(연결 끊김) */
typedef int (*MeasureFn)(socket_t sock, unsigned int *seed);

/*
 * xorshift32 - rand()/rand_r() 대신 쓰는 자체 스레드 안전 PRNG.
 * MinGW-w64(Windows CRT)에는 rand_r()이 없어서(glibc 전용 확장) 직접 구현함.
 * 스레드마다 자기 state만 넘겨쓰면 락 없이도 안전(다른 스레드 state를 안 건드림).
 * 주의: state가 0이면 영원히 0만 나오는 xorshift의 함정이 있어, 시드는 반드시 0이 아니어야 함
 * (씨앗 보정은 make_seed()에서 처리, 연산 중에는 0이 아닌 값끼리만 순환하므로 별도 방어 불필요).
 */
static unsigned int station_rand(unsigned int *seed)
{
    unsigned int x = *seed;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    *seed = x;
    return x;
}

/* 시드 초기값이 0이 되지 않도록 보정 */
static unsigned int make_seed(unsigned int base)
{
    return (base == 0) ? 1 : base;
}

/* 플랫폼 무관 1초 sleep (main.c와 동일 패턴) */
static void sleep_one_second(void)
{
#ifdef _WIN32
    Sleep(1000);
#else
    struct timespec ts;
    ts.tv_sec = 1;
    ts.tv_nsec = 0;
    nanosleep(&ts, NULL);
#endif
}

/* 전극 - 두께(μm) 측정값 생성+전송. 범위는 실측 스펙 아닌 테스트용 추정치(CLAUDE.md 참고) */
static int send_electrode_thickness(socket_t sock, unsigned int *seed)
{
    int thickness = 100 + (int)(station_rand(seed) % 101); /* 100~200μm */

    uint8_t packet[PACKET_SIZE];
    packet_build(packet, MSG_ELECTRODE_THICKNESS, thickness);

    if (net_send(sock, packet, PACKET_SIZE) < 0) {
        return -1;
    }

    printf("[L1 -> L2] 전극 두께 송신: %dμm\n", thickness);
    return 0;
}

/* 조립 - 정렬오차(mm) 측정값 생성+전송. 음수 가능. 범위는 테스트용 추정치 */
static int send_assembly_alignment(socket_t sock, unsigned int *seed)
{
    int alignment = (int)(station_rand(seed) % 5) - 2; /* -2~2mm */

    uint8_t packet[PACKET_SIZE];
    packet_build(packet, MSG_ASSEMBLY_ALIGNMENT, alignment);

    if (net_send(sock, packet, PACKET_SIZE) < 0) {
        return -1;
    }

    printf("[L1 -> L2] 조립 정렬오차 송신: %dmm\n", alignment);
    return 0;
}

/* 활성화 - 초기충전전류(mA) 측정값 생성+전송. 단위는 mA(A 아님), 백엔드 연동 시 /1000 필요. 범위는 테스트용 추정치 */
static int send_activation_current(socket_t sock, unsigned int *seed)
{
    int current_ma = 500 + (int)(station_rand(seed) % 1001); /* 500~1500mA (0.5~1.5A) */

    uint8_t packet[PACKET_SIZE];
    packet_build(packet, MSG_ACTIVATION_CURRENT, current_ma);

    if (net_send(sock, packet, PACKET_SIZE) < 0) {
        return -1;
    }

    printf("[L1 -> L2] 활성화 초기충전전류 송신: %dmA\n", current_ma);
    return 0;
}

/* 팩 - 체결토크(N·m) 측정값 생성+전송. 범위는 테스트용 추정치 */
static int send_pack_torque(socket_t sock, unsigned int *seed)
{
    int torque = 5 + (int)(station_rand(seed) % 11); /* 5~15 N·m */

    uint8_t packet[PACKET_SIZE];
    packet_build(packet, MSG_PACK_TORQUE, torque);

    if (net_send(sock, packet, PACKET_SIZE) < 0) {
        return -1;
    }

    printf("[L1 -> L2] 팩 체결토크 송신: %dN·m\n", torque);
    return 0;
}

/* 검사 - 배터리 셀 기준 QualityData(전압/용량/내부저항) 생성+전송 */
static int send_quality_data(socket_t sock, unsigned int *seed)
{
    QualityData q;
    q.voltage_x100 = 320 + (station_rand(seed) % 101);    /* 3.20~4.20V */
    q.capacity_x1000 = 4800 + (station_rand(seed) % 401); /* 4.800~5.200Ah */
    q.resistance_mohm = 20 + (station_rand(seed) % 11);   /* 20~30mΩ */

    uint8_t packet[QUALITY_PACKET_SIZE];
    quality_packet_build(packet, &q);

    if (net_send(sock, packet, QUALITY_PACKET_SIZE) < 0) {
        return -1;
    }

    printf("[L1 -> L2] 검사 송신: 전압=%.2fV 용량=%.3fAh 내부저항=%dmΩ\n",
           q.voltage_x100 / 100.0, q.capacity_x1000 / 1000.0, q.resistance_mohm);
    return 0;
}

/* 포장 - 중량(g) 측정값 생성+전송. 범위는 테스트용 추정치 */
static int send_packaging_weight(socket_t sock, unsigned int *seed)
{
    int weight = 300 + (int)(station_rand(seed) % 201); /* 300~500g */

    uint8_t packet[PACKET_SIZE];
    packet_build(packet, MSG_PACKAGING_WEIGHT, weight);

    if (net_send(sock, packet, PACKET_SIZE) < 0) {
        return -1;
    }

    printf("[L1 -> L2] 포장 중량 송신: %dg\n", weight);
    return 0;
}

/*
 * 접속 하나에 대한 메인 루프.
 * 온도는 매 틱 끊김 없이 전송. 측정값(measure_fn) 트리거만 input_queue 유무로 갈림:
 * - input_queue 없음: 기존처럼 5틱마다 트리거
 * - input_queue 있음: 매 틱 queue_try_pop으로 확인, 신호가 있을 때만 트리거(논블로킹이라 온도는 안 멈춤)
 * 측정 성공 시 output_queue가 있으면 완료 신호(ConveyorItem)를 enqueue.
 */
static void run_device_loop(socket_t client_sock, MeasureFn measure_fn, unsigned int *seed,
                             int *completed_count, Queue *input_queue, Queue *output_queue)
{
    int connected = 1;
    int tick = 0;

    while (connected) {
        tick++;

        uint8_t temp_packet[PACKET_SIZE];
        int temp_value = 20 + (station_rand(seed) % 70); /* 20~89 */
        packet_build(temp_packet, MSG_TEMPERATURE, temp_value);

        if (net_send(client_sock, temp_packet, PACKET_SIZE) < 0) {
            printf("연결이 끊어짐.\n");
            break;
        }
        printf("[L1 -> L2] 온도 송신: %d\n", temp_value);

        int should_measure = 0;

        if (input_queue != NULL) {
            ConveyorItem item;
            int result = queue_try_pop(input_queue, &item);
            if (result == 1) {
                printf("[컨베이어] 이전 공정 신호 수신 (item_id=%d)\n", item.item_id);
                should_measure = 1;
            } else if (result == -1) {
                printf("[컨베이어] 업스트림 종료 감지, 이 공정도 종료\n");
                break;
            }
            /* result == 0: 아직 신호 없음, 이번 틱은 온도만 보내고 넘어감 */
        } else if (tick % 5 == 0) {
            should_measure = 1;
        }

        if (should_measure) {
            if (measure_fn(client_sock, seed) < 0) {
                printf("연결이 끊어짐.\n");
                break;
            }

            if (output_queue != NULL) {
                (*completed_count)++;
                ConveyorItem out_item;
                out_item.item_id = *completed_count;
                queue_push(output_queue, &out_item);
                /* push 직후 깊이 - Phase 1에서 확인한 "다운스트림이 즉시 비움" 근거가 유지되는지 관찰용 */
                printf("[컨베이어] 완료 신호 전송 (item_id=%d, 큐 깊이=%zu/%zu)\n",
                       out_item.item_id, queue_size(output_queue), output_queue->capacity);
            }
        }

        sleep_one_second();
    }

    net_close(client_sock);

    if (output_queue != NULL) {
        queue_close(output_queue); /* 이 공정 종료 -> 다운스트림도 연쇄 종료되도록 신호 */
    }
}

/*
 * 공정 하나를 담당하는 설비를 구동한다.
 * port: listen 포트, station_name: 로그용 공정 이름, measure_fn: 이 공정 전용 측정값 생성+전송 콜백
 * input_queue/output_queue: 컨베이어 연결용. 없으면 NULL.
 */
static void run_station_device(int port, const char *station_name, MeasureFn measure_fn,
                                Queue *input_queue, Queue *output_queue)
{
    /* 스레드(설비)마다 독립된 시드. port를 섞어서 같은 초 안에 여러 스레드가 떠도 값이 겹치지 않게 함 */
    unsigned int seed = make_seed((unsigned int)time(NULL) ^ (unsigned int)port);
    int completed_count = 0; /* 이 설비 전용 로컬 카운터. 다른 설비와 공유 안 함 */

    socket_t server_sock = net_listen(port, 1);
    if (server_sock == SOCKET_INVALID) {
        fprintf(stderr, "listen 실패: %s\n", net_last_error());
        return;
    }

    printf("[%s 설비 가동] 수집기 접속 대기 중... (Port : %d)\n", station_name, port);

    char client_ip[64];
    socket_t client_sock = net_accept(server_sock, client_ip, sizeof(client_ip));
    if (client_sock == SOCKET_INVALID) {
        fprintf(stderr, "accept 실패: %s\n", net_last_error());
        net_close(server_sock);
        return;
    }

    printf("수집기(L2)가 접속 되었습니다. Remote=%s\n", client_ip);
    run_device_loop(client_sock, measure_fn, &seed, &completed_count, input_queue, output_queue);

    net_close(server_sock);
}

/* pthread_create에 넘길 인자 묶음 */
typedef struct {
    int port;
    const char *station_name;
    MeasureFn measure_fn;
    Queue *input_queue;
    Queue *output_queue;
} StationArgs;

static void *station_thread_main(void *arg)
{
    StationArgs *args = (StationArgs *)arg;
    run_station_device(args->port, args->station_name, args->measure_fn,
                        args->input_queue, args->output_queue);
    return NULL;
}

int main(void)
{
#ifdef _WIN32
    SetConsoleOutputCP(CP_UTF8);
#endif

    if (net_init() != 0) {
        fprintf(stderr, "네트워크 초기화 실패\n");
        return 1;
    }

    Queue q1, q2, q3, q4, q5;
    if (queue_init(&q1, sizeof(ConveyorItem), 4) != 0 ||
        queue_init(&q2, sizeof(ConveyorItem), 4) != 0 ||
        queue_init(&q3, sizeof(ConveyorItem), 4) != 0 ||
        queue_init(&q4, sizeof(ConveyorItem), 4) != 0 ||
        queue_init(&q5, sizeof(ConveyorItem), 4) != 0) {
        fprintf(stderr, "큐 초기화 실패\n");
        net_cleanup();
        return 1;
    }

    /* 전극: 업스트림 없음(input=NULL), Q1에 완료 신호 enqueue */
    StationArgs electrode_args = { ELECTRODE_PORT, "전극", send_electrode_thickness, NULL, &q1 };
    /* 조립: Q1에서 신호 대기, Q2에 완료 신호 enqueue */
    StationArgs assembly_args = { ASSEMBLY_PORT, "조립", send_assembly_alignment, &q1, &q2 };
    /* 활성화: Q2에서 신호 대기, Q3에 완료 신호 enqueue */
    StationArgs activation_args = { ACTIVATION_PORT, "활성화", send_activation_current, &q2, &q3 };
    /* 팩: Q3에서 신호 대기, Q4에 완료 신호 enqueue */
    StationArgs pack_args = { PACK_PORT, "팩", send_pack_torque, &q3, &q4 };
    /* 검사: Q4에서 신호 대기, Q5에 완료 신호 enqueue */
    StationArgs inspection_args = { INSPECTION_PORT, "검사", send_quality_data, &q4, &q5 };
    /* 포장: Q5에서 신호 대기, 다운스트림 없음(output=NULL) -> 체인의 끝 */
    StationArgs packaging_args = { PACKAGING_PORT, "포장", send_packaging_weight, &q5, NULL };

    pthread_t electrode_tid, assembly_tid, activation_tid, pack_tid, inspection_tid, packaging_tid;
    pthread_create(&electrode_tid, NULL, station_thread_main, &electrode_args);
    pthread_create(&assembly_tid, NULL, station_thread_main, &assembly_args);
    pthread_create(&activation_tid, NULL, station_thread_main, &activation_args);
    pthread_create(&pack_tid, NULL, station_thread_main, &pack_args);
    pthread_create(&inspection_tid, NULL, station_thread_main, &inspection_args);
    pthread_create(&packaging_tid, NULL, station_thread_main, &packaging_args);

    pthread_join(electrode_tid, NULL);
    pthread_join(assembly_tid, NULL);
    pthread_join(activation_tid, NULL);
    pthread_join(pack_tid, NULL);
    pthread_join(inspection_tid, NULL);
    pthread_join(packaging_tid, NULL);

    queue_destroy(&q1);
    queue_destroy(&q2);
    queue_destroy(&q3);
    queue_destroy(&q4);
    queue_destroy(&q5);
    net_cleanup();
    return 0;
}
