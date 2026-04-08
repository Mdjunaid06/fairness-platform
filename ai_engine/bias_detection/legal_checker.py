"""
Legal framework compliance checker.
Checks if detected bias violates specific laws and regulations.
"""
from typing import Dict, Any, List


LEGAL_FRAMEWORKS = {
    "ECOA": {
        "name": "Equal Credit Opportunity Act",
        "jurisdiction": "United States",
        "applies_to": ["loan", "credit", "financial", "bank", "mortgage"],
        "protected_classes": ["race", "sex", "gender", "age", "religion",
                              "national_origin", "marital_status"],
        "threshold": 0.8,
        "metric": "disparate_impact_ratio",
        "penalty": "Up to $10,000 per violation + class action",
        "description": (
            "Prohibits credit discrimination based on race, color, "
            "religion, national origin, sex, marital status, or age."
        )
    },
    "EEOC_80_RULE": {
        "name": "EEOC 80% Rule (Uniform Guidelines)",
        "jurisdiction": "United States",
        "applies_to": ["hiring", "employment", "job", "recruit", "salary"],
        "protected_classes": ["race", "sex", "gender", "age",
                              "national_origin", "religion"],
        "threshold": 0.8,
        "metric": "disparate_impact_ratio",
        "penalty": "EEOC complaint, back pay, reinstatement",
        "description": (
            "Selection rate for any protected group must be at least "
            "80% of the rate for the highest-scoring group."
        )
    },
    "FAIR_HOUSING_ACT": {
        "name": "Fair Housing Act",
        "jurisdiction": "United States",
        "applies_to": ["housing", "rent", "mortgage", "zip", "neighborhood"],
        "protected_classes": ["race", "sex", "gender", "religion",
                              "national_origin", "disability", "zip_code"],
        "threshold": 0.8,
        "metric": "disparate_impact_ratio",
        "penalty": "Up to $100,000 per violation",
        "description": (
            "Prohibits discrimination in housing sales, rentals, "
            "and financing. ZIP code as proxy for race = redlining."
        )
    },
    "EU_AI_ACT": {
        "name": "EU AI Act (2024)",
        "jurisdiction": "European Union",
        "applies_to": ["all"],
        "protected_classes": ["race", "sex", "gender", "age", "religion",
                              "disability", "sexual_orientation"],
        "threshold": 0.9,
        "metric": "demographic_parity_difference",
        "penalty": "Up to €30M or 6% of global turnover",
        "description": (
            "High-risk AI systems must undergo conformity assessment "
            "and maintain bias audit documentation."
        )
    },
    "ACA_SECTION_1557": {
        "name": "ACA Section 1557",
        "jurisdiction": "United States",
        "applies_to": ["medical", "health", "clinical", "diagnosis",
                       "treatment", "insurance"],
        "protected_classes": ["race", "sex", "gender", "age",
                              "national_origin", "disability"],
        "threshold": 0.8,
        "metric": "disparate_impact_ratio",
        "penalty": "Loss of federal funding, civil lawsuits",
        "description": (
            "Prohibits discrimination in health programs receiving "
            "federal financial assistance."
        )
    },
    "GDPR_ARTICLE_22": {
        "name": "GDPR Article 22",
        "jurisdiction": "European Union",
        "applies_to": ["all"],
        "protected_classes": ["race", "religion", "political_opinion",
                              "sex", "sexual_orientation", "disability"],
        "threshold": 0.9,
        "metric": "demographic_parity_difference",
        "penalty": "Up to €20M or 4% of global turnover",
        "description": (
            "Right not to be subject to solely automated decisions "
            "with significant effects on individuals."
        )
    },
}


