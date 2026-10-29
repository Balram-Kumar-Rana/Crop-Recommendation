# -*- coding: utf-8 -*-
"""Tests for the ML preprocessing pipeline.

These tests verify that:
1. The raw dataset can be loaded and passes validation.
2. The preprocessing step creates train/test CSV files with the expected
   row counts and that the label encoder JSON contains 22 entries.
"""

import json
from pathlib import Path
import pandas as pd

from src.dataset import load_raw_dataset, validate_dataset
from src.preprocess import split_and_preprocess, PROCESSED_DIR, TRAIN_PATH, TEST_PATH, LABEL_ENCODER_PATH

def test_load_and_validate():
    df = load_raw_dataset()
    assert df.shape == (2200, 8), "Raw dataset should have 2200 rows and 8 columns"
    validation = validate_dataset(df)
    assert validation.get("status") == "VALID", f"Dataset validation failed: {validation}"

def test_preprocess_creates_files(tmp_path: Path):
    """Test that preprocessing writes expected files to a temporary directory.
    This version avoids pytest's ``monkeypatch`` fixture by directly modifying
    the module attributes.
    """
    import importlib
    # Import the preprocess module fresh to avoid side‑effects
    preprocess = importlib.import_module("src.preprocess")
    # Redirect output paths to a temp location
    temp_dir = tmp_path / "processed"
    temp_dir.mkdir(parents=True, exist_ok=True)
    preprocess.PROCESSED_DIR = temp_dir
    preprocess.TRAIN_PATH = temp_dir / "train.csv"
    preprocess.TEST_PATH = temp_dir / "test.csv"
    preprocess.LABEL_ENCODER_PATH = temp_dir / "label_encoder.json"
    # Run the preprocessing pipeline
    preprocess.split_and_preprocess()
    # Verify files exist and have correct shapes
    assert temp_dir.is_dir()
    train_df = pd.read_csv(temp_dir / "train.csv")
    test_df = pd.read_csv(temp_dir / "test.csv")
    assert train_df.shape[0] == 1760, "Train split should contain 1760 rows"
    assert test_df.shape[0] == 440, "Test split should contain 440 rows"
    # Verify label encoder JSON contains 22 mappings
    with open(temp_dir / "label_encoder.json", "r", encoding="utf-8") as f:
        mapping = json.load(f)
    assert len(mapping) == 22, "Label encoder should contain 22 class mappings"


