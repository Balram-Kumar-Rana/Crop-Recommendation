"""FastAPI application entrypoint for AgroGenius AI.

This module creates the FastAPI app, loads the ML model at startup, and includes
the API routers. The design follows the layered architecture described in
AGENTS.md and ARCHITECTURE.md.
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pathlib import Path
import joblib
import json

# Global variables to hold the loaded model and label encoder (if any)
model = None
label_encoder = None

# Path to the trained model artifact (relative to project root)
MODEL_PATH = Path(__file__).resolve().parents[2] / "ml-service" / "models" / "crop_recommendation_model.joblib"
METADATA_PATH = Path(__file__).resolve().parents[2] / "ml-service" / "models" / "model_metadata.json"

app = FastAPI(title="AgroGenius AI Backend", version="1.0.0")

# Enable CORS for local development (Vite dev server)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def load_model():
    """Load the trained model and metadata when the application starts.
    The objects are stored in moduleâ€‘level globals for fast inference.
    """
    global model, label_encoder
    try:
        if not MODEL_PATH.is_file():
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        model = joblib.load(str(MODEL_PATH))
        # Load optional label encoder mapping from metadata if present
        if METADATA_PATH.is_file():
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                meta = json.load(f)
                # Expected key: "label_encoder" mapping class index â†’ label string
                label_encoder = meta.get("label_encoder")
        else:
            label_encoder = None
    except Exception as exc:
        # Logging could be added here; for now we just keep model as None.
        model = None
        label_encoder = None
        # Raising would prevent the app from starting; we prefer a graceful fallback.
        # The endpoint will return HTTP 503 if the model is unavailable.
        print(f"Failed to load model: {exc}")

# Import and include routers after the app is created.
# The import is placed here to avoid circular import issues during startup.
from backend.app.api.v1.endpoints import crop_recommendation
from backend.app.api.v1.endpoints import fertilizer_recommendation

app.include_router(crop_recommendation.router)
app.include_router(fertilizer_recommendation.router)

# Optional health check endpoint
@app.get("/health", response_class=JSONResponse)
async def health_check():
    status = "ready" if model is not None else "unavailable"
    return {"status": status}

