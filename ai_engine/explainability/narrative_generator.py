"""
Generates human-readable narrative bias reports.
Reads like a professional audit document.
"""
from typing import Dict, Any, List


class NarrativeGenerator:

    def generate(
        self,
        analysis_result: Dict[str, Any],
        sensitive_features: List[str],
        target_column: str,
        legal_result: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate a full narrative report."""

        score = analysis_result.get(
            "overall_score", {}
        ).get("score", 0)
        issues = analysis_result.get("bias_summary", [])
        ci = analysis_result.get("class_imbalance", {})
        cf = analysis_result.get("counterfactual_analysis", {})
        inter = analysis_result.get(
            "intersectional_analysis", {}
        )
        demo_info = analysis_result.get("demo_info", {})

        sections = []

        # Executive Summary
        sections.append({
            "title": "Executive Summary",
            "content": self._executive_summary(
                score, issues, sensitive_features,
                target_column, demo_info
            )
        })

        # Critical Findings
        critical = self._critical_findings(
            issues, cf, inter, sensitive_features
        )
        if critical:
            sections.append({
                "title": "Critical Findings",
                "content": critical
            })

        # Counterfactual Evidence
        cf_narrative = self._counterfactual_narrative(cf)
        if cf_narrative:
            sections.append({
                "title": "Counterfactual Evidence",
                "content": cf_narrative
            })

        # Intersectional Analysis
        inter_narrative = self._intersectional_narrative(inter)
        if inter_narrative:
            sections.append({
                "title": "Intersectional Analysis",
                "content": inter_narrative
            })

        # Legal Risk
        if legal_result:
            sections.append({
                "title": "Legal Risk Assessment",
                "content": self._legal_narrative(legal_result)
            })

        # Recommendations
        sections.append({
            "title": "Recommended Actions",
            "content": self._recommendations(
                issues, score, cf, inter
            )
        })

        return {
            "fairness_score": score,
            "score_label": analysis_result.get(
                "overall_score", {}
            ).get("label", ""),
            "total_issues": len(issues),
            "sections": sections,
            "one_line_verdict": self._one_line_verdict(
                score, issues, legal_result
            )
        }

    def _executive_summary(
        self,
        score: float,
        issues: List,
        sensitive_features: List[str],
        target_column: str,
        demo_info: Dict
    ) -> str:
        severity = (
            "CRITICAL BIAS" if score < 40
            else "SIGNIFICANT BIAS" if score < 60
            else "MODERATE CONCERNS" if score < 80
            else "GENERALLY FAIR"
        )

        dataset_name = demo_info.get("name", "this dataset")

        text = (
            f"Analysis of {dataset_name} reveals {severity} "
            f"with an overall fairness score of {score}/100. "
        )

        if sensitive_features:
            text += (
                f"The analysis examined {len(sensitive_features)} "
                f"sensitive attribute{'s' if len(sensitive_features) > 1 else ''} "
                f"({', '.join(sensitive_features)}) "
                f"against the target outcome '{target_column}'. "
            )

        if issues:
            critical_count = sum(
                1 for i in issues
                if i.get("severity") in ("High", "Critical")
            )
            if critical_count > 0:
                text += (
                    f"{critical_count} critical issue"
                    f"{'s were' if critical_count > 1 else ' was'} "
                    f"identified requiring immediate attention. "
                )

        if demo_info.get("known_bias"):
            text += (
                f"Note: {demo_info['known_bias']}"
            )

        return text

    def _critical_findings(
        self,
        issues: List,
        cf: Dict,
        inter: Dict,
        sensitive_features: List[str]
    ) -> str:
        findings = []
        n = 1

        for issue in issues:
            if issue.get("severity") in ("High", "Critical", "Severe"):
                findings.append(
                    f"{n}. {issue['type']}: {issue['message']}"
                )
                n += 1

        for sf, data in cf.items():
            if data.get("available") and data.get("is_biased"):
                pct = data.get("affected_percentage", 0)
                findings.append(
                    f"{n}. Direct Discrimination Evidence: "
                    f"Changing only '{sf}' alters outcomes for "
                    f"{pct}% of individuals — statistically "
                    f"significant proof of {sf}-based bias."
                )
                n += 1

        if inter.get("available"):
            for pair, data in inter.get(
                "intersections", {}
            ).items():
                if data.get("severity") in ("Critical", "High"):
                    findings.append(
                        f"{n}. Intersectional Bias: {data.get('insight', '')}"
                    )
                    n += 1

        return "\n\n".join(findings) if findings else ""

    def _counterfactual_narrative(self, cf: Dict) -> str:
        narratives = []

        for sf, data in cf.items():
            if not data.get("available"):
                continue

            group_a = data.get("group_a", "Group A")
            group_b = data.get("group_b", "Group B")
            rate_a = data.get("rate_group_a", 0) * 100
            rate_b = data.get("rate_group_b", 0) * 100
            pct = data.get("affected_percentage", 0)
            affected = data.get("affected_individuals", 0)

            if data.get("is_biased"):
                narratives.append(
                    f"For '{sf}': A counterfactual test was conducted "
                    f"by comparing identical profiles differing only in "
                    f"the '{sf}' attribute. "
                    f"'{group_a}' had a {rate_a:.1f}% outcome rate "
                    f"versus '{group_b}' at {rate_b:.1f}%. "
                    f"This {pct:.1f}% difference affects approximately "
                    f"{affected} individuals and constitutes direct "
                    f"evidence of discriminatory treatment."
                )
            else:
                narratives.append(
                    f"For '{sf}': No significant counterfactual "
                    f"difference was found. '{group_a}' ({rate_a:.1f}%) "
                    f"and '{group_b}' ({rate_b:.1f}%) received "
                    f"similar outcomes."
                )

        return "\n\n".join(narratives)

    def _intersectional_narrative(self, inter: Dict) -> str:
        if not inter.get("available"):
            return ""

        narratives = []
        for pair, data in inter.get("intersections", {}).items():
            if data.get("error"):
                continue
            best = data.get("best_group", {})
            worst = data.get("worst_group", {})
            if best and worst:
                narratives.append(
                    f"Examining {pair}: "
                    f"The best-performing group '{best.get('group', '')}' "
                    f"achieved a {best.get('approval_rate', 0)*100:.1f}% "
                    f"outcome rate, while the worst-performing group "
                    f"'{worst.get('group', '')}' achieved only "
                    f"{worst.get('approval_rate', 0)*100:.1f}% — "
                    f"a {data.get('ratio', 1):.1f}x disparity. "
                    f"This intersectional gap cannot be explained by "
                    f"either attribute alone and indicates compound discrimination."
                )

        return "\n\n".join(narratives)

    def _legal_narrative(self, legal_result: Dict) -> str:
        lines = [legal_result.get("summary", "")]

        if legal_result.get("violations"):
            lines.append(
                f"\nPotential violations ({len(legal_result['violations'])}):"
            )
            for v in legal_result["violations"]:
                lines.append(
                    f"• {v['name']} ({v['jurisdiction']}): "
                    f"{v['penalty']}"
                )

        return "\n".join(lines)

    def _recommendations(
        self,
        issues: List,
        score: float,
        cf: Dict,
        inter: Dict
    ) -> str:
        recs = []
        n = 1

        if score < 60:
            recs.append(
                f"{n}. IMMEDIATE: Do not deploy this model. "
                f"Significant bias must be remediated first."
            )
            n += 1

        # From counterfactual
        for sf, data in cf.items():
            if data.get("available") and data.get("is_biased"):
                recs.append(
                    f"{n}. Remove or reweight '{sf}' from training data. "
                    f"This feature shows direct discriminatory impact."
                )
                n += 1

        # From issues
        unique_actions = set()
        for issue in issues:
            action = issue.get("action", "")
            if action and action not in unique_actions:
                unique_actions.add(action)
                recs.append(f"{n}. {action}")
                n += 1

        # General
        recs.append(
            f"{n}. Implement ongoing bias monitoring after deployment."
        )
        n += 1
        recs.append(
            f"{n}. Document all bias mitigation steps for regulatory compliance."
        )

        return "\n\n".join(recs)

    def _one_line_verdict(
        self,
        score: float,
        issues: List,
        legal_result: Dict = None
    ) -> str:
        if score >= 80:
            return (
                "✅ This system appears generally fair. "
                "Continue monitoring after deployment."
            )
        elif score >= 60:
            return (
                "⚡ Moderate bias detected. "
                "Mitigation recommended before deployment."
            )
        elif score >= 40:
            return (
                "⚠️ Significant bias detected. "
                "Do not deploy without remediation."
            )
        else:
            return (
                "🚨 Critical bias detected. "
                "This system should not be deployed. "
                "Immediate remediation required."
            )