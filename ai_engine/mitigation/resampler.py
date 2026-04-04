import pandas as pd
import numpy as np
import io
import base64
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
from typing import Dict, Any, List


class DataResampler:

    def _load_data(self, gcs_uri: str) -> pd.DataFrame:
        """Route to correct loader based on URI type"""
        if gcs_uri.startswith("firestore://"):
            file_id = gcs_uri.split("/")[-1]
            return self._load_from_firestore(file_id)
        return self._load_from_gcs(gcs_uri)

    def _load_from_firestore(self, file_id: str) -> pd.DataFrame:
        """Load CSV stored as base64 in Firestore"""
        from google.cloud import firestore
        db = firestore.Client()
        doc = db.collection("file_storage").document(file_id).get()
        if not doc.exists:
            raise ValueError(f"File {file_id} not found in Firestore")
        data = doc.to_dict()
        content = base64.b64decode(data["content"])
        return pd.read_csv(io.BytesIO(content))

    def _load_from_gcs(self, gcs_uri: str) -> pd.DataFrame:
        """Load CSV from Google Cloud Storage"""
        from google.cloud import storage
        client = storage.Client()
        uri = gcs_uri.replace("gs://", "")
        bucket_name, blob_path = uri.split("/", 1)
        blob = client.bucket(bucket_name).blob(blob_path)
        return pd.read_csv(io.BytesIO(blob.download_as_bytes()))

    def _save_to_firestore(
        self,
        df: pd.DataFrame,
        original_uri: str
    ) -> str:
        """Save mitigated CSV back to Firestore as base64"""
        from google.cloud import firestore
        db = firestore.Client()
        csv_bytes = df.to_csv(index=False).encode("utf-8")
        b64_content = base64.b64encode(csv_bytes).decode("utf-8")
        doc_ref = db.collection("file_storage").add({
            "fileName": "mitigated_dataset.csv",
            "contentType": "text/csv",
            "content": b64_content,
            "sizeBytes": len(csv_bytes),
            "isMitigated": True,
            "originalUri": original_uri,
        })
        return f"firestore://file_storage/{doc_ref[1].id}"

    def mitigate(
        self,
        gcs_uri: str,
        target_column: str,
        sensitive_features: List[str]
    ) -> Dict[str, Any]:

        df = self._load_data(gcs_uri)

        # Encode categoricals
        encoders = {}
        df_enc = df.copy()
        for col in df_enc.select_dtypes(include=["object"]).columns:
            le = LabelEncoder()
            df_enc[col] = le.fit_transform(df_enc[col].astype(str))
            encoders[col] = le

        X = df_enc.drop(columns=[target_column])
        y = df_enc[target_column]

        before_dist = {
            str(k): int(v)
            for k, v in y.value_counts().items()
        }

        # Check if enough samples for SMOTE
        minority_count = int(y.value_counts().min())
        n_neighbors = min(5, minority_count - 1)

        if n_neighbors < 1:
            return {
                "strategy": "SMOTE skipped",
                "reason": (
                    f"Too few minority samples ({minority_count}). "
                    f"Need at least 2."
                ),
                "before_distribution": before_dist,
                "after_distribution": before_dist,
                "rows_before": len(df),
                "rows_after": len(df),
                "output_gcs_uri": gcs_uri,
                "improvement": (
                    "Upload a larger dataset with more samples "
                    "to apply SMOTE"
                )
            }

        try:
            pipeline = Pipeline([
                ("over", SMOTE(
                    sampling_strategy="minority",
                    random_state=42,
                    k_neighbors=n_neighbors
                )),
                ("under", RandomUnderSampler(
                    sampling_strategy="majority",
                    random_state=42
                ))
            ])

            X_res, y_res = pipeline.fit_resample(X, y)

        except Exception as e:
            return {
                "strategy": "SMOTE failed",
                "reason": str(e),
                "before_distribution": before_dist,
                "after_distribution": before_dist,
                "rows_before": len(df),
                "rows_after": len(df),
                "output_gcs_uri": gcs_uri,
                "improvement": "Resampling could not be applied"
            }

        after_dist = {
            str(k): int(v)
            for k, v in pd.Series(y_res).value_counts().items()
        }

        # Rebuild dataframe
        df_res = pd.DataFrame(X_res, columns=X.columns)
        df_res[target_column] = y_res

        # Decode back to original labels
        for col, le in encoders.items():
            if col in df_res.columns:
                df_res[col] = le.inverse_transform(
                    df_res[col].astype(int)
                )

        # Save mitigated file
        output_uri = self._save_to_firestore(df_res, gcs_uri)

        return {
            "strategy": "SMOTE + RandomUnderSampler",
            "before_distribution": before_dist,
            "after_distribution": after_dist,
            "rows_before": int(len(df)),
            "rows_after": int(len(df_res)),
            "output_gcs_uri": output_uri,
            "improvement": "Class balance improved successfully",
            "k_neighbors_used": n_neighbors
        }