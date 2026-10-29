import pathlib, sys, json, os
project_root = pathlib.Path(__file__).resolve().parents[3]
print('project_root:', project_root)
print('exists?', (project_root / 'ml-service' / 'data' / 'processed' / 'test.csv').exists())
