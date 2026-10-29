import importlib.util
import sys
import traceback
from pathlib import Path
import tempfile

# Ensure the ml-service root is in sys.path so that ``src`` can be imported
ml_service_root = Path(__file__).resolve().parents[1]
sys.path.append(str(ml_service_root))

TEST_FILE = Path(__file__).parent / "test_preprocess.py"

spec = importlib.util.spec_from_file_location("test_preprocess", TEST_FILE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

passed = 0
failed = 0
for name in dir(module):
    if name.startswith("test_"):
        func = getattr(module, name)
        try:
            # Provide a temporary directory for fixtures expecting ``tmp_path``
            if "tmp_path" in func.__code__.co_varnames:
                with tempfile.TemporaryDirectory() as td:
                    tmp_path = Path(td)
                    func(tmp_path=tmp_path)
            else:
                func()
            print(f"PASS {name}")
            passed += 1
        except AssertionError as ae:
            print(f"FAIL {name}: {ae}")
            failed += 1
        except Exception:
            print(f"ERROR {name}:\n{traceback.format_exc()}")
            failed += 1
print(f"\nSummary: {passed} passed, {failed} failed")
sys.exit(0 if failed == 0 else 1)
