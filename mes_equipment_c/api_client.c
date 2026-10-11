#include "api_client.h"
#include "protocol.h" /* MSG_INSPECTION_QUALITY - process_type 분기용 */

#include <curl/curl.h>
#include <cjson/cJSON.h>

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* curl 응답 본문을 담아둘 동적 버퍼 */
typedef struct {
    char *data;
    size_t size;
} ResponseBuffer;

static size_t write_callback(void *ptr, size_t size, size_t nmemb, void *userdata)
{
    size_t total = size * nmemb;
    ResponseBuffer *buf = (ResponseBuffer *)userdata;

    char *new_data = (char *)realloc(buf->data, buf->size + total + 1);
    if (new_data == NULL) {
        return 0; /* 0을 반환하면 libcurl이 전송을 중단시킴 */
    }

    buf->data = new_data;
    memcpy(buf->data + buf->size, ptr, total);
    buf->size += total;
    buf->data[buf->size] = '\0';
    return total;
}

int api_client_init(void)
{
    return (curl_global_init(CURL_GLOBAL_DEFAULT) == CURLE_OK) ? 0 : -1;
}

void api_client_cleanup(void)
{
    curl_global_cleanup();
}

bool api_poll_work_order(const char *base_url, const char *machine_id, WorkOrder *out)
{
    CURL *curl = curl_easy_init();
    if (curl == NULL) {
        return false;
    }

    char *escaped_id = curl_easy_escape(curl, machine_id, 0);
    char url[512];
    snprintf(url, sizeof(url), "%sapi/mes/machine/poll?machineId=%s",
             base_url, (escaped_id != NULL) ? escaped_id : machine_id);
    if (escaped_id != NULL) {
        curl_free(escaped_id);
    }

    ResponseBuffer resp = { NULL, 0 };
    long http_status = 0;

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &resp);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);

    CURLcode res = curl_easy_perform(curl);
    if (res == CURLE_OK) {
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_status);
    } else {
        fprintf(stderr, "[Error] API 통신 실패 : %s\n", curl_easy_strerror(res));
    }

    bool has_order = false;

    /* 200 OK + 바디가 있으면 작업지시로 파싱, 204 No Content면 작업 없음(has_order=false 유지) */
    if (res == CURLE_OK && http_status == 200 && resp.data != NULL) {
        cJSON *json = cJSON_Parse(resp.data);
        if (json != NULL) {
            cJSON *id = cJSON_GetObjectItemCaseSensitive(json, "id");
            cJSON *product_code = cJSON_GetObjectItemCaseSensitive(json, "productCode");
            cJSON *target_qty = cJSON_GetObjectItemCaseSensitive(json, "targetQty");
            cJSON *current_qty = cJSON_GetObjectItemCaseSensitive(json, "currentQty");
            cJSON *status = cJSON_GetObjectItemCaseSensitive(json, "status");

            if (cJSON_IsNumber(id) && cJSON_IsString(product_code)) {
                out->id = (long)id->valuedouble;
                snprintf(out->product_code, sizeof(out->product_code), "%s", product_code->valuestring);
                out->target_qty = cJSON_IsNumber(target_qty) ? target_qty->valueint : 0;
                out->current_qty = cJSON_IsNumber(current_qty) ? current_qty->valueint : 0;
                snprintf(out->status, sizeof(out->status), "%s",
                         cJSON_IsString(status) ? status->valuestring : "");
                has_order = true;
            }
            cJSON_Delete(json);
        }
    }

    free(resp.data);
    curl_easy_cleanup(curl);
    return has_order;
}

const char *api_report_production(const char *base_url, const ProductionReport *report)
{
    CURL *curl = curl_easy_init();
    if (curl == NULL) {
        return "NETWORK_ERROR";
    }

    char url[512];
    snprintf(url, sizeof(url), "%sapi/mes/machine/report", base_url);

    cJSON *json = cJSON_CreateObject();
    cJSON_AddNumberToObject(json, "orderId", (double)report->order_id);
    cJSON_AddStringToObject(json, "machineId", report->machine_id);
    cJSON_AddStringToObject(json, "serialNo", report->serial_no);
    cJSON_AddNumberToObject(json, "processType", report->process_type);

    if (report->process_type == MSG_INSPECTION_QUALITY) {
        cJSON_AddNumberToObject(json, "voltageX100", report->voltage_x100);
        cJSON_AddNumberToObject(json, "capacityX1000", report->capacity_x1000);
        cJSON_AddNumberToObject(json, "resistanceMohm", report->resistance_mohm);
    } else {
        cJSON_AddNumberToObject(json, "value", report->value);
    }

    char *body = cJSON_PrintUnformatted(json);
    cJSON_Delete(json);

    ResponseBuffer resp = { NULL, 0 };
    long http_status = 0;

    struct curl_slist *headers = NULL;
    headers = curl_slist_append(headers, "Content-Type: application/json");

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_POST, 1L);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &resp);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);

    CURLcode res = curl_easy_perform(curl);
    const char *result = "NETWORK_ERROR";

    if (res == CURLE_OK) {
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_status);
        if (http_status >= 200 && http_status < 300) {
            result = "OK";
        } else if (resp.data != NULL && strstr(resp.data, "SHORTAGE") != NULL) {
            result = "SHORTAGE";
        } else {
            result = "SERVER_ERROR";
        }
    } else {
        fprintf(stderr, "[Error] 실적 보고 실패: %s\n", curl_easy_strerror(res));
    }

    free(body);
    free(resp.data);
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    return result;
}

const char *api_report_environment(const char *base_url, const ProductionReport *report)
{
    CURL *curl = curl_easy_init();
    if (curl == NULL) {
        return "NETWORK_ERROR";
    }

    char url[512];
    snprintf(url, sizeof(url), "%sapi/mes/machine/environment", base_url);

    cJSON *json = cJSON_CreateObject();
    cJSON_AddNumberToObject(json, "orderId", (double)report->order_id);
    cJSON_AddStringToObject(json, "machineId", report->machine_id);
    cJSON_AddStringToObject(json, "serialNo", report->serial_no);
    cJSON_AddNumberToObject(json, "processType", report->process_type);
    cJSON_AddNumberToObject(json, "value", report->value);

    char *body = cJSON_PrintUnformatted(json);
    cJSON_Delete(json);

    ResponseBuffer resp = { NULL, 0 };
    long http_status = 0;

    struct curl_slist *headers = NULL;
    headers = curl_slist_append(headers, "Content-Type: application/json");

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_POST, 1L);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &resp);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);

    CURLcode res = curl_easy_perform(curl);
    const char *result = "NETWORK_ERROR";

    if (res == CURLE_OK) {
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_status);
        result = (http_status >= 200 && http_status < 300) ? "OK" : "SERVER_ERROR";
    } else {
        fprintf(stderr, "[Error] 환경센서 보고 실패: %s\n", curl_easy_strerror(res));
    }

    free(body);
    free(resp.data);
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    return result;
}
