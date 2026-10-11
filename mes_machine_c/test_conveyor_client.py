# 가짜 L2 클라이언트 - 컨베이어 체인의 모든 포트에 동시 접속해서 하나의 타임라인으로 검증
# PORTS 리스트 순서 = 업스트림->다운스트림 순서 (체인 페이스 단조성 체크에 사용)
import socket
import select
import struct
import time

PORTS = [5006, 5007, 5008, 5009, 5010, 5011]  # Phase 2: 전극->조립->활성화->팩->검사->포장 전체 체인

STATIONS = {
    5006: "전극",
    5007: "조립",
    5008: "활성화",
    5009: "팩",
    5010: "검사",
    5011: "포장",
}

TYPE_LENGTHS = {
    0x10: 7,   # 온도
    0x31: 7,   # 전극 - 두께
    0x32: 7,   # 조립 - 정렬오차
    0x33: 7,   # 활성화 - 초기충전전류(mA)
    0x34: 7,   # 팩 - 체결토크
    0x35: 16,  # 검사(QualityData)
    0x36: 7,   # 포장 - 중량
}

PRODUCTION_TYPES = {0x31, 0x32, 0x33, 0x34, 0x36}  # 0x35는 별도 처리(3필드)

PHASE1_SECONDS = 30  # 정상 동작 관찰. 6단계 체인이라 포장까지 전파되는 데 최대 몇 초 걸릴 수 있어 넉넉히 잡음
SHUTDOWN_TIMEOUT = 20  # 전극 연결 종료 후 나머지가 다 끊기는지 기다리는 최대 시간

WORK_ORDER_TARGET = 100  # 전극에 보낼 작업지시 목표수량 (관찰 시간 동안 절대 안 떨어지게 넉넉히)


def build_work_order_packet(target_qty):
    """0x20(작업지시) 7바이트 패킷을 직접 빌드한다 (STX+type+value LE4+ETX)."""
    return bytes([0x02, 0x20]) + struct.pack("<i", target_qty) + bytes([0x03])


class Connection:
    def __init__(self, port):
        self.port = port
        self.name = STATIONS[port]
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect(("127.0.0.1", port))
        self.sock.setblocking(False)
        self.buffer = b""
        self.closed = False
        self.temp_events = []       # 온도 수신 타임스탬프
        self.production_events = []  # 생산 이벤트 타임스탬프
        print(f"[{self.name}:{port}] connected")

    def close(self):
        if not self.closed:
            self.sock.close()
            self.closed = True

    def read_available(self):
        try:
            chunk = self.sock.recv(4096)
        except BlockingIOError:
            return
        if not chunk:
            if not self.closed:
                print(f"[{now()}] [{self.name}:{self.port}] connection closed by peer")
            self.closed = True
            return
        self.buffer += chunk
        self._parse_all()

    def _parse_all(self):
        while True:
            if len(self.buffer) < 2:
                return
            stx, msg_type = self.buffer[0], self.buffer[1]
            if stx != 0x02:
                print(f"[{self.name}:{self.port}] STX 불일치: {stx:#x}")
                self.buffer = b""
                return
            total_len = TYPE_LENGTHS.get(msg_type)
            if total_len is None:
                print(f"[{self.name}:{self.port}] 알 수 없는 타입: {msg_type:#x}")
                self.buffer = b""
                return
            if len(self.buffer) < total_len:
                return
            packet = self.buffer[:total_len]
            self.buffer = self.buffer[total_len:]
            self._handle_packet(msg_type, packet)

    def _handle_packet(self, msg_type, packet):
        t = time.time()
        ts = now()
        if msg_type == 0x10:
            (val,) = struct.unpack("<i", packet[2:6])
            self.temp_events.append(t)
            print(f"[{ts}] [{self.name}:{self.port}] 온도 val={val}")
        elif msg_type in PRODUCTION_TYPES:
            (val,) = struct.unpack("<i", packet[2:6])
            self.production_events.append(t)
            print(f"[{ts}] [{self.name}:{self.port}] 측정값={val}  <-- 생산 이벤트")
        elif msg_type == 0x35:
            v, c, r = struct.unpack("<iii", packet[2:14])
            self.production_events.append(t)
            print(f"[{ts}] [{self.name}:{self.port}] 검사 전압={v/100:.2f}V "
                  f"용량={c/1000:.3f}Ah 저항={r}mOhm  <-- 생산 이벤트")


