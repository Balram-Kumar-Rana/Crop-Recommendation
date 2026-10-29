from fastapi import APIRouter, HTTPException, Depends
from fastapi import status
from backend.app.schemas.crop_recommendation import CropRecommendationRequest, CropRecommendationResponse
from backend.app.services.ml_service import predict, get_feature_order

router = APIRouter(prefix="/api/v1/crop-recommendation", tags=["Crop Recommendation"])

@router.post("/predict", response_model=CropRecommendationResponse, status_code=status.HTTP_200_OK)
async def predict_crop(req: CropRecommendationRequest):
    # Validate that request includes exactly the required features (Pydantic already does basic type/range checks)
    # Ensure feature order matches model expectations
    expected_features = get_feature_order()
    if not expected_features:
        raise HTTPException(status_code=503, detail="Model not available")
    # Convert request to dict
    payload = req.model_dump()
    # Extra guard: all required keys present
    missing = [f for f in expected_features if f not in payload]
    if missing:
        raise HTTPException(status_code=422, detail=f"Missing features: {', '.join(missing)}")
    try:
        result = predict(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return result
