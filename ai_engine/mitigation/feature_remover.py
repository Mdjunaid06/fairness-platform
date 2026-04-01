import pandas as pd
import numpy as np
import io
from google.cloud import storage
from typing import Dict, Any, List


class FeatureRemover:

    def __init__(self):
        self.gcs_client = storage.Client()

    def mitigate(
        self,
        gcs_uri: str,
        target_column: str,
        sensitive_features: List[str]
    ) -> Dict[str, Any]:

        df = self._load_from_gcs(gcs_uri)
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
        output_uri = gcs_uri.replace(".csv", "_debiased.csv")
        self._save_to_gcs(df_clean, output_uri)

        return {
            "strategy": "Feature Removal",
            "removed_sensitive_features": sensitive_features,
            "removed_proxy_features": proxy_features,
            "total_removed": len(cols_to_drop),
            "columns_before": len(df.columns),
            "columns_after": len(df_clean.columns),
            "output_gcs_uri": output_uri
        }

    def _load_from_gcs(self, gcs_uri: str) -> pd.DataFrame:
        uri = gcs_uri.replace("gs://", "")
        bucket_name, blob_path = uri.split("/", 1)
        blob = self.gcs_client.bucket(bucket_name).blob(blob_path)
        return pd.read_csv(io.BytesIO(blob.download_as_bytes()))

    def _save_to_gcs(self, df: pd.DataFrame, gcs_uri: str):
        uri = gcs_uri.replace("gs://", "")
        bucket_name, blob_path = uri.split("/", 1)
        blob = self.gcs_client.bucket(bucket_name).blob(blob_path)
        blob.upload_from_string(
            df.to_csv(index=False).encode("utf-8"),
            content_type="text/csv"
        )