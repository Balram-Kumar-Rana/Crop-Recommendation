# Machine Learning Dataset Audit Report (dataset_audit.md)
# AgroGenius AI: Crop Recommendation Feature

**Document Version:** 1.0.0  
**Audit Date:** 2026-10-28  
**Dataset Source:** Canonical Agricultural Crop Recommendation Benchmark  
**Verified Path:** `datasets/crop-recommendation/Crop_recommendation.csv`  
**Auditor:** Senior Software Architect & Lead ML Engineer  

---

## 1. Executive Summary & Audit Verdict

| Metric | Verified Value | Compliance Status |
| :--- | :--- | :--- |
| **Total Record Count** | 2,200 rows | ✅ Matches PRD Specification |
| **Total Columns** | 8 columns (7 features + 1 target) | ✅ Exact Schema Match |
| **Missing / Null Values** | 0 (0.00%) | ✅ Zero Missing Data |
| **Duplicate Rows** | 0 (0.00%) | ✅ 100% Unique Observations |
| **Target Classes** | 22 unique crop labels | ✅ Exactly 22 Classes |
| **Class Balance** | 100 rows per crop (4.545% each) | ✅ Perfectly Balanced |
| **Data Integrity Verdict** | **APPROVED FOR PREPROCESSING & MODELING** | ✅ Ready for Pipeline |

---

## 2. File Verification & Physical Metadata

- **Relative File Path:** `datasets/crop-recommendation/Crop_recommendation.csv`
- **Absolute Path:** `C:\Users\Balram\Desktop\recommendation\datasets\crop-recommendation\Crop_recommendation.csv`
- **File Size:** $150,034\text{ bytes}$ ($\sim 146.5\text{ KB}$)
- **Encoding:** UTF-8 Comma-Separated Values (CSV)
- **Line Count:** 2,201 lines (1 header line + 2,200 data records)

---

## 3. Dataset Dimensions & Column Schema

The dataset contains exactly 7 numerical predictor features and 1 categorical target label:

```
+----+-------------+------------------+-----------------------+------------------------+
| #  | Column Name | Python Data Type | Agronomic Meaning     | Standard Unit          |
+----+-------------+------------------+-----------------------+------------------------+
| 1  | N           | int64            | Soil Nitrogen Ratio   | kg/ha                  |
| 2  | P           | int64            | Soil Phosphorus Ratio | kg/ha                  |
| 3  | K           | int64            | Soil Potassium Ratio  | kg/ha                  |
| 4  | temperature | float64          | Ambient Temperature   | °C (Degrees Celsius)   |
| 5  | humidity    | float64          | Relative Humidity     | % (Percentage)         |
| 6  | ph          | float64          | Soil Acidity / Base   | pH scale (0.0 - 14.0)  |
| 7  | rainfall    | float64          | Annual Precipitation  | mm (Millimeters)       |
| 8  | label       | object (string)  | Target Crop Label     | Categorical (22 crops) |
+----+-------------+------------------+-----------------------+------------------------+
```

---

## 4. Missing Values & Duplicate Row Audit

An exhaustive scan across all 2,200 records confirms clean data hygiene:

```
+-------------+---------------+-------------------+----------------------+
| Feature     | Missing Count | Missing %         | Null Data Types      |
+-------------+---------------+-------------------+----------------------+
| N           | 0             | 0.00%             | None                 |
| P           | 0             | 0.00%             | None                 |
| K           | 0             | 0.00%             | None                 |
| temperature | 0             | 0.00%             | None                 |
| humidity    | 0             | 0.00%             | None                 |
| ph          | 0             | 0.00%             | None                 |
| rainfall    | 0             | 0.00%             | None                 |
| label       | 0             | 0.00%             | None                 |
+-------------+---------------+-------------------+----------------------+
| Duplicate Observations: 0 rows (0.00%)                                 |
+------------------------------------------------------------------------+
```

---

## 5. Descriptive Statistics & Feature Distribution

All 7 predictor features were analyzed for parametric and non-parametric properties:

