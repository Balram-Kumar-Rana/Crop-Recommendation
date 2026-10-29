import json
from pathlib import Path

import pandas as pd
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_PATH = (
    PROJECT_ROOT
    / "datasets"
    / "crop-recommendation"
    / "Crop_recommendation.csv"
)
METADATA_PATH = (
    PROJECT_ROOT
    / "ml-service"
    / "models"
    / "model_metadata.json"
)

FEATURES = [
    "N", "P", "K", "temperature",
    "humidity", "ph", "rainfall",
]


def get_valid_payload():
    df = pd.read_csv(DATASET_PATH)
    missing = set(FEATURES) - set(df.columns)
    assert not missing, f"Dataset missing columns: {missing}"

    row = df[FEATURES].dropna().iloc[0]
    return {feature: float(row[feature]) for feature in FEATURES}


def test_predict_success():
    payload = get_valid_payload()
    response = client.post(
        "/api/v1/crop-recommendation/predict",
        json=payload,
    )

    assert response.status_code == 200, (
        f"Unexpected status: {response.status_code} {response.text}"
    )

    data = response.json()
    assert isinstance(data.get("label"), str)
    assert data["label"].strip() != ""

    if data.get("confidence") is not None:
        assert 0 <= data["confidence"] <= 1


def test_predict_missing_field():
    payload = get_valid_payload()
    payload.pop("N")

    response = client.post(
        "/api/v1/crop-recommendation/predict",
        json=payload,
    )
    assert response.status_code == 422


def test_predict_invalid_value():
    payload = get_valid_payload()
    payload["N"] = -5

    response = client.post(
        "/api/v1/crop-recommendation/predict",
        json=payload,
    )
    assert response.status_code == 422
