import joblib, pandas as pd, json, pathlib, os

model_path = pathlib.Path(r'C:/Users/Balram/Desktop/recommendation/ml-service/models/crop_recommendation_model.joblib')
metadata_path = pathlib.Path(r'C:/Users/Balram/Desktop/recommendation/ml-service/models/model_metadata.json')

def main():
    model = joblib.load(model_path)
    with open(metadata_path, 'r', encoding='utf-8') as f:
        meta = json.load(f)
    feature_order = meta['feature_order']
    # Load one record from test set
    test_path = pathlib.Path(r'C:/Users/Balram/Desktop/recommendation/ml-service/data/processed/test.csv')
    df_test = pd.read_csv(test_path)
    row = df_test.iloc[0]
    X = row[feature_order].values.reshape(1, -1)
    pred = model.predict(X)
    label = meta['label_encoder'][str(int(pred[0]))]
    print('Prediction (int):', int(pred[0]))
    print('Predicted label:', label)

if __name__ == '__main__':
    main()
