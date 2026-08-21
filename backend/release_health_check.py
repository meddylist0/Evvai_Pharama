import os
import sys
import io
import unittest
from pathlib import Path

# Force UTF-8 output — prevents UnicodeEncodeError on Windows CP1252 terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# Ensure the backend directory is on the Python path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Force isolated test database for safety
TEST_DB_PATH = BASE_DIR / "pharmalink_test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH}"

# Import and run any necessary DB initialization
try:
    from app.core.database import sync_db_schema, engine, Base
    from app.seeds.seed_data import seed_database
    Base.metadata.drop_all(bind=engine)
    sync_db_schema()
    seed_database()
except Exception as e:
    print("[ERROR] Failed to initialize test database:", e)
    sys.exit(1)


# ─────────────────────────────────────────────────────────────────────────────
# RELEASE GATE AREAS — maps test-class names to gate label
# ─────────────────────────────────────────────────────────────────────────────
GATE_LABELS = {
    "TestSecurityAuth":             "AUTHENTICATION / JWT / RBAC / IDOR",
    "TestPaymentTransactionRequired": "PAYMENT TRANSACTION INTEGRITY",
    "TestPaymentOwnership":         "PAYMENT OWNERSHIP (IDOR)",
    "TestPaymentSignature":         "RAZORPAY SIGNATURE SECURITY",
    "TestDuplicatePayment":         "DUPLICATE PAYMENT PREVENTION",
    "TestRefundSafety":             "REFUND SAFETY",
    "TestInventoryLifecycle":       "STOCK RESERVATION / RELEASE",
    "TestOrderStateMachine":        "ORDER STATE MACHINE",
    "TestKYCEnforcement":           "KYC / PRICING ENFORCEMENT",
}


class _ResultCollector(unittest.TestResult):
    """Collects per-class results for structured gate reporting."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.class_results: dict[str, dict] = {}  # class_name -> {pass, fail, error, skip}

    def _bucket(self, test):
        cls = test.__class__.__name__
        if cls not in self.class_results:
            self.class_results[cls] = {"pass": 0, "fail": 0, "error": 0, "skip": 0}
        return self.class_results[cls]

    def addSuccess(self, test):
        super().addSuccess(test)
        self._bucket(test)["pass"] += 1

    def addFailure(self, test, err):
        super().addFailure(test, err)
        self._bucket(test)["fail"] += 1

    def addError(self, test, err):
        super().addError(test, err)
        self._bucket(test)["error"] += 1

    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        self._bucket(test)["skip"] += 1


def discover_and_run_tests():
    loader = unittest.TestLoader()
    test_dirs = [BASE_DIR / "tests", BASE_DIR / "release_tests"]
    suites = []
    for td in test_dirs:
        if td.is_dir():
            suite = loader.discover(start_dir=str(td), pattern="test_*.py")
            suites.append(suite)
        else:
            print(f"[WARNING] Test directory missing: {td}")

    combined = unittest.TestSuite(suites)

    # Verbose runner writes individual test results to stderr
    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stderr)
    result = runner.run(combined)
    return result


def print_gate_report(result):
    """Print a structured PHARMALINK ENTERPRISE RELEASE GATE table."""
    collector = result  # _ResultCollector carries class_results

    SEP = "=" * 62
    print()
    print(SEP)
    print("  PHARMALINK ENTERPRISE RELEASE GATE")
    print(SEP)
    print()

    gate_num = 1
    any_blocked = False

    # Per-area summary
    class_results = getattr(result, "class_results", {})
    covered = set()

    for cls_name, label in GATE_LABELS.items():
        data = class_results.get(cls_name, {})
        fails = data.get("fail", 0) + data.get("error", 0)
        passes = data.get("pass", 0)
        skips = data.get("skip", 0)
        covered.add(cls_name)

        if fails > 0:
            status = "FAIL ✗"
            any_blocked = True
        elif passes == 0 and skips > 0:
            status = "SKIP -"
        elif passes > 0:
            status = "PASS ✓"
        else:
            status = "MISSING"

        print(f"  [{gate_num:>2}] {label:<40} {status}")
        gate_num += 1

    # Any extra classes not in the map
    for cls_name, data in class_results.items():
        if cls_name not in covered:
            fails = data.get("fail", 0) + data.get("error", 0)
            passes = data.get("pass", 0)
            status = "FAIL ✗" if fails > 0 else ("PASS ✓" if passes > 0 else "SKIP -")
            if fails > 0:
                any_blocked = True
            print(f"  [{gate_num:>2}] {cls_name:<40} {status}")
            gate_num += 1

    print()
    print(SEP)

    if not any_blocked and result.wasSuccessful():
        print("  RELEASE DECISION: SAFE TO RELEASE")
    else:
        print("  RELEASE DECISION: BLOCKED - FIX FAILURES BEFORE RELEASE")

    print(SEP)
    print()

    # Detailed failure/error dump
    if result.failures:
        print("FAILURES:")
        for test, tb in result.failures:
            print(f"  - {test}")
            for line in tb.strip().splitlines()[-3:]:
                print(f"      {line}")
        print()

    if result.errors:
        print("ERRORS:")
        for test, tb in result.errors:
            print(f"  - {test}")
            for line in tb.strip().splitlines()[-3:]:
                print(f"      {line}")
        print()


def main():
    loader = unittest.TestLoader()
    test_dirs = [BASE_DIR / "tests", BASE_DIR / "release_tests"]
    suites = []
    for td in test_dirs:
        if td.is_dir():
            suite = loader.discover(start_dir=str(td), pattern="test_*.py", top_level_dir=str(td))
            suites.append(suite)
        else:
            print(f"[WARNING] Test directory missing: {td}", file=sys.stderr)

    combined = unittest.TestSuite(suites)

    # Use our collector to get per-class breakdown
    result = _ResultCollector()
    combined.run(result)

    print_gate_report(result)

    if result.wasSuccessful():
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
