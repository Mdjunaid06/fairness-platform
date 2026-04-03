import pandas as pd
import numpy as np
import io
import base64
from scipy.stats import chi2_contingency
from typing import Dict, Any, List
from .metrics import FairnessMetrics


class DatasetAnalyzer:

    def __init__(self):
        self.metrics = FairnessMetrics()

    def _load_data(
        self, gcs_uri: str, file_id: str = None
    ) -> pd.DataFrame:
        """Route to correct loader based on URI type"""
        if file_id:
            return self._load_from_firestore(file_id)
        if gcs_uri and gcs_uri.startswith("firestore://"):
            fid = gcs_uri.split("/")[-1]
            return self._load_from_firestore(fid)
        return self._load_from_gcs(gcs_uri)

    def _load_from_firestore(self, file_id: str) -> pd.DataFrame:
        """Load CSV stored as base64 in Firestore"""
        from google.cloud import firestore

        db = firestore.Client()
        doc = db.collection("file_storage").document(file_id).get()

        if not doc.exists:
            raise ValueError(
                f"File {file_id} not found in Firestore"
            )

        data = doc.to_dict()
        content = base64.b64decode(data["content"])
        return pd.read_csv(io.BytesIO(content))

    def _load_from_gcs(self, gcs_uri: str) -> pd.DataFrame:
        """Load CSV from Google Cloud Storage"""
        from google.cloud import storage

        gcs_client = storage.Client()
        uri = gcs_uri.replace("gs://", "")
        bucket_name, blob_path = uri.split("/", 1)
        bucket = gcs_client.bucket(bucket_name)
        blob = bucket.blob(blob_path)
        content = blob.download_as_bytes()
        return pd.read_csv(io.BytesIO(content))

    def analyze(
        self,
        gcs_uri: str,
        target_column: str,
        sensitive_features: List[str],
        file_id: str = None
    ) -> Dict[str, Any]:

        df = self._load_data(gcs_uri, file_id)

        results = {
            "dataset_info": self._get_dataset_info(
                df, target_column
            ),
            "class_imbalance": self._check_class_imbalance(
                df, target_column
            ),
            "demographic_distribution": self._analyze_demographics(
                df, sensitive_features, target_column
            ),
            "proxy_features": self._detect_proxy_features(
                df, sensitive_features
            ),
            "missing_data_bias": self._check_missing_data(
                df, sensitive_features
            ),
            "correlation_analysis": self._correlation_analysis(
                df, sensitive_features, target_column
            ),
        }

        results["bias_summary"] = self._generate_summary(results)
        results["overall_score"] = self._compute_score(results)
        return results

    def _get_dataset_info(
        self, df: pd.DataFrame, target_col: str
    ) -> Dict:
        return {
            "total_rows": len(df),
            "total_columns": len(df.columns),
            "column_names": list(df.columns),
            "target_column": target_col,
            "dtypes": {
                col: str(df[col].dtype) for col in df.columns
            }
        }

    def _check_class_imbalance(
        self, df: pd.DataFrame, target_col: str
    ) -> Dict:
        if target_col not in df.columns:
            return {"error": f"Column '{target_col}' not found"}

        counts = df[target_col].value_counts()
        total = len(df)
        proportions = (counts / total * 100).round(2)
        min_p = proportions.min()
        max_p = proportions.max()
        ratio = round(
            max_p / min_p, 2
        ) if min_p > 0 else float("inf")

        return {
            "value_counts": {
                str(k): int(v) for k, v in counts.items()
            },
            "proportions": {
                str(k): float(v) for k, v in proportions.items()
            },
            "imbalance_ratio": ratio,
            "is_imbalanced": ratio > 1.5,
            "severity": (
                "None" if ratio <= 1.5
                else "Mild" if ratio <= 3
                else "Moderate" if ratio <= 5
                else "Severe"
            ),
            "recommendation": (
                "No action needed" if ratio <= 1.5
                else "Apply SMOTE or class weighting"
            )
        }

    def _analyze_demographics(
        self,
        df: pd.DataFrame,
        sensitive_features: List[str],
        target_col: str
    ) -> Dict:
        results = {}
        for feature in sensitive_features:
            if feature not in df.columns:
                continue
            group_stats = {}
            for val in df[feature].dropna().unique():
                grp = df[df[feature] == val]
                dist = grp[target_col].value_counts(
                    normalize=True
                ).round(4)
                group_stats[str(val)] = {
                    "count": len(grp),
                    "percentage": round(
                        len(grp) / len(df) * 100, 2
                    ),
                    "target_distribution": {
                        str(k): float(v)
                        for k, v in dist.items()
                    }
                }
            results[feature] = group_stats
        return results

    def _detect_proxy_features(
        self,
        df: pd.DataFrame,
        sensitive_features: List[str]
    ) -> Dict:
        numeric_cols = df.select_dtypes(
            include=[np.number]
        ).columns.tolist()
        proxy_results = {}

        for sensitive in sensitive_features:
            if sensitive not in df.columns:
                continue
            proxies = []
            for col in numeric_cols:
                if col == sensitive:
                    continue
                try:
                    corr = abs(df[col].corr(
                        pd.to_numeric(
                            df[sensitive], errors="coerce"
                        )
                    ))
                    if not np.isnan(corr) and corr > 0.5:
                        proxies.append({
                            "feature": col,
                            "correlation": round(float(corr), 4),
                            "risk": (
                                "High" if corr > 0.7 else "Medium"
                            )
                        })
                except Exception:
                    pass
            proxy_results[sensitive] = sorted(
                proxies,
                key=lambda x: x["correlation"],
                reverse=True
            )
        return proxy_results

    def _check_missing_data(
        self,
        df: pd.DataFrame,
        sensitive_features: List[str]
    ) -> Dict:
        results = {}
        for feature in sensitive_features:
            if feature not in df.columns:
                continue
            missing_by_group = {}
            for val in df[feature].dropna().unique():
                grp = df[df[feature] == val]
                rate = grp.isnull().mean().mean()
                missing_by_group[str(val)] = round(
                    float(rate * 100), 2
                )

            values = list(missing_by_group.values())
            results[feature] = {
                "missing_rates_by_group": missing_by_group,
                "disparate_missing": (
                    max(values) - min(values) > 5
                    if len(values) >= 2 else False
                )
            }
        return results

    def _correlation_analysis(
        self,
        df: pd.DataFrame,
        sensitive_features: List[str],
        target_col: str
    ) -> Dict:
        results = {}
        for feature in sensitive_features:
            if feature not in df.columns:
                continue
            try:
                ct = pd.crosstab(df[feature], df[target_col])
                chi2, p_val, dof, _ = chi2_contingency(ct)
                results[feature] = {
                    "chi2_statistic": round(float(chi2), 4),
                    "p_value": round(float(p_val), 6),
                    "degrees_of_freedom": int(dof),
                    "statistically_significant": bool(p_val < 0.05),
                    "interpretation": (
                        f"Significant association between "
                        f"'{feature}' and '{target_col}' "
                        f"— potential bias"
                        if p_val < 0.05
                        else "No significant association found"
                    )
                }
            except Exception as e:
                results[feature] = {"error": str(e)}
        return results

    def _generate_summary(self, results: Dict) -> List[Dict]:
        issues = []

        ci = results.get("class_imbalance", {})
        if ci.get("is_imbalanced"):
            issues.append({
                "type": "Class Imbalance",
                "severity": ci.get("severity", "Unknown"),
                "message": (
                    f"Imbalance ratio is "
                    f"{ci.get('imbalance_ratio')}:1"
                ),
                "action": ci.get("recommendation", "")
            })

        for feature, proxies in results.get(
            "proxy_features", {}
        ).items():
            for p in proxies:
                issues.append({
                    "type": "Proxy Feature",
                    "severity": p["risk"],
                    "message": (
                        f"'{p['feature']}' correlates with "
                        f"'{feature}' at {p['correlation']}"
                    ),
                    "action": (
                        f"Consider removing '{p['feature']}'"
                    )
                })

        for feature, corr in results.get(
            "correlation_analysis", {}
        ).items():
            if corr.get("statistically_significant"):
                issues.append({
                    "type": "Statistical Bias",
                    "severity": "High",
                    "message": corr.get("interpretation", ""),
                    "action": (
                        f"Investigate relationship between "
                        f"'{feature}' and target"
                    )
                })
        return issues

    def _compute_score(self, results: Dict) -> Dict:
        deductions = 0
        severity_map = {
            "Mild": 10,
            "Moderate": 20,
            "Severe": 30
        }
        ci = results.get("class_imbalance", {})
        deductions += severity_map.get(
            ci.get("severity", ""), 0
        )

        for feature, proxies in results.get(
            "proxy_features", {}
        ).items():
            deductions += sum(
                15 if p["risk"] == "High" else 8
                for p in proxies
            )

        score = max(0, 100 - deductions)
        return {
            "score": score,
            "label": (
                "Fair" if score >= 80
                else "Moderate Issues" if score >= 60
                else "Severe Issues"
            ),
            "color": (
                "#22c55e" if score >= 80
                else "#f59e0b" if score >= 60
                else "#ef4444"
            )
        }