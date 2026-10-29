from pathlib import Path
import json

import joblib
import pandas as pd
from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.fertilizer_recommendation import (
    FertilizerRecommendationRequest,
    FertilizerRecommendationResponse,
)

router = APIRouter(
    prefix="/api/v1/fertilizer-recommendation",
    tags=["Fertilizer Recommendation"],
)

PROJECT_ROOT = Path(__file__).resolve().parents[5]
MODEL_PATH = PROJECT_ROOT / "ml-service" / "models" / "fertilizer_recommendation_model.joblib"
METADATA_PATH = PROJECT_ROOT / "ml-service" / "models" / "fertilizer_model_metadata.json"

PROTOTYPE_WARNING = (
    "Prototype only: this model was trained on synthetic data and has not been "
    "validated for real farming decisions. Confirm fertilizer choice and dosage "
    "with a qualified agricultural expert or soil test."
)


@router.post(
    "/predict",
    response_model=FertilizerRecommendationResponse,
    status_code=status.HTTP_200_OK,
)
async def predict_fertilizer(req: FertilizerRecommendationRequest):
    if not MODEL_PATH.is_file():
        raise HTTPException(
            status_code=503,
            detail="Fertilizer model not found. Train the model first.",
        )

    try:
        model = joblib.load(MODEL_PATH)
        metadata = {}
        if METADATA_PATH.is_file():
            with METADATA_PATH.open("r", encoding="utf-8-sig") as file:
                metadata = json.load(file)

        payload = req.model_dump()
        feature_order = metadata.get("feature_columns", list(payload.keys()))

        missing = [name for name in feature_order if name not in payload]
        if missing:
            raise HTTPException(
                status_code=500,
                detail=f"Model feature configuration is incomplete: {missing}",
            )

        # Keep exactly the feature names and order used during training.
        input_frame = pd.DataFrame(
            [{name: payload[name] for name in feature_order}]
        )
        prediction = model.predict(input_frame)[0]

        confidence = None
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(input_frame)[0]
            confidence = round(float(max(probabilities)), 4)

        return FertilizerRecommendationResponse(
            recommended_fertilizer=str(prediction),
            prototype_warning=PROTOTYPE_WARNING,
            model_confidence=confidence,
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Fertilizer prediction failed: {exc}",
        ) from exc

