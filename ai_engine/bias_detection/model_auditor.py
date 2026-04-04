import pandas as pd
import numpy as np
import io
import base64
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
from typing import Dict, Any, List, Optional
from .metrics import FairnessMetrics


class ModelAuditor:

    def __init__(self):
        self.metrics = FairnessMetrics()

    def _load_data(
        self,
        gcs_uri: str,
        file_id: str = None
    ) -> pd.DataFrame:
        """Route to correct loader based on URI type"""

        # Priority 1 — use file_id directly
        if file_id and str(file_id).strip():
            return self._load_from_firestore(
                str(file_id).strip()
            )

        # Priority 2 — parse firestore URI
        if gcs_uri and gcs_uri.startswith("firestore://"):
            fid = gcs_uri.split("/")[-1]
            return self._load_from_firestore(fid)

        # Priority 3 — GCS URI
        if gcs_uri and gcs_uri.startswith("gs://"):
            return self._load_from_gcs(gcs_uri)

        raise ValueError(
            f"Cannot load data. "
            f"gcs_uri={gcs_uri}, file_id={file_id}"
        )

    def _load_from_firestore(
        self, file_id: str
    ) -> pd.DataFrame:
        """Load CSV stored as base64 in Firestore"""
        from google.cloud import firestore
        db = firestore.Client()
        doc = db.collection(
            "file_storage"
        ).document(file_id).get()
        if not doc.exists:
            raise ValueError(
                f"File '{file_id}' not found in Firestore"
            )
        data = doc.to_dict()
        content = base64.b64decode(data["content"])
        return pd.read_csv(io.BytesIO(content))

    def _load_from_gcs(
        self, gcs_uri: str
    ) -> pd.DataFrame:
        """Load CSV from Google Cloud Storage"""
        from google.cloud import storage
        client = storage.Client()
        uri = gcs_uri.replace("gs://", "")
        bucket_name, blob_path = uri.split("/", 1)
        blob = client.bucket(bucket_name).blob(blob_path)
        return pd.read_csv(
            io.BytesIO(blob.download_as_bytes())
        )

    def audit(
        self,
        gcs_uri: str,
        target_column: str,
        sensitive_features: List[str],
        model_type: str = "auto",
        file_id: str = None
    ) -> Dict[str, Any]:

        # Load data using file_id or gcs_uri
        df = self._load_data(gcs_uri, file_id)

        # Encode categorical columns
        encoders = {}
        df_enc = df.copy()
        for col in df_enc.select_dtypes(
            include=["object"]
        ).columns:
            le = LabelEncoder()
            df_enc[col] = le.fit_transform(
                df_enc[col].astype(str)
            )
            encoders[col] = le

        X = df_enc.drop(columns=[target_column])
        y = df_enc[target_column]

        # Train test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=0.3,
            random_state=42,
            stratify=y
        )

        # Train RandomForest
        model = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            n_jobs=-1
        )
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        # Accuracy
        accuracy = round(
            float(accuracy_score(y_test, y_pred)), 4
        )

        # Fairness metrics per sensitive feature
        fairness_results = []
        for sf in sensitive_features:
            if sf not in X_test.columns:
                continue
            s = X_test[sf].values
            yt = y_test.values

            dpd = self.metrics.demographic_parity_difference(
                y_pred, s
            )
            dir_ = self.metrics.disparate_impact_ratio(
                y_pred, s
            )
            eod = self.metrics.equal_opportunity_difference(
                yt, y_pred, s
            )
            eqo = self.metrics.equalized_odds(
                yt, y_pred, s
            )

            fairness_results.append({
                "sensitive_feature": sf,
                "metrics": [dpd, dir_, eod, eqo]
            })

        # Overall fairness score
        all_metrics = [
            m for sf_r in fairness_results
            for m in sf_r["metrics"]
            if "value" in m
        ]
        overall = self.metrics.overall_fairness_score(
            all_metrics
        )

        # Feature importance top 10
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
            "test_samples": int(len(X_test)),
            "fairness_metrics": fairness_results,
            "overall_score": overall,
            "feature_importance": {
                k: round(float(v), 4)
                for k, v in top_features.items()
            }
        }