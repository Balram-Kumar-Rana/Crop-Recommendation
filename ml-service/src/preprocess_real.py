# -*- coding: utf-8 -*-
"""Standalone preprocessing script that does not rely on package imports.
It replicates the logic from `src/preprocess.py` but loads the helper
functions from `src/dataset.py` via `importlib` so that the script can be
executed directly (the `ml-service` directory name contains a hyphen and
cannot be imported as a Python package).
"""

import json
import os
import sys
from pathlib import Path
import importlib.util
import pandas as pd
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.preprocessing import StandardScaler, LabelEncoder

# ---------------------------------------------------------------------------
# Load helper functions from dataset.py using importlib (no package import)
# ---------------------------------------------------------------------------
DATASET_PATH = Path(__file__).resolve().parent / "dataset.py"
spec = importlib.util.spec_from_file_location("dataset_mod", DATASET_PATH)
module = importlib.util.module_from_spec(spec)
sys.modules["dataset_mod"] = module
spec.loader.exec_module(module)

load_raw_dataset = module.load_raw_dataset
validate_dataset = module.validate_dataset
EXPECTED_FEATURES = module.EXPECTED_FEATURES
TARGET_COLUMN = module.TARGET_COLUMN

# ---------------------------------------------------------------------------
# Constants – same as in `preprocess.py`
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[1]  # ml-service/
PROCESSED_DIR = BASE_DIR / "data" / "processed"
TRAIN_PATH = PROCESSED_DIR / "train.csv"
TEST_PATH = PROCESSED_DIR / "test.csv"
LABEL_ENCODER_PATH = PROCESSED_DIR / "label_encoder.json"

def _ensure_output_dir() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

def split_and_preprocess(random_state: int = 42) -> None:
    # Load and validate raw data
    df_raw = load_raw_dataset()
    validation = validate_dataset(df_raw)
    if validation.get("status") != "VALID":
        raise RuntimeError(f"Dataset validation failed: {validation}")

    # Encode target labels
    le = LabelEncoder()
    df_raw["label_idx"] = le.fit_transform(df_raw[TARGET_COLUMN])
    label_mapping = {int(i): label for i, label in enumerate(le.classes_)}

    # Stratified split
    splitter = StratifiedShuffleSplit(n_splits=1, test_size=0.20, random_state=random_state)
    X = df_raw[EXPECTED_FEATURES]
    y = df_raw["label_idx"]
    for train_idx, test_idx in splitter.split(X, y):
        X_train, X_test = X.iloc[train_idx].copy(), X.iloc[test_idx].copy()
        y_train, y_test = y.iloc[train_idx].copy(), y.iloc[test_idx].copy()

    # Scale features (fit on train only)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    df_train = pd.DataFrame(X_train_scaled, columns=EXPECTED_FEATURES)
    df_test = pd.DataFrame(X_test_scaled, columns=EXPECTED_FEATURES)
    df_train[TARGET_COLUMN] = y_train.values
    df_test[TARGET_COLUMN] = y_test.values

    _ensure_output_dir()
    df_train.to_csv(TRAIN_PATH, index=False)
    df_test.to_csv(TEST_PATH, index=False)
    with open(LABEL_ENCODER_PATH, "w", encoding="utf-8") as f:
        json.dump(label_mapping, f, ensure_ascii=False, indent=2)
    print("Preprocessing completed. Files written:")
    print(f"  - {TRAIN_PATH}")
    print(f"  - {TEST_PATH}")
    print(f"  - {LABEL_ENCODER_PATH}")

if __name__ == "__main__":
    split_and_preprocess()
