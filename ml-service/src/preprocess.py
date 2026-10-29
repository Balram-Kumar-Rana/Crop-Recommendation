# -*- coding: utf-8 -*-
"""ml-service preprocessing pipeline.

This module provides a function to load the raw crop recommendation dataset,
perform a stratified train/test split, fit a :class:`sklearn.preprocessing.StandardScaler`
on the training features, transform both splits, encode the target labels, and
persist the processed artefacts.

The implementation follows the strict anti‑leakage rules defined in
`AGENTS.md` Section 9 – the scaler is *only* fitted on the training data.
Processed files are written as CSV to avoid additional binary dependencies
(e.g. ``pyarrow``).  The output files are placed under ``ml-service/data/processed``:

* ``train.csv`` – 1,760 rows, 8 columns (7 features + encoded ``label``)
* ``test.csv``  –   440 rows, same schema
* ``label_encoder.json`` – bidirectional mapping between original crop names
  and integer indices used during training/inference.
"""

from pathlib import Path
import json
import pandas as pd
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.preprocessing import StandardScaler, LabelEncoder

# Import helper from the sibling module
try:
    from .dataset import load_raw_dataset, validate_dataset
except ImportError:
    # Fallback for running the script directly (no package context)
    import sys
    from pathlib import Path
    # Add the repository root to sys.path so that `src.dataset` can be imported as a module
    repo_root = Path(__file__).resolve().parents[2]
    sys.path.append(str(repo_root))
    from src.dataset import load_raw_dataset, validate_dataset

# Constants – keep in sync with the validation schema
FEATURE_COLUMNS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET_COLUMN = "label"

# Output locations (relative to repository root)
PROCESSED_DIR = Path(__file__).resolve().parents[1] / "data" / "processed"
TRAIN_PATH = PROCESSED_DIR / "train.csv"
TEST_PATH = PROCESSED_DIR / "test.csv"
LABEL_ENCODER_PATH = PROCESSED_DIR / "label_encoder.json"


def _ensure_output_dir() -> None:
    """Create the ``processed`` directory if it does not exist."""
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


def split_and_preprocess(random_state: int = 42) -> None:
    """Execute the full preprocessing pipeline.

    Steps
    -----
    1. Load and validate the raw CSV.
    2. Encode the target labels with :class:`LabelEncoder` (saved for later
       inference).
    3. Perform a stratified 80/20 split preserving class balance.
    4. Fit a ``StandardScaler`` on the training **feature** columns only.
    5. Transform both train and test feature sets.
    6. Persist the processed splits and the label‑encoder mapping as CSV and
       JSON respectively.

    Parameters
    ----------
    random_state: int, optional
        Seed for reproducibility.  The default value matches the value used in
        the original design documentation.
    """
    # ---------------------------------------------------------------------
    # 1. Load & validate
    # ---------------------------------------------------------------------
    df_raw = load_raw_dataset()
    validation = validate_dataset(df_raw)
    if validation.get("status") != "VALID":
        raise RuntimeError(f"Dataset validation failed: {validation}")

    # ---------------------------------------------------------------------
    # 2. Encode target labels
    # ---------------------------------------------------------------------
    le = LabelEncoder()
    df_raw["label_idx"] = le.fit_transform(df_raw[TARGET_COLUMN])
    # Save label mapping for inference services
    label_mapping = {int(i): label for i, label in enumerate(le.classes_)}

    # ---------------------------------------------------------------------
    # 3. Stratified split
    # ---------------------------------------------------------------------
    splitter = StratifiedShuffleSplit(n_splits=1, test_size=0.20, random_state=random_state)
    X = df_raw[FEATURE_COLUMNS]
    y = df_raw["label_idx"]
    for train_idx, test_idx in splitter.split(X, y):
        X_train, X_test = X.iloc[train_idx].copy(), X.iloc[test_idx].copy()
        y_train, y_test = y.iloc[train_idx].copy(), y.iloc[test_idx].copy()

    # ---------------------------------------------------------------------
    # 4. Fit scaler on training features only
    # ---------------------------------------------------------------------
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Convert back to DataFrames with original column names
    df_train = pd.DataFrame(X_train_scaled, columns=FEATURE_COLUMNS)
    df_test = pd.DataFrame(X_test_scaled, columns=FEATURE_COLUMNS)
    df_train[TARGET_COLUMN] = y_train.values
    df_test[TARGET_COLUMN] = y_test.values

    # ---------------------------------------------------------------------
    # 5. Persist artefacts
    # ---------------------------------------------------------------------
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
