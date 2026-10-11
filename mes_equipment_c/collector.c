/* POSIX에서 localtime_r, nanosleep을 쓰기 위해 필요 */
#ifndef _WIN32
    #define _POSIX_C_SOURCE 199309L
#endif

#include "collector.h"
#include "protocol.h"
#include "api_client.h"
#include "config.h"

#include <stdio.h>
#include <string.h>
#include <time.h>
#include <stdlib.h>

#ifdef _WIN32
    #include <windows.h>
#endif

void collector_init(Collector *c, int port)
{
    c->sock = SOCKET_INVALID;
    c->connected = 0;
    c->port = port;
    c->current_order_id = 0;
    c->current_product_code[0] = '\0';
    c->has_order = 0;
    pthread_mutex_init(&c->lock, NULL);
}

void collector_destroy(Collector *c)
{
    pthread_mutex_destroy(&c->lock);
}

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

void collector_connect_to_device(Collector *c, const char *ip, int port)
{
    for (;;) {
        pthread_mutex_lock(&c->lock);
        int already = c->connected;
        pthread_mutex_unlock(&c->lock);
        if (already) {
            return;
        }

        socket_t s = net_connect(ip, port);
        if (s != SOCKET_INVALID) {
            pthread_mutex_lock(&c->lock);
            c->sock = s;
            c->connected = 1;
            pthread_mutex_unlock(&c->lock);
            printf("L1 장비 연결 성공\n");
            return;
        }

        printf("L1 연결 실패. 재 시도 중....\n");
        sleep_ms(3000);
    }
}

/* GUID 8자리 대체용 랜덤 8자리 hex (완전한 유일성 보장은 아님, 8장 참고) */
static void make_serial_no(char *out, size_t out_size, const char *product_code)
{
    time_t now = time(NULL);
    struct tm tm_now;
#ifdef _WIN32
    localtime_s(&tm_now, &now);
#else
    localtime_r(&now, &tm_now);
#endif
    char date_part[16];
    strftime(date_part, sizeof(date_part), "%Y%m%d", &tm_now);

    unsigned int rand_part = ((unsigned int)(rand() & 0xFFFF) << 16) | (unsigned int)(rand() & 0xFFFF);
    snprintf(out, out_size, "%s-%s-%08X", product_code, date_part, rand_part);
}

/* order_id/product_code/serial_no까지 채운 리포트 뼈대를 만든다. 작업지시 없으면 0 반환(report 안 채움) */
static int prepare_report_base(Collector *c, ProductionReport *report)
{
    pthread_mutex_lock(&c->lock);
    int has_order = c->has_order;
    long order_id = c->current_order_id;
    int port = c->port;
    char product_code[64];
    snprintf(product_code, sizeof(product_code), "%s", c->current_product_code);
    pthread_mutex_unlock(&c->lock);

    if (!has_order) {
        return 0;
    }

    char serial_no[128];
    make_serial_no(serial_no, sizeof(serial_no), product_code);

    memset(report, 0, sizeof(*report));
    report->order_id = order_id;
    snprintf(report->machine_id, sizeof(report->machine_id), "%s-%d", MACHINE_ID, port);
    snprintf(report->serial_no, sizeof(report->serial_no), "%s", serial_no);
    return 1;
}

/* 환경센서(온도/습도/전압) 보고 - QualityInspection/BOM차감/판정 로직과 무관, /machine/environment로 전송 */
static void handle_environment(Collector *c, uint8_t process_type, int32_t value)
{
    if (process_type == MSG_TEMPERATURE && value >= 80) {
        printf("[경고] 과열: %d C\n", value);
    }

    ProductionReport report;
    if (!prepare_report_base(c, &report)) {
        printf("[WARN] 현재 작업 지시가 없어 환경센서 값을 처리할 수 없습니다.\n");
        return;
    }
    report.process_type = process_type;
    report.value = value;

    const char *status = api_report_environment(BASE_URL, &report);
    printf("환경센서 보고 : type=0x%02X value=%d (%s)\n", process_type, value, status);
}

/* 단일값 공정(전극/조립/활성화/팩/포장) 측정값 보고 */
static void handle_measurement(Collector *c, uint8_t process_type, int32_t value)
{
    ProductionReport report;
    if (!prepare_report_base(c, &report)) {
        printf("[WARN] 현재 작업 지시가 없어 생산 결과를 처리할 수 없습니다.\n");
        return;
    }
    report.process_type = process_type;
    report.value = value;

    const char *status = api_report_production(BASE_URL, &report);

    if (strcmp(status, "SHORTAGE") == 0) {
        printf(" [ALARM] 자재 재고가 부족합니다! \n");
    } else {
        printf("생산 보고 : type=0x%02X value=%d (%s)\n", process_type, value, status);
    }
}

