# 5번 검증용 가짜 L1 설비 - 온도/단일값/QualityData를 의도적으로 섞어서 순서대로 보내
# collector_receive_loop()의 가변 길이 프레이밍(7바이트 vs 16바이트)이 실제로 고쳐졌는지 확인
import socket
import struct
import time

PORT = 5006  # L2의 collectors[0]이 접속하는 포트(ELECTRODE_PORT)와 동일하게 맞춤

STX = 0x02
ETX = 0x03


def build_single(msg_type, value):
    return bytes([STX, msg_type]) + struct.pack("<i", value) + bytes([ETX])


def build_quality(voltage_x100, capacity_x1000, resistance_mohm):
    return (
        bytes([STX, 0x35])
        + struct.pack("<iii", voltage_x100, capacity_x1000, resistance_mohm)
        + bytes([0, ETX])  # reserved(1) + ETX(1)
    )


def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("127.0.0.1", PORT))
    server.listen(1)
    print(f"가짜 L1 설비 대기 중... :{PORT}")

    conn, addr = server.accept()
    print(f"L2 접속됨: {addr}")

    # 온도(7B) -> 단일값(7B) -> QualityData(16B, 프레이밍 버그 재현 포인트) 순서를 반복해서 섞어 보냄
    sequence = [
        ("온도", build_single(0x10, 42)),
        ("두께(0x31)", build_single(0x31, 150)),
        ("검사(0x35)", build_quality(370, 2500, 25)),
        ("온도", build_single(0x10, 55)),
        ("정렬오차(0x32)", build_single(0x32, -2)),
        ("검사(0x35)", build_quality(410, 4900, 28)),
    ]

    for label, packet in sequence:
        conn.sendall(packet)
        print(f"[전송] {label} ({len(packet)}바이트)")
        time.sleep(1)

    print("전송 완료, 5초 대기 후 종료")
    time.sleep(5)
    conn.close()
    server.close()


if __name__ == "__main__":
    main()
