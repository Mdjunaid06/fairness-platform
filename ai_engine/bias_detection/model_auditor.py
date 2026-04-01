import pandas as pd
import numpy as np
import io
from google.cloud import storage
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from typing import Dict, Any, List
from .metrics import FairnessMetrics


class ModelAuditor:

    def __init__(self):
        self.gcs_client = storage.Client()
        self.metrics = FairnessMetrics()

    def _load_from_gcs(self, gcs_uri: str) -> pd.DataFrame:
        uri = gcs_uri.replace("gs://", "")
        bucket_name, blob_path = uri.split("/", 1)
        bucket = self.gcs_client.bucket(bucket_name)
        blob = bucket.blob(blob_path)
        content = blob.download_as_bytes()
        return pd.read_csv(io.BytesIO(content))

    def audit(
        self,
        gcs_uri: str,
        target_column: str,
        sensitive_features: List[str],
        model_type: str = "auto"
    ) -> Dict[str, Any]:

        df = self._load_from_gcs(gcs_uri)

        # Encode categoricals
        encoders = {}
        df_enc = df.copy()
        for col in df_enc.select_dtypes(include=["object"]).columns:
            le = LabelEncoder()
            df_enc[col] = le.fit_transform(df_enc[col].astype(str))
            encoders[col] = le

        X = df_enc.drop(columns=[target_column])
        y = df_enc[target_column]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )

        # Train model
        model = RandomForestClassifier(
            n_estimators=100, random_state=42, n_jobs=-1
        )
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        # Accuracy
        accuracy = round(float(accuracy_score(y_test, y_pred)), 4)

        # Fairness metrics per sensitive feature
        fairness_results = []
        for sf in sensitive_features:
            if sf not in X_test.columns:
                continue
            s = X_test[sf].values
            yt = y_test.values

            dpd = self.metrics.demographic_parity_difference(y_pred, s)
            dir_ = self.metrics.disparate_impact_ratio(y_pred, s)
            eod = self.metrics.equal_opportunity_difference(yt, y_pred, s)
            eqo = self.metrics.equalized_odds(yt, y_pred, s)

            fairness_results.append({
                "sensitive_feature": sf,
                "metrics": [dpd, dir_, eod, eqo]
            })

        # Overall score
        all_metrics = [
            m for sf_result in fairness_results
            for m in sf_result["metrics"]
            if "value" in m
        ]
        overall = self.metrics.overall_fairness_score(all_metrics)

        # Feature importance
        importance = dict(
            zip(X.columns, model.feature_importances_)
        )
        top_features = dict(
            sorted(
                importance.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]
        )

        return {
            "model_type": "RandomForestClassifier",
            "accuracy": accuracy,
            "test_samples": len(X_test),
            "fairness_metrics": fairness_results,
            "overall_score": overall,
            "feature_importance": {
                k: round(float(v), 4)
                for k, v in top_features.items()
            }
        }