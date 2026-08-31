import uvicorn
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio

# On Windows Python 3.14, use SelectorEventLoop to prevent reloader loop crash
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

if __name__ == "__main__":
    print("Starting PharmaLink Enterprise FastAPI Server on http://0.0.0.0:8000 ...")
    print("Local:   http://127.0.0.1:8000")
    print("Network: http://192.168.0.154:8000")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
