# 가짜 L2 클라이언트 - main_single_test.c(포트 5010)에 접속해서 받은 패킷을 로그로 출력
import socket
import struct

HOST = "127.0.0.1"
PORT = 5010

STX = 0x02
ETX = 0x03

# 타입 -> 전체 패킷 길이 매핑 (실제 L2도 이 방식으로 타입 보고 길이를 판단할 예정)
TYPE_LENGTHS = {
    0x10: 7,   # 온도
    0x35: 16,  # 검사(QualityData)
}

QUALITY_TARGET_COUNT = 3  # QualityData를 이만큼 관측하면 종료


def recv_exact(sock, n):
    buf = b""
    while len(buf) < n:
        chunk = sock.recv(n - len(buf))
        if not chunk:
            return None
        buf += chunk
    return buf


def main():
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((HOST, PORT))
    print("connected")

    quality_seen = 0

    while quality_seen < QUALITY_TARGET_COUNT:
        header = recv_exact(sock, 2)  # STX + type
        if header is None:
            print("connection closed")
            break

        stx, msg_type = header[0], header[1]
        if stx != STX:
            print(f"STX 불일치: {stx:#x}")
            break

        total_len = TYPE_LENGTHS.get(msg_type)
        if total_len is None:
            print(f"알 수 없는 타입: {msg_type:#x}")
            break

        rest = recv_exact(sock, total_len - 2)
        if rest is None:
            print("connection closed mid-packet")
            break

        packet = header + rest
        if packet[-1] != ETX:
            print(f"ETX 불일치: {packet[-1]:#x}")

        if msg_type == 0x10:
            (val,) = struct.unpack("<i", packet[2:6])
            print(f"type=0x10 val={val}  (온도)")
        elif msg_type == 0x35:
            voltage, capacity, resistance = struct.unpack("<iii", packet[2:14])
            print(
                f"type=0x35 전압={voltage / 100:.2f}V "
                f"용량={capacity / 1000:.3f}Ah "
                f"내부저항={resistance}mΩ  (검사)"
            )
            quality_seen += 1

    print(f"\nQualityData {quality_seen}개 관측, 종료")
    sock.close()


if __name__ == "__main__":
    main()
