import json
from pathlib import Path
from datetime import datetime, timezone

import pandas as pd
import sklearn
from joblib import dump
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

root = Path.cwd()
data_path = root / "datasets" / "fertilizers" / "fertilizer_prototype_synthetic.csv"
model_dir = root / "ml-service" / "models"
model_path = model_dir / "fertilizer_recommendation_model.joblib"
metadata_path = model_dir / "fertilizer_model_metadata.json"
target = "recommended_fertilizer_label"

print("Loading dataset:", data_path)

if not data_path.exists():
    raise FileNotFoundError(f"Dataset not found: {data_path}")

df = pd.read_csv(data_path)

if target not in df.columns:
    raise ValueError(f"Target column missing: {target}")

if df.empty or df.isnull().any().any():
    raise ValueError("Dataset is empty or contains missing values.")

X = df.drop(columns=[target])
y = df[target].astype(str)

categorical = X.select_dtypes(include=["object", "category"]).columns.tolist()
numeric = [c for c in X.columns if c not in categorical]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

preprocessor = ColumnTransformer([
    ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical),
    ("numeric", "passthrough", numeric),
])

model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1
    )),
])

print("Training model...")
model.fit(X_train, y_train)

predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print(f"\nTest accuracy: {accuracy:.2%}")
print("\nClassification report:")
print(classification_report(y_test, predictions, zero_division=0))

model_dir.mkdir(parents=True, exist_ok=True)
dump(model, model_path)

metadata = {
    "model_name": "Fertilizer Recommendation Random Forest",
    "target_column": target,
    "feature_columns": X.columns.tolist(),
    "categorical_features": categorical,
    "numeric_features": numeric,
    "classes": sorted(y.unique().tolist()),
    "dataset_rows": int(len(df)),
    "training_rows": int(len(X_train)),
    "testing_rows": int(len(X_test)),
    "test_accuracy": float(accuracy),
    "sklearn_version": sklearn.__version__,
    "trained_at_utc": datetime.now(timezone.utc).isoformat(),
    "data_note": "Synthetic prototype data; not validated for real agricultural advice."
}

metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

print("\nModel saved:", model_path)
print("Metadata saved:", metadata_path)
print("TRAINING COMPLETE")
print("NOTE: Synthetic data is for prototype demonstration only.")
