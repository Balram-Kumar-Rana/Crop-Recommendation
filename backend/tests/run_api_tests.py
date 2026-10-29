import sys
import traceback
from pathlib import Path

# Ensure project root is in sys.path for imports
project_root = Path(__file__).resolve().parents[2]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.app.main import app
from fastapi.testclient import TestClient
import pandas as pd
import json

client = TestClient(app)

def get_valid_payload():
    test_path = project_root / "ml-service" / "data" / "processed" / "test.csv"
    df = pd.read_csv(test_path)
    row = df.iloc[0]
    payload = {col: float(row[col]) for col in row.index if col != "label"}
    return payload, row["label"]

def run_test_predict_success():
    payload, expected_label_idx = get_valid_payload()
    resp = client.post("/api/v1/crop-recommendation/predict", json=payload)
    assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text}"
    data = resp.json()
    meta_path = project_root / "ml-service" / "models" / "model_metadata.json"
    meta = json.loads(meta_path.read_text())
    label_mapping = meta["label_encoder"]
    expected_label = label_mapping.get(str(int(expected_label_idx)))
    assert data["label"] == expected_label, f"Expected {expected_label}, got {data.get('label')}"
    print("test_predict_success passed")

def run_test_predict_missing_field():
    payload, _ = get_valid_payload()
    payload.pop("N")
    resp = client.post("/api/v1/crop-recommendation/predict", json=payload)
    assert resp.status_code == 422, f"Expected 422, got {resp.status_code}"
    print("test_predict_missing_field passed")

def run_test_predict_invalid_value():
    payload, _ = get_valid_payload()
    payload["N"] = -5  # violates ge=0
    resp = client.post("/api/v1/crop-recommendation/predict", json=payload)
    assert resp.status_code == 422, f"Expected 422, got {resp.status_code}"
    print("test_predict_invalid_value passed")

if __name__ == "__main__":
    try:
        run_test_predict_success()
        run_test_predict_missing_field()
        run_test_predict_invalid_value()
        print("All API tests passed")
    except AssertionError as e:
        print("Test failed:", e)
        sys.exit(1)
    except Exception as e:
        print("Error during tests:", e)
        traceback.print_exc()
        sys.exit(1)