class LegalChecker:

    def check(
        self,
        analysis_results: Dict[str, Any],
        sensitive_features: List[str],
        context_keywords: List[str] = None
    ) -> Dict[str, Any]:
        """
        Check which legal frameworks apply and whether they are violated.
        """
        if context_keywords is None:
            context_keywords = []

        applicable_laws = self._find_applicable_laws(
            sensitive_features, context_keywords
        )
        violations = []
        warnings = []
        compliant = []

        for law_key, law in applicable_laws.items():
            result = self._check_law(
                law_key, law, analysis_results, sensitive_features
            )
            if result["status"] == "VIOLATION":
                violations.append(result)
            elif result["status"] == "WARNING":
                warnings.append(result)
            else:
                compliant.append(result)

        risk_level = (
            "Critical" if violations else
            "Medium" if warnings else
            "Low"
        )

        return {
            "applicable_laws": len(applicable_laws),
            "violations": violations,
            "warnings": warnings,
            "compliant": compliant,
            "risk_level": risk_level,
            "risk_color": (
                "#ef4444" if risk_level == "Critical"
                else "#f59e0b" if risk_level == "Medium"
                else "#22c55e"
            ),
            "summary": self._generate_legal_summary(
                violations, warnings, compliant
            )
        }

    def _find_applicable_laws(
        self,
        sensitive_features: List[str],
        context_keywords: List[str]
    ) -> Dict:
        applicable = {}
        all_keywords = (
            [sf.lower() for sf in sensitive_features] +
            [kw.lower() for kw in context_keywords]
        )

        for law_key, law in LEGAL_FRAMEWORKS.items():
            # Check if applies_to matches context
            applies = law["applies_to"] == ["all"]
            if not applies:
                for keyword in all_keywords:
                    for applies_word in law["applies_to"]:
                        if applies_word in keyword or keyword in applies_word:
                            applies = True
                            break

            # Check if protected classes overlap
            has_protected = any(
                any(pc in sf.lower() or sf.lower() in pc
                    for pc in law["protected_classes"])
                for sf in sensitive_features
            )

            if applies and has_protected:
                applicable[law_key] = law

        # Always include EU AI Act for completeness
        if "EU_AI_ACT" not in applicable:
            applicable["EU_AI_ACT"] = LEGAL_FRAMEWORKS["EU_AI_ACT"]

        return applicable

    def _check_law(
        self,
        law_key: str,
        law: Dict,
        results: Dict,
        sensitive_features: List[str]
    ) -> Dict:
        """Check if a specific law is violated."""

        violations_found = []

        # Check counterfactual evidence
        cf = results.get("counterfactual_analysis", {})
        for sf, data in cf.items():
            if data.get("available") and data.get("is_biased"):
                flip_rate = data.get("counterfactual_flip_rate", 0)
                if flip_rate > (1 - law["threshold"]):
                    violations_found.append(
                        f"{sf}: {data.get('affected_percentage')}% "
                        f"of outcomes change when only {sf} changes"
                    )

        # Check class imbalance as proxy for disparate impact
        ci = results.get("class_imbalance", {})
        if ci.get("severity") in ("Severe", "Moderate"):
            violations_found.append(
                f"Class imbalance ratio {ci.get('imbalance_ratio')}:1 "
                f"suggests disparate impact"
            )

        # Check intersectional bias
        inter = results.get("intersectional_analysis", {})
        if inter.get("available"):
            for pair, data in inter.get("intersections", {}).items():
                if data.get("is_biased") and data.get("disparity", 0) > 0.2:
                    violations_found.append(
                        f"Intersectional group {data.get('worst_group', {}).get('group', '')} "
                        f"has {data.get('disparity', 0)*100:.1f}% disparity"
                    )

        if violations_found:
            status = "VIOLATION"
        elif results.get("bias_summary"):
            status = "WARNING"
        else:
            status = "COMPLIANT"

        return {
            "law": law_key,
            "name": law["name"],
            "jurisdiction": law["jurisdiction"],
            "status": status,
            "status_color": (
                "#ef4444" if status == "VIOLATION"
                else "#f59e0b" if status == "WARNING"
                else "#22c55e"
            ),
            "description": law["description"],
            "penalty": law["penalty"],
            "violations_found": violations_found,
            "protected_classes": law["protected_classes"],
            "threshold": law["threshold"],
            "recommendation": (
                f"Immediate remediation required before deployment. "
                f"Consider legal consultation."
                if status == "VIOLATION" else
                f"Monitor closely. Document bias mitigation steps."
                if status == "WARNING" else
                f"Currently compliant. Maintain monitoring."
            )
        }

    def _generate_legal_summary(
        self,
        violations: List,
        warnings: List,
        compliant: List
    ) -> str:
        if violations:
            law_names = ", ".join(v["name"] for v in violations[:2])
            return (
                f"⚠️ CRITICAL: This system may violate {law_names}. "
                f"Deployment without remediation creates significant "
                f"legal and regulatory risk."
            )
        elif warnings:
            return (
                f"⚡ WARNING: {len(warnings)} applicable laws require "
                f"monitoring. Document bias mitigation steps before deployment."
            )
        else:
            return (
                f"✅ No clear legal violations detected across "
                f"{len(compliant)} applicable frameworks. "
                f"Continue monitoring after deployment."
            )