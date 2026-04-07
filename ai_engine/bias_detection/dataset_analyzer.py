import pandas as pd
import numpy as np
import io
import base64
from scipy.stats import chi2_contingency
from typing import Dict, Any, List, Optional
from .metrics import FairnessMetrics


class DatasetAnalyzer:

    def __init__(self):
        self.metrics = FairnessMetrics()

    def _load_data(
        self,
        gcs_uri: str,
        file_id: str = None,
        df_override: pd.DataFrame = None
    ) -> pd.DataFrame:
        """Route to correct loader based on source type"""
        if df_override is not None:
            return df_override
        if file_id and str(file_id).strip():
            return self._load_from_firestore(str(file_id).strip())
        if gcs_uri and gcs_uri.startswith("firestore://"):
            fid = gcs_uri.split("/")[-1]
            return self._load_from_firestore(fid)
        if gcs_uri and gcs_uri.startswith("gs://"):
            return self._load_from_gcs(gcs_uri)
        raise ValueError(
            f"Cannot load data. gcs_uri={gcs_uri}, file_id={file_id}"
        )

    def _load_from_firestore(self, file_id: str) -> pd.DataFrame:
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
        file_id: str = None,
        df_override: pd.DataFrame = None
    ) -> Dict[str, Any]:

        df = self._load_data(gcs_uri, file_id, df_override)

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
            "intersectional_analysis": self._intersectional_analysis(
                df, sensitive_features, target_column
            ),
            "counterfactual_analysis": self._counterfactual_analysis(
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

    def _intersectional_analysis(
        self,
        df: pd.DataFrame,
        sensitive_features: List[str],
        target_col: str
    ) -> Dict[str, Any]:
        """
        Intersectional bias analysis.
        Examines combinations of sensitive features together.
        e.g. Black women vs White men vs Black men vs White women
        """
        if len(sensitive_features) < 2:
            return {
                "available": False,
                "reason": "Need at least 2 sensitive features"
            }

        results = {}

        for i in range(len(sensitive_features)):
            for j in range(i + 1, len(sensitive_features)):
                sf1 = sensitive_features[i]
                sf2 = sensitive_features[j]

                if sf1 not in df.columns or sf2 not in df.columns:
                    continue

                pair_key = f"{sf1} × {sf2}"

                try:
                    groups = df.groupby(
                        [sf1, sf2]
                    )[target_col].agg(["mean", "count"]).reset_index()
                    groups.columns = [
                        sf1, sf2, "approval_rate", "count"
                    ]
                    groups = groups[groups["count"] >= 3]

                    if len(groups) == 0:
                        continue

                    group_list = []
                    for _, row in groups.iterrows():
                        group_list.append({
                            "group": f"{row[sf1]} + {row[sf2]}",
                            "approval_rate": round(
                                float(row["approval_rate"]), 4
                            ),
                            "count": int(row["count"]),
                            "percentage": round(
                                float(row["count"]) / len(df) * 100, 2
                            )
                        })

                    group_list.sort(
                        key=lambda x: x["approval_rate"],
                        reverse=True
                    )

                    if len(group_list) >= 2:
                        best = group_list[0]
                        worst = group_list[-1]
                        disparity = round(
                            best["approval_rate"] -
                            worst["approval_rate"], 4
                        )
                        ratio = round(
                            best["approval_rate"] /
                            worst["approval_rate"], 4
                        ) if worst["approval_rate"] > 0 else 9999.0

                        results[pair_key] = {
                            "groups": group_list,
                            "best_group": best,
                            "worst_group": worst,
                            "disparity": disparity,
                            "ratio": ratio,
                            "is_biased": disparity > 0.1,
                            "severity": (
                                "Critical" if disparity > 0.4
                                else "High" if disparity > 0.25
                                else "Moderate" if disparity > 0.1
                                else "Low"
                            ),
                            "insight": (
                                f"'{worst['group']}' has only "
                                f"{worst['approval_rate']*100:.1f}%"
                                f" approval vs '{best['group']}' at "
                                f"{best['approval_rate']*100:.1f}%"
                                f" — a {ratio:.1f}x disparity"
                            )
                        }
                except Exception as e:
                    results[pair_key] = {"error": str(e)}

        return {
            "available": True,
            "intersections": results,
            "total_intersections_analyzed": len(results),
            "biased_intersections": sum(
                1 for v in results.values()
                if v.get("is_biased")
            )
        }

    def _counterfactual_analysis(
        self,
        df: pd.DataFrame,
        sensitive_features: List[str],
        target_col: str
    ) -> Dict[str, Any]:
        """
        Counterfactual fairness test.
        For each sensitive feature flip its value and check
        if the target distribution changes significantly.
        High flip rate = direct evidence of discrimination.
        """
        results = {}

        for sf in sensitive_features:
            if sf not in df.columns:
                continue

            unique_vals = df[sf].dropna().unique()
            if len(unique_vals) != 2:
                results[sf] = {
                    "available": False,
                    "reason": (
                        f"Requires binary feature "
                        f"(found {len(unique_vals)} unique values)"
                    )
                }
                continue

            val_a, val_b = unique_vals[0], unique_vals[1]

            group_a = df[df[sf] == val_a][target_col]
            group_b = df[df[sf] == val_b][target_col]

            rate_a = float(group_a.mean())
            rate_b = float(group_b.mean())

            flip_rate = abs(rate_a - rate_b)
            affected_estimate = int(flip_rate * len(df))

            results[sf] = {
                "available": True,
                "group_a": str(val_a),
                "group_b": str(val_b),
                "rate_group_a": round(rate_a, 4),
                "rate_group_b": round(rate_b, 4),
                "counterfactual_flip_rate": round(flip_rate, 4),
                "affected_individuals": affected_estimate,
                "affected_percentage": round(flip_rate * 100, 1),
                "is_biased": flip_rate > 0.1,
                "severity": (
                    "Critical" if flip_rate > 0.4
                    else "High" if flip_rate > 0.25
                    else "Moderate" if flip_rate > 0.1
                    else "Low"
                ),
                "evidence": (
                    f"Changing only '{sf}' from '{val_a}' to "
                    f"'{val_b}' would affect the outcome for "
                    f"~{affected_estimate} individuals "
                    f"({flip_rate*100:.1f}% of cases). "
                    f"This is direct evidence of "
                    f"{sf}-based discrimination."
                    if flip_rate > 0.1 else
                    f"Changing '{sf}' has minimal effect — "
                    f"no significant {sf}-based discrimination detected."
                )
            }

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

        for feature, cf in results.get(
            "counterfactual_analysis", {}
        ).items():
            if cf.get("available") and cf.get("is_biased"):
                issues.append({
                    "type": "Counterfactual Discrimination",
                    "severity": cf.get("severity", "High"),
                    "message": (
                        f"Changing '{feature}' alone affects "
                        f"{cf.get('affected_percentage')}% of outcomes"
                    ),
                    "action": (
                        f"Remove or reweight '{feature}' "
                        f"in training data"
                    )
                })

        inter = results.get("intersectional_analysis", {})
        if inter.get("available") and inter.get("biased_intersections", 0) > 0:
            for pair, data in inter.get("intersections", {}).items():
                if data.get("is_biased"):
                    issues.append({
                        "type": "Intersectional Bias",
                        "severity": data.get("severity", "High"),
                        "message": data.get("insight", ""),
                        "action": (
                            "Apply intersectional fairness "
                            "constraints during model training"
                        )
                    })

        return issues

    def _compute_score(self, results: Dict) -> Dict:
        deductions = 0
        severity_map = {
            "Mild": 10,
            "Moderate": 20,
            "Severe": 30,
            "High": 15,
            "Critical": 25
        }

        ci = results.get("class_imbalance", {})
        deductions += severity_map.get(ci.get("severity", ""), 0)

        for feature, proxies in results.get(
            "proxy_features", {}
        ).items():
            deductions += sum(
                15 if p["risk"] == "High" else 8
                for p in proxies
            )

        for feature, cf in results.get(
            "counterfactual_analysis", {}
        ).items():
            if cf.get("available") and cf.get("is_biased"):
                deductions += severity_map.get(
                    cf.get("severity", ""), 0
                )

        inter = results.get("intersectional_analysis", {})
        if inter.get("available"):
            for pair, data in inter.get("intersections", {}).items():
                if data.get("is_biased"):
                    deductions += severity_map.get(
                        data.get("severity", ""), 0
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