import sys, json, pathlib
import pandas as pd
from fastapi.testclient import TestClient

project_root = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(project_root))

from backend.app.main import app

client = TestClient(app)

test_path = project_root / 'ml-service' / 'data' / 'processed' / 'test.csv'
row = pd.read_csv(test_path).iloc[0]
payload = {col: float(row[col]) for col in row.index if col != 'label'}
resp = client.post('/api/v1/crop-recommendation/predict', json=payload)
print('Status:', resp.status_code)
print('JSON:', resp.json())
