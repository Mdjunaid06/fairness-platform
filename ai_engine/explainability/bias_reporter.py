from typing import Dict, Any, List


class BiasReporter:

    def generate_report(
        self, analysis_result: Dict
    ) -> Dict[str, Any]:

        issues = analysis_result.get("bias_summary", [])
        score = analysis_result.get("overall_score", {})

        return {
            "title": "Bias Analysis Report",
            "overall_score": score,
            "total_issues": len(issues),
            "critical_issues": [
                i for i in issues
                if i.get("severity") in ("High", "Severe")
            ],
            "moderate_issues": [
                i for i in issues
                if i.get("severity") in ("Medium", "Moderate")
            ],
            "low_issues": [
                i for i in issues
                if i.get("severity") in ("Low", "Mild")
            ],
            "all_issues": issues,
            "recommendations": self._build_recommendations(issues),
        }

    def _build_recommendations(
        self, issues: List[Dict]
    ) -> List[str]:
        recs = []
        for issue in issues:
            action = issue.get("action", "")
            if action and action not in recs:
                recs.append(action)
        return recs