from typing import Optional
from pydantic import BaseModel, Field


class FertilizerRecommendationRequest(BaseModel):
    temperature_c: float = Field(..., ge=-10, le=70)
    humidity_percent: float = Field(..., ge=0, le=100)
    moisture_percent: float = Field(..., ge=0, le=100)
    soil_type: str = Field(..., min_length=1, max_length=50)
    crop_type: str = Field(..., min_length=1, max_length=50)
    season: str = Field(..., min_length=1, max_length=50)
    nitrogen_N_kg_ha_proxy: float = Field(..., ge=0)
    phosphorus_P_kg_ha_proxy: float = Field(..., ge=0)
    potassium_K_kg_ha_proxy: float = Field(..., ge=0)
    soil_ph: float = Field(..., ge=0, le=14)
    rainfall_mm_proxy: float = Field(..., ge=0)


class FertilizerRecommendationResponse(BaseModel):
    recommended_fertilizer: str
    prototype_warning: str
    model_confidence: Optional[float] = None
