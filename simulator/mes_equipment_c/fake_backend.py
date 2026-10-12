# 가짜 백엔드 - L2의 api_poll_work_order/api_report_production이 실제로 보내는 요청/JSON을 로그로 확인
from http.server import BaseHTTPRequestHandler, HTTPServer
import json


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api/mes/machine/poll"):
            body = json.dumps({
                "id": 1,
                "productCode": "TEST-PRODUCT",
                "targetQty": 5,
                "currentQty": 0,
                "status": "IN_PROGRESS",
            }).encode("utf-8")
            print(f"[poll] GET {self.path} -> 200 (작업지시 target=5 응답)")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        print(f"\n[report] POST {self.path}")
        try:
            parsed = json.loads(body)
            print(json.dumps(parsed, indent=2, ensure_ascii=False))
        except Exception:
            print(body)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"OK"}')

    def log_message(self, format, *args):
        pass  # 기본 액세스 로그는 끔 (위에서 직접 필요한 것만 찍음)


if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 8111), Handler)
    print("가짜 백엔드 실행 중... :8111")
    server.serve_forever()
