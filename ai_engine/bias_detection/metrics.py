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