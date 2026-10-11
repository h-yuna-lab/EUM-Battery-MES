#include "net.h"
#include <stdio.h>
#include <string.h>

#ifndef _WIN32
    #include <errno.h>
#endif

int net_init(void)
{
#ifdef _WIN32
    WSADATA wsaData;
    int result = WSAStartup(MAKEWORD(2, 2), &wsaData);
    return (result == 0) ? 0 : -1;
#else
    return 0; /* POSIX는 별도 초기화가 필요 없음 */
#endif
}

void net_cleanup(void)
{
#ifdef _WIN32
    WSACleanup();
#endif
}

socket_t net_listen(int port, int backlog)
{
    socket_t sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock == SOCKET_INVALID) {
        return SOCKET_INVALID;
    }

    int opt = 1;
#ifdef _WIN32
    setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, (const char *)&opt, sizeof(opt));
#else
    setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
#endif

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons((unsigned short)port);

    if (bind(sock, (struct sockaddr *)&addr, sizeof(addr)) == SOCKET_ERROR_VAL) {
        net_close(sock);
        return SOCKET_INVALID;
    }

    if (listen(sock, backlog) == SOCKET_ERROR_VAL) {
        net_close(sock);
        return SOCKET_INVALID;
    }

    return sock;
}

socket_t net_accept(socket_t server_fd, char *client_ip_out, size_t ip_buf_size)
{
    struct sockaddr_in client_addr;
#ifdef _WIN32
    int addr_len = sizeof(client_addr);
#else
    socklen_t addr_len = sizeof(client_addr);
#endif

    socket_t client = accept(server_fd, (struct sockaddr *)&client_addr, &addr_len);
    if (client == SOCKET_INVALID) {
        return SOCKET_INVALID;
    }

    if (client_ip_out != NULL && ip_buf_size > 0) {
        const char *ip = inet_ntoa(client_addr.sin_addr);
        snprintf(client_ip_out, ip_buf_size, "%s", (ip != NULL) ? ip : "unknown");
    }

    return client;
}

socket_t net_connect(const char *ip, int port)
{
    socket_t sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock == SOCKET_INVALID) {
        return SOCKET_INVALID;
    }

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_port = htons((unsigned short)port);

    if (inet_pton(AF_INET, ip, &addr.sin_addr) <= 0) {
        net_close(sock);
        return SOCKET_INVALID;
    }

    if (connect(sock, (struct sockaddr *)&addr, sizeof(addr)) == SOCKET_ERROR_VAL) {
        net_close(sock);
        return SOCKET_INVALID;
    }

    return sock;
}

int net_send(socket_t sock, const void *data, int len)
{
    const char *p = (const char *)data;
    int total_sent = 0;

    while (total_sent < len) {
        int n = (int)send(sock, p + total_sent, (size_t)(len - total_sent), 0);
        if (n <= 0) {
            return -1;
        }
        total_sent += n;
    }
    return total_sent;
}

int net_recv_exact(socket_t sock, void *buf, int len)
{
    char *p = (char *)buf;
    int total_read = 0;

    while (total_read < len) {
        int n = (int)recv(sock, p + total_read, (size_t)(len - total_read), 0);
        if (n == 0) {
            return 0; /* 상대가 연결을 정상 종료 */
        }
        if (n < 0) {
            return -1; /* 오류 */
        }
        total_read += n;
    }
    return total_read;
}

void net_close(socket_t sock)
{
    if (sock == SOCKET_INVALID) {
        return;
    }
#ifdef _WIN32
    closesocket(sock);
#else
    close(sock);
#endif
}

const char *net_last_error(void)
{
#ifdef _WIN32
    static char buf[64];
    snprintf(buf, sizeof(buf), "WSA error %d", WSAGetLastError());
    return buf;
#else
    return strerror(errno);
#endif
}
