# -*- coding: utf-8 -*-
"""
Training and evaluation script for AgroGenius AI crop recommendation.

* Loads the pre‑processed train / test CSV files created by `preprocess.py`.
* Trains a baseline DecisionTreeClassifier and a primary RandomForestClassifier.
* Evaluates on the held‑out test set using accuracy, macro precision, recall and F1.
* Selects the model that meets the accuracy target (≥ 95 %). If the RandomForest satisfies the target it is chosen, otherwise the DecisionTree is used.
* Serialises the chosen model to `ml-service/models/crop_recommendation_model.joblib`.
* Writes a JSON metadata file and a human‑readable markdown evaluation report.

The script is designed to be deterministic (fixed random_state) and safe:
- No data leakage – the scaler is already applied inside the pre‑processed CSVs.
- No new external dependencies are introduced beyond the already‑available scikit‑learn / pandas / joblib.
"""

import json
import os
from pathlib import Path
from datetime import datetime
import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)
import joblib

# ---------------------------------------------------------------------------
# Paths – keep in sync with `preprocess.py`
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[1]  # ml-service/
PROCESSED_DIR = BASE_DIR / "data" / "processed"
TRAIN_PATH = PROCESSED_DIR / "train.csv"
TEST_PATH = PROCESSED_DIR / "test.csv"
LABEL_ENCODER_PATH = PROCESSED_DIR / "label_encoder.json"

MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "crop_recommendation_model.joblib"
META_PATH = MODEL_DIR / "model_metadata.json"
REPORT_PATH = BASE_DIR / "reports" / "evaluation_report.md"

# ---------------------------------------------------------------------------
# Helper to compute all required metrics
# ---------------------------------------------------------------------------
def compute_metrics(y_true, y_pred) -> dict:
    """Return a dict with accuracy, macro‑averaged precision/recall/F1 and confusion matrix."""
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, average="macro", zero_division=0)
    rec = recall_score(y_true, y_pred, average="macro", zero_division=0)
    f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    cm = confusion_matrix(y_true, y_pred)
    return {
        "accuracy": acc,
        "macro_precision": prec,
        "macro_recall": rec,
        "macro_f1": f1,
        "confusion_matrix": cm.tolist(),  # serialisable
    }

# ---------------------------------------------------------------------------
# Main training / evaluation routine
# ---------------------------------------------------------------------------
def main():
    # Load pre‑processed data
    if not TRAIN_PATH.is_file() or not TEST_PATH.is_file():
        raise FileNotFoundError("Processed train/test CSV files not found. Run the preprocessing step first.")
    train_df = pd.read_csv(TRAIN_PATH)
    test_df = pd.read_csv(TEST_PATH)

    # Features and target
    feature_cols = [c for c in train_df.columns if c != "label"]
    X_train = train_df[feature_cols].values
    y_train = train_df["label"].values
    X_test = test_df[feature_cols].values
    y_test = test_df["label"].values

    # ---------------------------------------------------------------
    # 1️⃣ Baseline Decision Tree
    # ---------------------------------------------------------------
    dt_clf = DecisionTreeClassifier(random_state=42)
    dt_clf.fit(X_train, y_train)
    dt_pred = dt_clf.predict(X_test)
    dt_metrics = compute_metrics(y_test, dt_pred)

    # ---------------------------------------------------------------
    # 2️⃣ Primary Random Forest (100 trees)
    # ---------------------------------------------------------------
    rf_clf = RandomForestClassifier(
        n_estimators=100, random_state=42, n_jobs=-1
    )
    rf_clf.fit(X_train, y_train)
    rf_pred = rf_clf.predict(X_test)
    rf_metrics = compute_metrics(y_test, rf_pred)

    # ---------------------------------------------------------------
    # Model selection logic
    # ---------------------------------------------------------------
    ACC_TARGET = 0.95
    if rf_metrics["accuracy"] >= ACC_TARGET:
        selected_model = rf_clf
        selected_name = "RandomForestClassifier"
        selected_metrics = rf_metrics
    else:
        # Fall back to Decision Tree if RF does not meet the target
        selected_model = dt_clf
        selected_name = "DecisionTreeClassifier"
        selected_metrics = dt_metrics

    # ---------------------------------------------------------------
    # Persist model and metadata
    # ---------------------------------------------------------------
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(selected_model, MODEL_PATH)

    # Load label encoder mapping for completeness (store as part of metadata)
    with open(LABEL_ENCODER_PATH, "r", encoding="utf-8") as f:
        label_mapping = json.load(f)

    metadata = {
        "model_type": selected_name,
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "feature_order": feature_cols,
        "label_encoder": label_mapping,
        "metrics": selected_metrics,
        "library_versions": {
            "python": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
            "pandas": pd.__version__,
            "scikit_learn": DecisionTreeClassifier.__module__.split('.')[0],  # placeholder for version extraction
        },
    }
    # Write JSON metadata
    with open(META_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    # ---------------------------------------------------------------
    # Write a markdown evaluation report
    # ---------------------------------------------------------------
    report_lines = []
    report_lines.append("# Model Training & Evaluation Report")
    report_lines.append("\n**Generated**: " + datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"))
    report_lines.append("\n## Dataset splits")
    report_lines.append(f"- Training rows: {len(train_df)}")
    report_lines.append(f"- Test rows: {len(test_df)}")
    report_lines.append("\n## Candidate model metrics")
    report_lines.append("### Decision Tree")
    for k, v in dt_metrics.items():
        if k != "confusion_matrix":
            report_lines.append(f"- {k.replace('_', ' ').title()}: {v:.4f}")
    report_lines.append("### Random Forest (100 estimators)")
    for k, v in rf_metrics.items():
        if k != "confusion_matrix":
            report_lines.append(f"- {k.replace('_', ' ').title()}: {v:.4f}")
    report_lines.append("\n## Selected model")
    report_lines.append(f"- **Model type**: {selected_name}")
    report_lines.append(f"- **Test accuracy**: {selected_metrics['accuracy']:.4f}")
    report_lines.append(f"- **Macro‑Precision**: {selected_metrics['macro_precision']:.4f}")
    report_lines.append(f"- **Macro‑Recall**: {selected_metrics['macro_recall']:.4f}")
    report_lines.append(f"- **Macro‑F1**: {selected_metrics['macro_f1']:.4f}")
    report_lines.append("\n## Confusion matrix (excerpt)\n")
    cm = selected_metrics["confusion_matrix"]
    # Show first 5 rows/cols for readability
    header = "    " + " ".join([f"{i:>3}" for i in range(min(5, len(cm)))])
    report_lines.append(header)
    for i, row in enumerate(cm[:5]):
        row_str = f"{i:>3} " + " ".join([f"{val:>3}" for val in row[:5]])
        report_lines.append(row_str)
    report_lines.append("\n*Full matrix stored in the JSON metadata.*")
    report_lines.append("\n## Limitations & next steps\n- Model evaluated only on the held‑out test split.\n- No hyper‑parameter sweep performed as per project constraints.\n- Future work may include cross‑validation and feature‑importance analysis.\n")

    os.makedirs(REPORT_PATH.parent, exist_ok=True)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print("Training complete. Model saved to", MODEL_PATH)
    print("Metadata saved to", META_PATH)
    print("Evaluation report written to", REPORT_PATH)

if __name__ == "__main__":
    main()
