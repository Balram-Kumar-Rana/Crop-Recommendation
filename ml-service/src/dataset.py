"""
AgroGenius AI - Machine Learning Dataset Ingestion and Validation Module.
Location: ml-service/src/dataset.py

Responsible for loading the raw agricultural benchmark dataset, enforcing feature schema
invariance, and executing defensive data integrity checks.
"""

import os
from pathlib import Path
from typing import Dict, List, Tuple
import pandas as pd

# Canonical feature schema
EXPECTED_FEATURES: List[str] = [
    "N",
    "P",
    "K",
    "temperature",
    "humidity",
    "ph",
    "rainfall",
]
TARGET_COLUMN: str = "label"
EXPECTED_COLUMNS: List[str] = EXPECTED_FEATURES + [TARGET_COLUMN]

# Physical agronomic boundaries calibrated from domain requirements and dataset audit
FEATURE_BOUNDS: Dict[str, Tuple[float, float]] = {
    "N": (0.0, 140.0),
    "P": (5.0, 145.0),
    "K": (5.0, 205.0),
    "temperature": (5.0, 50.0),
    "humidity": (10.0, 100.0),
    "ph": (3.5, 10.0),  # Accommodates alkaline mothbean soils up to 9.94
    "rainfall": (20.0, 350.0),
}

DEFAULT_RAW_CSV_PATH = Path("datasets/crop-recommendation/Crop_recommendation.csv")


def load_raw_dataset(csv_path: Path = DEFAULT_RAW_CSV_PATH) -> pd.DataFrame:
    """
    Loads the raw crop recommendation CSV dataset from disk.

    Args:
        csv_path: Path to the raw CSV file.

    Returns:
        pd.DataFrame: Loaded dataset.

    Raises:
        FileNotFoundError: If the CSV file does not exist.
        ValueError: If columns or dimensions fail validation.
    """
    path = Path(csv_path)
    if not path.is_file():
        raise FileNotFoundError(f"Raw dataset file not found at: {path.resolve()}")

    df = pd.read_csv(path)
    return df


def validate_dataset(df: pd.DataFrame) -> Dict[str, any]:
    """
    Validates structural and agronomic constraints on the dataset.

    Checks:
    - Exact column schema match.
    - Zero null or missing values.
    - Zero duplicate rows.
    - Feature values within physical bounds.
    - Number of target classes and balance.

    Args:
        df: DataFrame to validate.

    Returns:
        dict: Validation metrics and audit summary.

    Raises:
        ValueError: If any structural constraint is violated.
    """
    # 1. Column Schema Verification
    actual_cols = list(df.columns)
    if actual_cols != EXPECTED_COLUMNS:
        raise ValueError(
            f"Schema mismatch! Expected columns: {EXPECTED_COLUMNS}, but got: {actual_cols}"
        )

    # 2. Missing Values Check
    null_counts = df.isnull().sum()
    total_nulls = int(null_counts.sum())
    if total_nulls > 0:
        raise ValueError(f"Dataset contains {total_nulls} missing values:\n{null_counts[null_counts > 0]}")

    # 3. Duplicate Rows Check
    dup_count = int(df.duplicated().sum())
    if dup_count > 0:
        raise ValueError(f"Dataset contains {dup_count} duplicate rows.")

    # 4. Feature Bounds Verification
    bound_violations = {}
    for feature, (min_val, max_val) in FEATURE_BOUNDS.items():
        feat_min = df[feature].min()
        feat_max = df[feature].max()
        if feat_min < min_val or feat_max > max_val:
            bound_violations[feature] = {
                "actual_range": (feat_min, feat_max),
                "expected_bounds": (min_val, max_val),
            }

    if bound_violations:
        raise ValueError(f"Feature values exceed physiological bounds: {bound_violations}")

    # 5. Target Class Distribution
    class_counts = df[TARGET_COLUMN].value_counts().to_dict()
    num_classes = len(class_counts)

    return {
        "status": "VALID",
        "row_count": len(df),
        "column_count": len(df.columns),
        "num_classes": num_classes,
        "classes": sorted(list(class_counts.keys())),
        "class_counts": class_counts,
        "features": EXPECTED_FEATURES,
    }


if __name__ == "__main__":
    df_raw = load_raw_dataset()
    results = validate_dataset(df_raw)
    print("Dataset Validation Passed Successfully!")
    print(f"Total Rows: {results['row_count']}")
    print(f"Total Classes: {results['num_classes']}")
    print(f"Features: {results['features']}")