def now():
    return time.strftime("%H:%M:%S")


def pump(conns, seconds):
    end = time.time() + seconds
    while time.time() < end:
        live_socks = [c.sock for c in conns if not c.closed]
        if not live_socks:
            break
        readable, _, _ = select.select(live_socks, [], [], 1.0)
        for s in readable:
            conn = next(c for c in conns if c.sock is s)
            conn.read_available()


def check_pace(conns):
    """체인 순서대로 생산 이벤트 수가 단조 비증가인지 (다운스트림이 업스트림을 앞서지 않는지)."""
    counts = [(c.name, len(c.production_events)) for c in conns]
    ok = all(counts[i][1] <= counts[i - 1][1] for i in range(1, len(counts)))
    summary = ", ".join(f"{n}={c}" for n, c in counts)
    print(f"\n[검증 1: 페이스 단조성] {summary} -> {'PASS' if ok else 'FAIL'}")
    return ok


def check_temp_continuity(conns, threshold=2.0):
    """모든 설비의 온도 간격이 threshold 미만인지. 설비별 상세 gap 리스트도 출력."""
    all_ok = True
    for c in conns:
        times = c.temp_events
        if len(times) < 2:
            print(f"[검증 2] {c.name}: 온도 이벤트 부족, 판단 불가")
            all_ok = False
            continue
        gaps = [round(b - a, 2) for a, b in zip(times, times[1:])]
        max_gap = max(gaps)
        ok = max_gap < threshold
        all_ok = all_ok and ok
        print(f"[검증 2] {c.name} 온도 간격 목록(초): {gaps}")
        print(f"         최대 간격={max_gap:.2f}초 -> {'PASS' if ok else 'FAIL (지연 감지)'}")
    return all_ok


def check_cascading_shutdown(conns):
    """conns[0]을 강제 종료한 뒤 나머지가 순서대로 다 끊기는지."""
    print(f"\n--- Phase 2: {conns[0].name}({conns[0].port}) 연결 강제 종료 ---")
    conns[0].close()

    print(f"--- Phase 3: 나머지 {len(conns) - 1}개가 뒤따라 끊기는지 최대 {SHUTDOWN_TIMEOUT}초 대기 ---")
    pump(conns[1:], SHUTDOWN_TIMEOUT)

    all_closed = all(c.closed for c in conns[1:])
    for c in conns[1:]:
        status = "닫힘" if c.closed else "여전히 열림"
        print(f"  {c.name}({c.port}): {status}")

    print(f"\n[검증 3: 연쇄 종료] -> {'PASS' if all_closed else 'FAIL (일부 안 끊김)'}")

    for c in conns:
        c.close()

    return all_closed


def main():
    conns = [Connection(p) for p in PORTS]

    # 전극(PORTS[0])은 main.c에서 작업지시 게이팅이 있어서, 안 보내면 영원히 target_qty=0으로 생산 안 함
    electrode = conns[0]
    electrode.sock.sendall(build_work_order_packet(WORK_ORDER_TARGET))
    print(f"[{now()}] [{electrode.name}:{electrode.port}] 작업지시 송신: target={WORK_ORDER_TARGET}")

    print(f"\n--- Phase 1: {PHASE1_SECONDS}초 동안 정상 동작 관찰 ---")
    pump(conns, PHASE1_SECONDS)

    ok1 = check_pace(conns)
    ok2 = check_temp_continuity(conns)
    ok3 = check_cascading_shutdown(conns)

    print("\n=== 최종 결과 ===")
    print(f"1) 페이스 단조성: {'PASS' if ok1 else 'FAIL'}")
    print(f"2) 온도 끊김 없음(전체): {'PASS' if ok2 else 'FAIL'}")
    print(f"3) 연쇄 종료: {'PASS' if ok3 else 'FAIL'}")


if __name__ == "__main__":
    main()
