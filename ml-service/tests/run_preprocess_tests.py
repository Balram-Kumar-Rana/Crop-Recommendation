# -*- coding: utf-8 -*-
"""Simple test runner for the ML preprocessing pipeline.

Since the sandbox cannot install ``pytest`` (network restrictions), we invoke the
test functions directly using the standard library. Each test will raise an
``AssertionError`` on failure; we capture and report the outcome.
"""

import importlib
import traceback
import sys

MODULE_NAME = "ml_service.tests.test_preprocess"

def main():
    try:
        module = importlib.import_module(MODULE_NAME)
    except Exception as e:
        print(f"Failed to import test module {MODULE_NAME}: {e}")
        sys.exit(1)

    test_funcs = [getattr(module, name) for name in dir(module) if name.startswith("test_")]
    passed = 0
    failed = 0
    for func in test_funcs:
        try:
            # Some tests expect a pytest fixture ``tmp_path``; we provide a temporary directory.
            if "tmp_path" in func.__code__.co_varnames:
                import tempfile
                with tempfile.TemporaryDirectory() as td:
                    tmp_path = type("Path", (), {"__truediv__": lambda self, name: Path(td) / name})( )
                    func(tmp_path=Path(td))
            else:
                func()
            print(f"PASS {func.__name__}")
            passed += 1
        except AssertionError as ae:
            print(f"FAIL {func.__name__}: {ae}")
            failed += 1
        except Exception:
            print(f"ERROR {func.__name__}:\n{traceback.format_exc()}")
            failed += 1
    print(f"\nSummary: {passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    from pathlib import Path
    main()
