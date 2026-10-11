#ifndef NET_H
#define NET_H

#include <stddef.h>

#ifdef _WIN32
    #include <winsock2.h>
    #include <ws2tcpip.h>
    typedef SOCKET socket_t;
    #define SOCKET_INVALID INVALID_SOCKET
    #define SOCKET_ERROR_VAL SOCKET_ERROR
#else
    #include <sys/socket.h>
    #include <netinet/in.h>
    #include <arpa/inet.h>
    #include <unistd.h>
    typedef int socket_t;
    #define SOCKET_INVALID (-1)
    #define SOCKET_ERROR_VAL (-1)
#endif

/*
 * 크로스플랫폼 TCP 소켓 wrapper
 * - Mac/Linux(POSIX 소켓)과 Windows(Winsock)의 차이를 이 파일 안에서만 흡수한다.
 * - 이 헤더를 사용하는 쪽(main.c 등)은 _WIN32를 전혀 신경 쓸 필요가 없다.
 */

/* 네트워크 서브시스템 초기화. Windows에서는 WSAStartup, POSIX에서는 아무 것도 안 함 */
int net_init(void);

/* 네트워크 서브시스템 정리. Windows에서는 WSACleanup */
void net_cleanup(void);

/* 서버 측: 지정한 포트에서 listen 소켓을 만든다. 실패 시 SOCKET_INVALID */
socket_t net_listen(int port, int backlog);

/* 서버 측: 클라이언트 접속을 accept 한다. client_ip_out에 접속자 IP 문자열을 채워준다(선택) */
socket_t net_accept(socket_t server_fd, char *client_ip_out, size_t ip_buf_size);

/* 클라이언트 측: 지정한 ip:port로 접속한다. 실패 시 SOCKET_INVALID */
socket_t net_connect(const char *ip, int port);

/* len 바이트를 전부 보낼 때까지 반복 전송. 실패 시 -1 */
int net_send(socket_t sock, const void *data, int len);

/* len 바이트를 정확히 다 받을 때까지 반복 수신.
 * 반환값: len(성공), 0(상대가 연결을 정상 종료), -1(오류) */
int net_recv_exact(socket_t sock, void *buf, int len);

/* 소켓 닫기 */
void net_close(socket_t sock);

/* 가장 최근 소켓 오류 메시지 (디버그 출력용) */
const char *net_last_error(void);

#endif /* NET_H */
