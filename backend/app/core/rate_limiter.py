import time
from threading import Lock
from typing import Dict, List
from fastapi import HTTPException, status

class LoginRateLimiter:
    """
    In-memory thread-safe rate limiter for login brute-force prevention.
    
    Limitations:
    - Resets on application restart.
    - State is held in-memory per worker process (not shared across multiple Uvicorn workers).
    - For multi-worker production environments, Redis-backed rate limiting (e.g. redis-py + slowapi) should be configured.
    """
    def __init__(self, max_attempts: int = 5, window_seconds: int = 60):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._attempts: Dict[str, List[float]] = {}
        self._lock = Lock()

    def _get_key(self, ip: str, email: str) -> str:
        clean_email = email.strip().lower() if email else "unknown"
        clean_ip = ip.strip() if ip else "127.0.0.1"
        return f"{clean_ip}:{clean_email}"

    def check_rate_limit(self, ip: str, email: str) -> None:
        key = self._get_key(ip, email)
        now = time.time()

        with self._lock:
            if key in self._attempts:
                # Remove timestamps older than window
                valid_timestamps = [t for t in self._attempts[key] if now - t < self.window_seconds]
                self._attempts[key] = valid_timestamps

                if len(valid_timestamps) >= self.max_attempts:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Too many failed login attempts. Please try again after {self.window_seconds} seconds.",
                        headers={"Retry-After": str(self.window_seconds)}
                    )

    def record_failure(self, ip: str, email: str) -> None:
        key = self._get_key(ip, email)
        now = time.time()
        with self._lock:
            if key not in self._attempts:
                self._attempts[key] = []
            self._attempts[key].append(now)

    def record_success(self, ip: str, email: str) -> None:
        key = self._get_key(ip, email)
        with self._lock:
            if key in self._attempts:
                del self._attempts[key]


login_rate_limiter = LoginRateLimiter(max_attempts=5, window_seconds=60)
