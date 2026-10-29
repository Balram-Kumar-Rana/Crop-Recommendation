import joblib
import json
from pathlib import Path
from typing import Any, Dict, List

# Paths are relative to project root
PROJECT_ROOT = Path(__file__).resolve().parents[3]  # backend/app/services -> project root
MODEL_PATH = PROJECT_ROOT / "ml-service" / "models" / "crop_recommendation_model.joblib"
META_PATH = PROJECT_ROOT / "ml-service" / "models" / "model_metadata.json"

# Global singleton variables
_model = None
_label_encoder: Dict[str, str] = {}
_feature_order: List[str] = []

def load_model() -> None:
    """Load the trained model and its metadata.
    Called during FastAPI startup (lifespan) and lazily on first request if needed.
    """
    global _model, _label_encoder, _feature_order
    if _model is not None:
        return
    try:
        if not MODEL_PATH.is_file():
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        _model = joblib.load(str(MODEL_PATH))
        if META_PATH.is_file():
            with open(META_PATH, "r", encoding="utf-8") as f:
                meta = json.load(f)
                _feature_order = meta.get("feature_order", [])
                _label_encoder = {str(k): v for k, v in meta.get("label_encoder", {}).items()}
        else:
            _feature_order = []
            _label_encoder = {}
    except Exception as exc:
        # Log could be added; keep model as None to signal failure.
        _model = None
        _feature_order = []
        _label_encoder = {}
        raise RuntimeError(f"Failed to load ML model: {exc}") from exc

def get_model():
    """Return the loaded model, loading it first if necessary.
    Raises RuntimeError if the model cannot be loaded.
    """
    if _model is None:
        load_model()
    return _model

def get_feature_order() -> List[str]:
    if not _feature_order:
        # Ensure metadata is loaded to get order.
        load_model()
    return _feature_order

def get_label_name(label_idx: Any) -> str:
    """Map numeric label (int or string) to human‑readable crop name using the encoder.
    If mapping is missing, return the raw value as string.
    """
    return _label_encoder.get(str(label_idx), str(label_idx))

def predict(features: Dict[str, float]) -> Dict[str, Any]:
    """Run inference.
    *features* must contain exactly the keys defined in the model's feature order.
    Returns a dict with ``label`` and optional ``confidence`` (probability of the predicted class).
    """
    model = get_model()
    order = get_feature_order()
    # Ensure ordering matches expected
    try:
        X = [features[key] for key in order]
    except KeyError as e:
        raise ValueError(f"Missing required feature: {e.args[0]}")
    # Model expects 2‑D array
    import numpy as np
    X_arr = np.array([X])
    label_idx = model.predict(X_arr)[0]
    label_name = get_label_name(label_idx)
    result: Dict[str, Any] = {"label": label_name}
    # If model supports predict_proba, provide confidence for the predicted class
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X_arr)[0]
        confidence = float(probs[int(label_idx)]) if isinstance(label_idx, (int, np.integer)) else None
        if confidence is not None:
            result["confidence"] = confidence
    return result
