/* 큐 자료구조 단독 검증용 테스트 - 가짜 생산자/소비자 스레드 1쌍, 네트워크 없음 */
#include <stdio.h>
#include <pthread.h>
#include "queue.h"

#define ITEM_COUNT 20
#define QUEUE_CAPACITY 4 /* 항목 수보다 작게 잡아서 push 대기(not_full)도 실제로 발생시킴 */

typedef struct {
    Queue *q;
    int ok; /* 소비자 스레드가 채움: 1 = 검증 성공, 0 = 실패 */
} TestContext;

static void *producer_func(void *arg)
{
    TestContext *ctx = (TestContext *)arg;

    for (int i = 0; i < ITEM_COUNT; i++) {
        queue_push(ctx->q, &i);
        printf("[생산자] push: %d\n", i);
    }
    queue_close(ctx->q);
    printf("[생산자] queue_close 호출, 종료\n");
    return NULL;
}

static void *consumer_func(void *arg)
{
    TestContext *ctx = (TestContext *)arg;
    int expected = 0;
    int order_ok = 1;

    while (1) {
        int value;
        int result = queue_pop(ctx->q, &value);
        if (result == 0) {
            printf("[소비자] 큐가 닫혔고 비어있음 -> 종료\n");
            break;
        }

        printf("[소비자] pop: %d\n", value);
        if (value != expected) {
            printf("[소비자] 순서 오류! 기대값=%d, 실제값=%d\n", expected, value);
            order_ok = 0;
        }
        expected++;
    }

    ctx->ok = (order_ok && expected == ITEM_COUNT) ? 1 : 0;
    return NULL;
}

int main(void)
{
    Queue q;
    if (queue_init(&q, sizeof(int), QUEUE_CAPACITY) != 0) {
        fprintf(stderr, "queue_init 실패\n");
        return 1;
    }

    TestContext ctx = { &q, 0 };

    pthread_t producer_tid, consumer_tid;
    pthread_create(&producer_tid, NULL, producer_func, &ctx);
    pthread_create(&consumer_tid, NULL, consumer_func, &ctx);

    pthread_join(producer_tid, NULL);
    pthread_join(consumer_tid, NULL);

    queue_destroy(&q);

    if (ctx.ok) {
        printf("\n=== 검증 성공: %d개 순서대로 수신, 데드락 없이 종료 ===\n", ITEM_COUNT);
        return 0;
    }

    printf("\n=== 검증 실패 ===\n");
    return 1;
}
