import pandas as pd
import numpy as np
import io
import base64
from typing import Dict, Any, List


class FeatureRemover:

    def _load_data(self, gcs_uri: str) -> pd.DataFrame:
        if gcs_uri.startswith("firestore://"):
            file_id = gcs_uri.split("/")[-1]
            return self._load_from_firestore(file_id)
        return self._load_from_gcs(gcs_uri)

    def _load_from_firestore(self, file_id: str) -> pd.DataFrame:
        from google.cloud import firestore
        db = firestore.Client()
        doc = db.collection("file_storage").document(file_id).get()
        if not doc.exists:
            raise ValueError(f"File {file_id} not found")
        data = doc.to_dict()
        content = base64.b64decode(data["content"])
        return pd.read_csv(io.BytesIO(content))

    def _load_from_gcs(self, gcs_uri: str) -> pd.DataFrame:
        from google.cloud import storage
        client = storage.Client()
        uri = gcs_uri.replace("gs://", "")
        bucket_name, blob_path = uri.split("/", 1)
        blob = client.bucket(bucket_name).blob(blob_path)
        return pd.read_csv(io.BytesIO(blob.download_as_bytes()))

    def _save_to_firestore(
        self, df: pd.DataFrame, original_uri: str
    ) -> str:
        from google.cloud import firestore
        db = firestore.Client()
        csv_bytes = df.to_csv(index=False).encode("utf-8")
        b64_content = base64.b64encode(csv_bytes).decode("utf-8")
        doc_ref = db.collection("file_storage").add({
            "fileName": "debiased_dataset.csv",
            "contentType": "text/csv",
            "content": b64_content,
            "sizeBytes": len(csv_bytes),
            "isDebiased": True,
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
        numeric_cols = df.select_dtypes(
            include=[np.number]
        ).columns.tolist()

        proxy_features = []
        for sf in sensitive_features:
            if sf not in df.columns:
                continue
            for col in numeric_cols:
                if col in (sf, target_column):
                    continue
                try:
                    corr = abs(df[col].corr(
                        pd.to_numeric(df[sf], errors="coerce")
                    ))
                    if not np.isnan(corr) and corr > 0.5:
                        proxy_features.append(col)
                except Exception:
                    pass

        proxy_features = list(set(proxy_features))
        cols_to_drop = [
            c for c in sensitive_features + proxy_features
            if c in df.columns
        ]

        df_clean = df.drop(columns=cols_to_drop)
        output_uri = self._save_to_firestore(df_clean, gcs_uri)

        return {
            "strategy": "Feature Removal",
            "removed_sensitive_features": sensitive_features,
            "removed_proxy_features": proxy_features,
            "total_removed": len(cols_to_drop),
            "columns_before": len(df.columns),
            "columns_after": len(df_clean.columns),
            "output_gcs_uri": output_uri
        }