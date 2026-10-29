import os
import json
from pathlib import Path
import pandas as pd
from fastapi.testclient import TestClient

# Import the FastAPI app
from backend.app.main import app

client = TestClient(app)

# Helper to load a valid payload from the first test row
def get_valid_payload():
    test_path = Path(__file__).resolve().parents[3] / "ml-service" / "data" / "processed" / "test.csv"
    df = pd.read_csv(test_path)
    row = df.iloc[0]
    # Ensure column order matches model feature order
    payload = {col: float(row[col]) for col in row.index if col != "label"}
    return payload, row["label"]


def test_predict_success():
    payload, expected_label_idx = get_valid_payload()
    response = client.post("/api/v1/crop-recommendation/predict", json=payload)
    assert response.status_code == 200, f"Unexpected status: {response.status_code} {response.text}"
    data = response.json()
    # Load label mapping from metadata to compare human‑readable name
    meta_path = Path(__file__).resolve().parents[3] / "ml-service" / "models" / "model_metadata.json"
    meta = json.loads(meta_path.read_text())
    label_mapping = meta["label_encoder"]
    expected_label = label_mapping.get(str(int(expected_label_idx)))
    assert data["label"] == expected_label


def test_predict_missing_field():
    payload, _ = get_valid_payload()
    # Remove one required field
    payload.pop("N")
    response = client.post("/api/v1/crop-recommendation/predict", json=payload)
    assert response.status_code == 422


def test_predict_invalid_value():
    payload, _ = get_valid_payload()
    payload["N"] = -5  # violates ge=0 constraint
    response = client.post("/api/v1/crop-recommendation/predict", json=payload)
    assert response.status_code == 422
