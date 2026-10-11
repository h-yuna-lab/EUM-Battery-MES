/* 범용 뮤텍스 기반 큐 구현 - 고정 크기 링버퍼 */
#include "queue.h"
#include <stdlib.h>
#include <string.h>

int queue_init(Queue *q, size_t item_size, size_t capacity)
{
    if (item_size == 0 || capacity == 0) {
        return -1;
    }

    q->buffer = (unsigned char *)malloc(item_size * capacity);
    if (q->buffer == NULL) {
        return -1;
    }

    q->item_size = item_size;
    q->capacity = capacity;
    q->head = 0;
    q->tail = 0;
    q->count = 0;
    q->closed = 0;

    pthread_mutex_init(&q->lock, NULL);
    pthread_cond_init(&q->not_empty, NULL);
    pthread_cond_init(&q->not_full, NULL);

    return 0;
}

void queue_destroy(Queue *q)
{
    free(q->buffer);
    q->buffer = NULL;
    pthread_mutex_destroy(&q->lock);
    pthread_cond_destroy(&q->not_empty);
    pthread_cond_destroy(&q->not_full);
}

int queue_push(Queue *q, const void *item)
{
    pthread_mutex_lock(&q->lock);

    while (q->count == q->capacity && !q->closed) {
        pthread_cond_wait(&q->not_full, &q->lock);
    }

    if (q->closed) {
        pthread_mutex_unlock(&q->lock);
        return -1;
    }

    unsigned char *slot = q->buffer + (q->tail * q->item_size);
    memcpy(slot, item, q->item_size);
    q->tail = (q->tail + 1) % q->capacity;
    q->count++;

    pthread_cond_signal(&q->not_empty);
    pthread_mutex_unlock(&q->lock);
    return 1;
}

int queue_pop(Queue *q, void *out_item)
{
    pthread_mutex_lock(&q->lock);

    while (q->count == 0 && !q->closed) {
        pthread_cond_wait(&q->not_empty, &q->lock);
    }

    if (q->count == 0 && q->closed) {
        pthread_mutex_unlock(&q->lock);
        return 0;
    }

    unsigned char *slot = q->buffer + (q->head * q->item_size);
    memcpy(out_item, slot, q->item_size);
    q->head = (q->head + 1) % q->capacity;
    q->count--;

    pthread_cond_signal(&q->not_full);
    pthread_mutex_unlock(&q->lock);
    return 1;
}

int queue_try_pop(Queue *q, void *out_item)
{
    pthread_mutex_lock(&q->lock);

    if (q->count == 0) {
        int closed = q->closed;
        pthread_mutex_unlock(&q->lock);
        return closed ? -1 : 0;
    }

    unsigned char *slot = q->buffer + (q->head * q->item_size);
    memcpy(out_item, slot, q->item_size);
    q->head = (q->head + 1) % q->capacity;
    q->count--;

    pthread_cond_signal(&q->not_full);
    pthread_mutex_unlock(&q->lock);
    return 1;
}

void queue_close(Queue *q)
{
    pthread_mutex_lock(&q->lock);
    q->closed = 1;
    pthread_cond_broadcast(&q->not_empty);
    pthread_cond_broadcast(&q->not_full);
    pthread_mutex_unlock(&q->lock);
}

size_t queue_size(Queue *q)
{
    pthread_mutex_lock(&q->lock);
    size_t count = q->count;
    pthread_mutex_unlock(&q->lock);
    return count;
}
