#ifndef QUEUE_H
#define QUEUE_H

#include <stddef.h>
#include <pthread.h>

/*
 * 범용 스레드 안전 큐 (고정 크기 링버퍼)
 * - 특정 공정에 종속되지 않도록 item_size를 queue_init()에서 파라미터로 받는다.
 * - 항목은 포인터가 아니라 값(memcpy)으로 복사한다 (소유권 문제 없음).
 * - 나중에 6개 설비 컨베이어에서 스레드 사이를 잇는 5개 큐로 그대로 재사용할 목적.
 */

typedef struct {
    unsigned char *buffer; /* capacity * item_size 바이트 */
    size_t item_size;
    size_t capacity;
    size_t head;  /* 다음에 꺼낼 위치 */
    size_t tail;  /* 다음에 넣을 위치 */
    size_t count; /* 현재 들어있는 항목 수 */
    int closed;   /* queue_close() 호출됨 = 더 이상 push 안 됨 */
    pthread_mutex_t lock;
    pthread_cond_t not_empty;
    pthread_cond_t not_full;
} Queue;

/* capacity * item_size 만큼 버퍼를 할당하고 큐를 초기화한다. 성공 0, 실패 -1 */
int queue_init(Queue *q, size_t item_size, size_t capacity);

/* 큐가 점유한 자원(버퍼, 뮤텍스, 조건변수)을 해제한다 */
void queue_destroy(Queue *q);

/* item에서 item_size만큼 복사해 큐에 넣는다. 가득 차 있으면 자리가 날 때까지 대기.
 * 이미 닫힌 큐에 호출하면 즉시 실패(-1) */
int queue_push(Queue *q, const void *item);

/* 큐에서 하나 꺼내 out_item에 복사한다. 비어있으면 데이터가 들어오거나 닫힐 때까지 대기.
 * 반환값: 1 = 정상적으로 꺼냄, 0 = 큐가 닫혔고 더 꺼낼 데이터도 없음(정상 종료 신호) */
int queue_pop(Queue *q, void *out_item);

/* queue_pop의 논블로킹 버전 - 대기하지 않고 즉시 반환한다.
 * 반환값: 1 = 꺼냄, 0 = 비어있음(아직 닫히지 않음, 나중에 다시 시도), -1 = 닫혔고 비어있음(더 이상 안 옴) */
int queue_try_pop(Queue *q, void *out_item);

/* "더 이상 push 없음"을 알리고, 대기 중인 생산자/소비자를 모두 깨운다 */
void queue_close(Queue *q);

/* 현재 큐에 들어있는 항목 수 (진단/로그용, 뮤텍스로 보호된 안전한 읽기) */
size_t queue_size(Queue *q);

#endif /* QUEUE_H */
