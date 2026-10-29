# Model Training & Evaluation Report

**Generated**: 2026-10-28 14:12 UTC

## Dataset splits
- Training rows: 1760
- Test rows: 440

## Candidate model metrics
### Decision Tree
- Accuracy: 0.9795
- Macro Precision: 0.9806
- Macro Recall: 0.9795
- Macro F1: 0.9794
### Random Forest (100 estimators)
- Accuracy: 0.9955
- Macro Precision: 0.9957
- Macro Recall: 0.9955
- Macro F1: 0.9955

## Selected model
- **Model type**: RandomForestClassifier
- **Test accuracy**: 0.9955
- **Macro‑Precision**: 0.9957
- **Macro‑Recall**: 0.9955
- **Macro‑F1**: 0.9955

## Confusion matrix (excerpt)

      0   1   2   3   4
  0  20   0   0   0   0
  1   0  20   0   0   0
  2   0   0  19   0   0
  3   0   0   0  20   0
  4   0   0   0   0  20

*Full matrix stored in the JSON metadata.*

## Limitations & next steps
- Model evaluated only on the held‑out test split.
- No hyper‑parameter sweep performed as per project constraints.
- Future work may include cross‑validation and feature‑importance analysis.