/* 검사공정(QualityData 3필드) 측정값 보고 */
static void handle_quality_measurement(Collector *c, const QualityData *q)
{
    ProductionReport report;
    if (!prepare_report_base(c, &report)) {
        printf("[WARN] 현재 작업 지시가 없어 생산 결과를 처리할 수 없습니다.\n");
        return;
    }
    report.process_type = MSG_INSPECTION_QUALITY;
    report.voltage_x100 = q->voltage_x100;
    report.capacity_x1000 = q->capacity_x1000;
    report.resistance_mohm = q->resistance_mohm;

    const char *status = api_report_production(BASE_URL, &report);

    if (strcmp(status, "SHORTAGE") == 0) {
        printf(" [ALARM] 자재 재고가 부족합니다! \n");
    } else {
        printf("생산 보고 : type=0x35(검사) 전압=%.2fV 용량=%.3fAh 저항=%dmOhm (%s)\n",
               q->voltage_x100 / 100.0, q->capacity_x1000 / 1000.0, q->resistance_mohm, status);
    }
}

/* MSG_INSPECTION_QUALITY(0x35)만 16바이트, 나머지는 전부 7바이트 */
static int packet_length_for_type(uint8_t type)
{
    return (type == MSG_INSPECTION_QUALITY) ? QUALITY_PACKET_SIZE : PACKET_SIZE;
}

void *collector_receive_loop(void *arg)
{
    Collector *c = (Collector *)arg;
    uint8_t buf[QUALITY_PACKET_SIZE]; /* 6개 타입 중 가장 큰 패킷(QualityData, 16바이트) 기준 */

    for (;;) {
        pthread_mutex_lock(&c->lock);
        int connected = c->connected;
        socket_t sock = c->sock;
        pthread_mutex_unlock(&c->lock);

        if (!connected) {
            pthread_mutex_lock(&c->lock);
            int port = c->port;
            pthread_mutex_unlock(&c->lock);
            collector_connect_to_device(c, L1_IP, port);
            continue;
        }

        /* STX+type 2바이트를 먼저 읽어서 타입별 길이를 판단한다.
         * (검사공정 포트는 온도(7바이트)와 QualityData(16바이트)가 섞여서 오므로, 고정 길이로 읽으면 안 됨) */
        int n = net_recv_exact(sock, buf, 2);
        if (n <= 0) {
            pthread_mutex_lock(&c->lock);
            net_close(c->sock);
            c->sock = SOCKET_INVALID;
            c->connected = 0;
            pthread_mutex_unlock(&c->lock);
            continue;
        }

        uint8_t type = buf[1];
        int total_len = packet_length_for_type(type);

        n = net_recv_exact(sock, buf + 2, total_len - 2);
        if (n <= 0) {
            pthread_mutex_lock(&c->lock);
            net_close(c->sock);
            c->sock = SOCKET_INVALID;
            c->connected = 0;
            pthread_mutex_unlock(&c->lock);
            continue;
        }

        if (buf[0] != STX || buf[total_len - 1] != ETX) {
            continue; /* STX/ETX 불일치 - 버림 */
        }

        if (type == MSG_TEMPERATURE || type == MSG_HUMIDITY || type == MSG_VOLTAGE) {
            handle_environment(c, type, packet_get_value(buf));
        } else if (type == MSG_INSPECTION_QUALITY) {
            QualityData q;
            quality_packet_get(buf, &q);
            handle_quality_measurement(c, &q);
        } else if (type == MSG_ELECTRODE_THICKNESS || type == MSG_ASSEMBLY_ALIGNMENT ||
                   type == MSG_ACTIVATION_CURRENT || type == MSG_PACK_TORQUE ||
                   type == MSG_PACKAGING_WEIGHT) {
            handle_measurement(c, type, packet_get_value(buf));
        }
        /* 그 외 타입(레거시 0x20 등)은 이제 L1이 안 보내므로 조용히 무시 */
    }
    return NULL;
}

void collector_set_current_order(Collector *c, long order_id, const char *product_code)
{
    pthread_mutex_lock(&c->lock);
    c->current_order_id = order_id;
    snprintf(c->current_product_code, sizeof(c->current_product_code), "%s", product_code);
    c->has_order = 1;
    pthread_mutex_unlock(&c->lock);
}

void collector_dispatch_work_order(Collector *c, long order_id, const char *product_code, int target_qty)
{
    collector_set_current_order(c, order_id, product_code);

    pthread_mutex_lock(&c->lock);
    int connected = c->connected;
    socket_t sock = c->sock;
    pthread_mutex_unlock(&c->lock);

    if (!connected) {
        return;
    }

    uint8_t packet[PACKET_SIZE];
    packet_build(packet, MSG_PRODUCTION_OR_ORDER, target_qty);

    if (net_send(sock, packet, PACKET_SIZE) < 0) {
        printf("연결이 끊어짐.\n");
        return;
    }

    printf("[CMD] 설비에 작업 지시 전달 -> 목표 수량: %d\n", target_qty);
}
