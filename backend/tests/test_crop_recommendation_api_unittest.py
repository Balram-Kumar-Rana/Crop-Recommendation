import unittest
from pathlib import Path

import pandas as pd
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parents[2]

import sys
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.main import app

client = TestClient(app)

DATASET_PATH = (
    PROJECT_ROOT
    / "datasets"
    / "crop-recommendation"
    / "Crop_recommendation.csv"
)

FEATURES = [
    "N", "P", "K", "temperature",
    "humidity", "ph", "rainfall",
]


def load_valid_payload():
    df = pd.read_csv(DATASET_PATH)
    missing = set(FEATURES) - set(df.columns)
    if missing:
        raise AssertionError(f"Dataset missing columns: {missing}")

    row = df[FEATURES].dropna().iloc[0]
    return {feature: float(row[feature]) for feature in FEATURES}


class TestCropRecommendationAPI(unittest.TestCase):
    def test_success(self):
        payload = load_valid_payload()
        response = client.post(
            "/api/v1/crop-recommendation/predict",
            json=payload,
        )

        self.assertEqual(
            response.status_code,
            200,
            msg=response.text,
        )

        data = response.json()
        self.assertIsInstance(data.get("label"), str)
        self.assertTrue(data["label"].strip())

        if data.get("confidence") is not None:
            self.assertGreaterEqual(data["confidence"], 0)
            self.assertLessEqual(data["confidence"], 1)

    def test_missing_field(self):
        payload = load_valid_payload()
        payload.pop("N")

        response = client.post(
            "/api/v1/crop-recommendation/predict",
            json=payload,
        )
        self.assertEqual(response.status_code, 422)

    def test_invalid_value(self):
        payload = load_valid_payload()
        payload["N"] = -5

        response = client.post(
            "/api/v1/crop-recommendation/predict",
            json=payload,
        )
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
