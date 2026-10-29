from pydantic import BaseModel, Field
from typing import Optional

class CropRecommendationRequest(BaseModel):
    N: float = Field(..., ge=0, description="Nitrogen content (mg/kg)")
    P: float = Field(..., ge=0, description="Phosphorus content (mg/kg)")
    K: float = Field(..., ge=0, description="Potassium content (mg/kg)")
    temperature: float = Field(..., description="Temperature in degrees Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity percentage")
    ph: float = Field(..., ge=0, le=14, description="Soil pH value")
    rainfall: float = Field(..., ge=0, description="Rainfall in mm")

class CropRecommendationResponse(BaseModel):
    label: str = Field(..., description="Predicted crop name")
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Model confidence (probability) for the predicted class")
