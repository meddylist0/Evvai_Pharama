import uvicorn
import os
import sys
import socket

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio

# On Windows Python 3.14, use SelectorEventLoop to prevent reloader loop crash
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

if __name__ == "__main__":
    local_ip = get_local_ip()
    print("Starting PharmaLink Enterprise FastAPI Server on http://0.0.0.0:8000 ...")
    print("Local:   http://127.0.0.1:8000")
    print(f"Network: http://{local_ip}:8000")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

