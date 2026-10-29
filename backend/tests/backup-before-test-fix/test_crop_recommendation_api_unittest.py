import unittest
import json
from pathlib import Path
import pandas as pd
from fastapi.testclient import TestClient

# Ensure project root is in sys.path
import sys
project_root = Path(__file__).resolve().parents[2]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from backend.app.main import app

client = TestClient(app)

def load_valid_payload():
    # Compute the project root (directory containing "recommendation")
    project_root = Path(__file__).resolve().parents[2]
    test_path = project_root / "ml-service" / "data" / "processed" / "test.csv"
    df = pd.read_csv(test_path)
    row = df.iloc[0]
    payload = {col: float(row[col]) for col in row.index if col != "label"}
    return payload, row["label"]

class TestCropRecommendationAPI(unittest.TestCase):
    def test_success(self):
        payload, expected_label_idx = load_valid_payload()
        response = client.post("/api/v1/crop-recommendation/predict", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        meta_path = project_root / "ml-service" / "models" / "model_metadata.json"
        meta = json.loads(meta_path.read_text())
        label_mapping = meta["label_encoder"]
        expected_label = label_mapping.get(str(int(expected_label_idx)))
        self.assertEqual(data["label"], expected_label)

    def test_missing_field(self):
        payload, _ = load_valid_payload()
        payload.pop("N")
        response = client.post("/api/v1/crop-recommendation/predict", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_invalid_value(self):
        payload, _ = load_valid_payload()
        payload["N"] = -5  # violates ge=0
        response = client.post("/api/v1/crop-recommendation/predict", json=payload)
        self.assertEqual(response.status_code, 422)

if __name__ == "__main__":
    unittest.main()
