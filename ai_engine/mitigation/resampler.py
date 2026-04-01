import pandas as pd
import numpy as np
import io
from google.cloud import storage
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
from typing import Dict, Any, List


class DataResampler:

    def __init__(self):
        self.gcs_client = storage.Client()

    def mitigate(
        self,
        gcs_uri: str,
        target_column: str,
        sensitive_features: List[str]
    ) -> Dict[str, Any]:

        df = self._load_from_gcs(gcs_uri)

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

        pipeline = Pipeline([
            ("over", SMOTE(
                sampling_strategy="minority", random_state=42
            )),
            ("under", RandomUnderSampler(
                sampling_strategy="majority", random_state=42
            ))
        ])

        X_res, y_res = pipeline.fit_resample(X, y)

        after_dist = {
            str(k): int(v)
            for k, v in pd.Series(y_res).value_counts().items()
        }

        df_res = pd.DataFrame(X_res, columns=X.columns)
        df_res[target_column] = y_res

        # Decode back to original labels
        for col, le in encoders.items():
            if col in df_res.columns:
                df_res[col] = le.inverse_transform(
                    df_res[col].astype(int)
                )

        output_uri = gcs_uri.replace(".csv", "_mitigated.csv")
        self._save_to_gcs(df_res, output_uri)

        return {
            "strategy": "SMOTE + RandomUnderSampler",
            "before_distribution": before_dist,
            "after_distribution": after_dist,
            "rows_before": len(df),
            "rows_after": len(df_res),
            "output_gcs_uri": output_uri,
            "improvement": "Class balance improved"
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