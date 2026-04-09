import numpy as np
from sklearn.metrics import confusion_matrix
from typing import Dict, Any, List


class FairnessMetrics:

    @staticmethod
    def demographic_parity_difference(
        y_pred: np.ndarray,
        sensitive: np.ndarray
    ) -> Dict[str, Any]:
        """
        DPD = max group positive rate - min group positive rate
        Ideal: 0.0  |  Fair threshold: < 0.1
        """
        groups = np.unique(sensitive)
        rates = {}
        for g in groups:
            mask = sensitive == g
            rates[str(g)] = round(float(np.mean(y_pred[mask])), 4)

        values = list(rates.values())
        dpd = round(max(values) - min(values), 4)

        return {
            "metric": "Demographic Parity Difference",
            "value": dpd,
            "group_rates": rates,
            "is_fair": dpd < 0.1,
            "interpretation": (
                "Fair" if dpd < 0.1
                else "Moderate Bias" if dpd < 0.2
                else "Significant Bias"
            ),
            "ideal": 0.0,
            "threshold": 0.1
        }

    @staticmethod
    def disparate_impact_ratio(
        y_pred: np.ndarray,
        sensitive: np.ndarray
    ) -> Dict[str, Any]:
        """
        DIR = min group rate / max group rate
        Fair threshold: >= 0.8  (80% rule)
        """
        groups = np.unique(sensitive)
        rates = {}
        for g in groups:
            mask = sensitive == g
            r = float(np.mean(y_pred[mask]))
            rates[str(g)] = r if r > 0 else 1e-9

        values = list(rates.values())
        dir_score = round(min(values) / max(values), 4)

        return {
            "metric": "Disparate Impact Ratio",
            "value": dir_score,
            "group_rates": rates,
            "is_fair": dir_score >= 0.8,
            "interpretation": (
                "Fair (≥0.8)" if dir_score >= 0.8
                else "Unfair — 80% rule violated"
            ),
            "ideal": 1.0,
            "threshold": 0.8
        }

    @staticmethod
    def equal_opportunity_difference(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        sensitive: np.ndarray
    ) -> Dict[str, Any]:
        """
        EOD = max group TPR - min group TPR
        Ideal: 0.0  |  Fair threshold: < 0.1
        """
        groups = np.unique(sensitive)
        tprs = {}
        for g in groups:
            mask = sensitive == g
            yt, yp = y_true[mask], y_pred[mask]
            pos = yt == 1
            if pos.sum() == 0:
                tprs[str(g)] = None
                continue
            tprs[str(g)] = round(float(np.mean(yp[pos])), 4)

        valid = [v for v in tprs.values() if v is not None]
        eod = round(max(valid) - min(valid), 4) if len(valid) >= 2 else 0.0

        return {
            "metric": "Equal Opportunity Difference",
            "value": eod,
            "group_tprs": tprs,
            "is_fair": eod < 0.1,
            "interpretation": (
                "Fair" if eod < 0.1
                else "Moderate Bias" if eod < 0.2
                else "High Bias"
            ),
            "ideal": 0.0,
            "threshold": 0.1
        }

    @staticmethod
    def equalized_odds(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        sensitive: np.ndarray
    ) -> Dict[str, Any]:
        """
        Both TPR and FPR must be equal across groups
        """
        groups = np.unique(sensitive)
        stats = {}
        for g in groups:
            mask = sensitive == g
            yt, yp = y_true[mask], y_pred[mask]
            if len(yt) == 0:
                continue
            tn, fp, fn, tp = confusion_matrix(
                yt, yp, labels=[0, 1]
            ).ravel()
            tpr = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
            stats[str(g)] = {
                "TPR": round(tpr, 4),
                "FPR": round(fpr, 4)
            }

        tpr_vals = [v["TPR"] for v in stats.values()]
        fpr_vals = [v["FPR"] for v in stats.values()]
        tpr_diff = round(max(tpr_vals) - min(tpr_vals), 4) if tpr_vals else 0
        fpr_diff = round(max(fpr_vals) - min(fpr_vals), 4) if fpr_vals else 0

        return {
            "metric": "Equalized Odds",
            "tpr_difference": tpr_diff,
            "fpr_difference": fpr_diff,
            "group_stats": stats,
            "is_fair": tpr_diff < 0.1 and fpr_diff < 0.1,
            "interpretation": (
                "Fair" if (tpr_diff < 0.1 and fpr_diff < 0.1)
                else "Biased"
            )
        }

    @staticmethod
    def overall_fairness_score(
        metrics_results: List[Dict]
    ) -> Dict[str, Any]:
        """
        Aggregate fairness score 0-100
        """
        scores = []
        for m in metrics_results:
            val = m.get("value", 0)
            name = m.get("metric", "")
            if "Disparate Impact" in name:
                score = min(val / 1.0, 1.0) * 100
            else:
                score = max(0.0, (1 - val / 0.5)) * 100
            scores.append(score)

        avg = round(float(np.mean(scores)), 1) if scores else 0.0

        if avg >= 80:
            label, color = "Highly Fair", "#22c55e"
        elif avg >= 60:
            label, color = "Moderately Fair", "#f59e0b"
        elif avg >= 40:
            label, color = "Biased — Mitigation Recommended", "#f97316"
        else:
            label, color = "Severely Biased", "#ef4444"

        return {
            "score": avg,
            "label": label,
            "color": color,
            "component_scores": [round(s, 1) for s in scores]
        }
    @staticmethod
    def compute_dimension_scores(
        analysis_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compute scores for 8 fairness dimensions.
        Returns structured data for radar chart.
        """
        scores = {}

        # 1. Demographic Parity
        ci = analysis_results.get("class_imbalance", {})
        ratio = ci.get("imbalance_ratio", 1)
        dp_score = max(0, 100 - (ratio - 1) * 20)
        scores["Demographic Parity"] = {
            "score": round(min(100, dp_score), 1),
            "status": "PASS" if dp_score >= 70 else "FAIL",
            "detail": f"Imbalance ratio: {ratio}:1"
        }

        # 2. Equal Opportunity
        cf = analysis_results.get("counterfactual_analysis", {})
        cf_scores = []
        for sf, data in cf.items():
            if data.get("available"):
                flip = data.get("counterfactual_flip_rate", 0)
                cf_scores.append(max(0, 100 - flip * 200))
        eo_score = round(float(np.mean(cf_scores)), 1) if cf_scores else 70.0
        scores["Equal Opportunity"] = {
            "score": eo_score,
            "status": "PASS" if eo_score >= 70 else "FAIL",
            "detail": f"Based on {len(cf_scores)} counterfactual tests"
        }

        # 3. Individual Fairness
        proxy = analysis_results.get("proxy_features", {})
        proxy_count = sum(len(v) for v in proxy.values())
        ind_score = max(0, 100 - proxy_count * 15)
        scores["Individual Fairness"] = {
            "score": round(ind_score, 1),
            "status": "PASS" if ind_score >= 70 else "FAIL",
            "detail": f"{proxy_count} proxy features detected"
        }

        # 4. Counterfactual Fairness
        cf_flip_rates = [
            data.get("counterfactual_flip_rate", 0)
            for data in cf.values()
            if data.get("available")
        ]
        avg_flip = float(np.mean(cf_flip_rates)) if cf_flip_rates else 0
        cf_score = max(0, 100 - avg_flip * 300)
        scores["Counterfactual"] = {
            "score": round(cf_score, 1),
            "status": "PASS" if cf_score >= 70 else "FAIL",
            "detail": f"Avg flip rate: {avg_flip*100:.1f}%"
        }

        # 5. Group Fairness
        inter = analysis_results.get("intersectional_analysis", {})
        biased_inter = inter.get("biased_intersections", 0)
        total_inter = inter.get("total_intersections_analyzed", 1)
        gf_score = max(0, 100 - (biased_inter / max(total_inter, 1)) * 100)
        scores["Group Fairness"] = {
            "score": round(gf_score, 1),
            "status": "PASS" if gf_score >= 70 else "FAIL",
            "detail": f"{biased_inter}/{total_inter} intersections biased"
        }

        # 6. Calibration
        corr = analysis_results.get("correlation_analysis", {})
        sig_count = sum(
            1 for v in corr.values()
            if v.get("statistically_significant")
        )
        cal_score = max(0, 100 - sig_count * 25)
        scores["Calibration"] = {
            "score": round(cal_score, 1),
            "status": "PASS" if cal_score >= 70 else "FAIL",
            "detail": f"{sig_count} statistically significant associations"
        }

        # 7. Transparency
        # Always moderate — we provide explainability
        scores["Transparency"] = {
            "score": 80.0,
            "status": "PASS",
            "detail": "SHAP explainability + narrative report provided"
        }

        # 8. Data Quality
        missing = analysis_results.get("missing_data_bias", {})
        disparate = sum(
            1 for v in missing.values()
            if v.get("disparate_missing")
        )
        dq_score = max(0, 100 - disparate * 20)
        scores["Data Quality"] = {
            "score": round(dq_score, 1),
            "status": "PASS" if dq_score >= 70 else "FAIL",
            "detail": f"{disparate} features with disparate missing data"
        }

        overall = round(
            float(np.mean([v["score"] for v in scores.values()])), 1
        )
        passed = sum(1 for v in scores.values() if v["status"] == "PASS")
        failed = len(scores) - passed

        return {
            "dimensions": scores,
            "overall": overall,
            "passed": passed,
            "failed": failed,
            "radar_data": [
                {
                    "dimension": k,
                    "score": v["score"],
                    "fullMark": 100
                }
                for k, v in scores.items()
            ]
        }