```
+-------------+--------+---------+--------+--------+--------+--------+--------+---------+--------+
| Feature     | Count  | Mean    | Std    | Min    | 25%    | Median | 75%    | Max     | IQR    |
+-------------+--------+---------+--------+--------+--------+--------+--------+---------+--------+
| N           | 2200   | 50.55   | 36.92  | 0.00   | 21.00  | 37.00  | 84.25  | 140.00  | 63.25  |
| P           | 2200   | 53.36   | 32.99  | 5.00   | 28.00  | 51.00  | 68.00  | 145.00  | 40.00  |
| K           | 2200   | 48.15   | 50.65  | 5.00   | 20.00  | 32.00  | 49.00  | 205.00  | 29.00  |
| temperature | 2200   | 25.62   | 5.06   | 8.83   | 22.77  | 25.60  | 28.56  | 43.68   | 5.79   |
| humidity    | 2200   | 71.48   | 22.26  | 14.26  | 60.26  | 80.47  | 89.95  | 99.98   | 29.69  |
| ph          | 2200   | 6.47    | 0.77   | 3.50   | 5.97   | 6.43   | 6.92   | 9.94    | 0.95   |
| rainfall    | 2200   | 103.46  | 54.96  | 20.21  | 64.55  | 94.87  | 124.27 | 298.56  | 59.72  |
+-------------+--------+---------+--------+--------+--------+--------+--------+---------+--------+
```

### 5.1 Outlier & Domain Anomaly Analysis
1. **Potassium ($K$) and Phosphorus ($P$) Upper Values:**  
   $K$ reaches up to $205\text{ kg/ha}$ and $P$ reaches up to $145\text{ kg/ha}$. Statistical boxplots flag these as outliers against the overall dataset mean. However, domain agronomic cross-referencing reveals these values are **physiologically genuine**: deciduous fruit orchards (`apple` and `grapes`) demand exceptionally high potassium levels (mean $K = 200\text{ kg/ha}$) and phosphorus levels (mean $P = 134\text{ kg/ha}$) for fruit set and sugar development. Removing these records would destroy the model's ability to distinguish apple and grape crops.
2. **Soil pH Range Discrepancy Note:**  
   In `PRD.md` Section 14.1, initial boundary guidelines specified soil $pH$ as $3.5$ to $9.5$. The audit discovered 3 records with $pH > 9.5$ (specifically row 507 with $pH=9.68$, row 518 with $pH=9.93$, and row 594 with $pH=9.94$). All 3 records belong to `mothbeans` (Vigna aconitifolia), an arid-zone legume renowned for extreme alkaline tolerance. The physical upper limit in the preprocessing validation schema is therefore calibrated to $10.0$ to accommodate these valid agronomic extremes.

---

## 6. Target Variable Analysis (Crop Classes)

The target column `label` contains exactly **22 distinct agricultural crops**, perfectly balanced with **100 records per crop**:

```
+----+-------------+-------+------------+-------------------------------------------------------+
| #  | Crop Label  | Count | Percentage | Primary Environmental Differentiator                  |
+----+-------------+-------+------------+-------------------------------------------------------+
| 1  | apple       | 100   | 4.545%     | High P (134), High K (200), Moderate Temp (22.6°C)    |
| 2  | banana      | 100   | 4.545%     | High N (100), High P (82), Warm Temp (27.4°C)         |
| 3  | blackgram   | 100   | 4.545%     | Low K (19), Neutral pH (7.1), Warm Temp (30.0°C)      |
| 4  | chickpea    | 100   | 4.545%     | Very Low Humidity (16.9%), Cool Temp (18.9°C)         |
| 5  | coconut     | 100   | 4.545%     | High Humidity (94.8%), High Rainfall (175.7mm)        |
| 6  | coffee      | 100   | 4.545%     | High N (101), High Rainfall (158.1mm), Moderate Humid |
| 7  | cotton      | 100   | 4.545%     | Highest N (117.8), Low K (19.6), Warm (24.0°C)        |
| 8  | grapes      | 100   | 4.545%     | High P (132.5), High K (200.1), Low Rainfall (69.6mm) |
| 9  | jute        | 100   | 4.545%     | High Rainfall (174.8mm), High Humidity (79.6%)        |
| 10 | kidneybeans | 100   | 4.545%     | Low Humidity (21.6%), Cool Temp (20.1°C), Acidic pH   |
| 11 | lentil      | 100   | 4.545%     | Low N (18.8), Low Rainfall (45.7mm), Neutral pH (6.9) |
| 12 | maize       | 100   | 4.545%     | High N (77.8), Low K (19.8), Moderate Rainfall (84mm) |
| 13 | mango       | 100   | 4.545%     | High Temp (31.2°C), Low N (20.1), Moderate Humid (50%)|
| 14 | mothbeans   | 100   | 4.545%     | Arid tolerance, Low Rain (51.2mm), Alkaline pH (6.8-9)|
| 15 | mungbean    | 100   | 4.545%     | High Humidity (85.5%), Low Rain (48.4mm), Warm (28.5) |
| 16 | muskmelon   | 100   | 4.545%     | High N (100.3), Lowest Rainfall (24.7mm), High Humid  |
| 17 | orange      | 100   | 4.545%     | Lowest K (10.0), Low P (16.6), High Humid (92.2%)     |
| 18 | papaya      | 100   | 4.545%     | Warmest Temp (33.7°C), High Humidity (92.4%)          |
| 19 | pigeonpeas   | 100   | 4.545%     | Low K (20.3), High Rain (149.5mm), Low Humid (48.1%)  |
| 20 | pomegranate | 100   | 4.545%     | Low N (18.9), Low P (18.8), High Humidity (90.1%)     |
| 21 | rice        | 100   | 4.545%     | Highest Rainfall (236.2mm), High Humidity (82.3%)      |
| 22 | watermelon  | 100   | 4.545%     | High N (99.4), Low P (17.0), Low Rainfall (50.8mm)     |
+----+-------------+-------+------------+-------------------------------------------------------+
```

---

## 7. Feature Correlation Matrix

```
                  N         P         K    temperature  humidity        ph  rainfall
N            1.0000   -0.2315   -0.1405        0.0265    0.1907    0.0967    0.0590
P           -0.2315    1.0000    0.7362       -0.1275   -0.1187   -0.1380   -0.0638
K           -0.1405    0.7362    1.0000       -0.1604    0.1909   -0.1695   -0.0535
temperature  0.0265   -0.1275   -0.1604        1.0000    0.2053   -0.0178   -0.0301
humidity     0.1907   -0.1187    0.1909        0.2053    1.0000   -0.0085    0.0944
ph           0.0967   -0.1380   -0.1695       -0.0178   -0.0085    1.0000   -0.1091
rainfall     0.0590   -0.0638   -0.0535       -0.0301    0.0944   -0.1091    1.0000
```
- **Correlation Observation:** Phosphorus ($P$) and Potassium ($K$) exhibit a moderate positive correlation ($r = 0.7362$). As confirmed by the crop mean analysis, this is driven by the specialized horticultural nutritional requirements of apples and grapes. All other feature correlations are low ($|r| < 0.25$), confirming absence of multicollinearity issues.

---

## 8. Data Leakage & Preprocessing Strategy

To strictly prevent data leakage per `AGENTS.md` Section 9:
1. **Stratified Split First:** The dataset is split into **80% Training ($1,760$ rows)** and **20% Testing ($440$ rows)** using `stratify=y` with a fixed seed (`random_state=42`).
2. **Class Proportion Invariance:** Every crop class will have exactly $80$ samples in the training set and $20$ samples in the testing set.
3. **Scaler Fitting Boundary:** Any numerical scaler (`StandardScaler` or `MinMaxScaler`) will be fitted **strictly on the training split**. The testing split is transformed using the learned training parameters.
4. **Target Encoding:** Target labels are encoded via `LabelEncoder` with an explicit bidirectional mapping saved to `ml-service/models/label_encoder.json`.
5. **Raw Data Immutability:** The source file `datasets/crop-recommendation/Crop_recommendation.csv` is maintained in read-only state. Processed outputs are written to `ml-service/data/processed/`.

---
*End of Dataset Audit Report (dataset_audit.md)*
