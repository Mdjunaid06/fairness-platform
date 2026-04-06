"""
Intelligent column detector.
Automatically identifies sensitive features,
target columns, proxy features and data types
from column names and sample values.
"""
import pandas as pd
import numpy as np
import io
import base64
import re
from typing import Dict, Any, List


# ── SENSITIVE FEATURE KEYWORDS ────────────────────────────────
SENSITIVE_PATTERNS = {
    "gender": {
        "keywords": [
            "gender", "sex", "male", "female",
            "woman", "man", "nonbinary", "transgender"
        ],
        "values": ["male", "female", "m", "f", "man", "woman"],
        "risk": "High",
        "law": "Title VII, Equal Pay Act"
    },
    "race": {
        "keywords": [
            "race", "ethnicity", "ethnic", "nationality",
            "origin", "ancestry", "tribe", "caste"
        ],
        "values": [
            "white", "black", "asian", "hispanic",
            "latino", "african", "caucasian", "indigenous"
        ],
        "risk": "High",
        "law": "Civil Rights Act, ECOA"
    },
    "age": {
        "keywords": [
            "age", "dob", "birth", "born", "year",
            "birthdate", "birthyear", "dateofbirth"
        ],
        "values": [],
        "risk": "High",
        "law": "Age Discrimination in Employment Act"
    },
    "religion": {
        "keywords": [
            "religion", "faith", "church", "mosque",
            "temple", "belief", "denomination", "sect"
        ],
        "values": [
            "christian", "muslim", "jewish", "hindu",
            "buddhist", "atheist", "catholic"
        ],
        "risk": "High",
        "law": "Title VII"
    },
    "disability": {
        "keywords": [
            "disability", "disabled", "handicap",
            "condition", "impairment", "disorder", "health"
        ],
        "values": ["yes", "no", "true", "false"],
        "risk": "High",
        "law": "Americans with Disabilities Act"
    },
    "geography": {
        "keywords": [
            "zip", "zipcode", "postal", "postcode",
            "neighborhood", "district", "region",
            "county", "ward", "area_code"
        ],
        "values": [],
        "risk": "Medium",
        "law": "Fair Housing Act (redlining)"
    },
    "name": {
        "keywords": [
            "name", "firstname", "lastname", "surname",
            "fullname", "first_name", "last_name"
        ],
        "values": [],
        "risk": "Medium",
        "law": "Implicit name-race association bias"
    },
    "language": {
        "keywords": [
            "language", "dialect", "accent", "tongue",
            "native_language", "primary_language"
        ],
        "values": [
            "english", "spanish", "french",
            "mandarin", "arabic", "hindi"
        ],
        "risk": "Medium",
        "law": "National origin discrimination"
    },
    "socioeconomic": {
        "keywords": [
            "income", "salary", "wage", "wealth",
            "poverty", "class", "education", "degree"
        ],
        "values": [],
        "risk": "Medium",
        "law": "Disparate impact on protected classes"
    },
    "marital_status": {
        "keywords": [
            "marital", "married", "single", "divorced",
            "widowed", "spouse", "family_status"
        ],
        "values": [
            "married", "single", "divorced",
            "widowed", "separated"
        ],
        "risk": "Medium",
        "law": "ECOA (credit discrimination)"
    },
}

# ── TARGET COLUMN KEYWORDS ────────────────────────────────────
TARGET_PATTERNS = [
    "approved", "approval", "denied", "accept",
    "reject", "hired", "fired", "admitted",
    "outcome", "result", "decision", "label",
    "target", "y", "class", "predicted",
    "score", "risk", "recidivism", "default",
    "fraud", "churn", "loan", "credit",
    "diagnosis", "disease", "convicted"
]

# ── ID COLUMN KEYWORDS (exclude these) ────────────────────────
ID_PATTERNS = [
    "id", "_id", "uuid", "key", "index",
    "row", "record", "number", "num", "no"
]


class ColumnDetector:

    def detect(
        self,
        gcs_uri: str = None,
        file_id: str = None,
        csv_content: str = None
    ) -> Dict[str, Any]:
        """
        Main detection method.
        Loads data and analyzes all columns.
        """
        if csv_content:
            df = pd.read_csv(io.StringIO(csv_content))
        elif file_id:
            df = self._load_from_firestore(file_id)
        elif gcs_uri and gcs_uri.startswith("firestore://"):
            fid = gcs_uri.split("/")[-1]
            df = self._load_from_firestore(fid)
        else:
            raise ValueError("No data source provided")

        return self._analyze_columns(df)

    def _load_from_firestore(
        self, file_id: str
    ) -> pd.DataFrame:
        from google.cloud import firestore
        db = firestore.Client()
        doc = db.collection(
            "file_storage"
        ).document(file_id).get()
        if not doc.exists:
            raise ValueError(f"File {file_id} not found")
        data = doc.to_dict()
        content = base64.b64decode(data["content"])
        return pd.read_csv(io.BytesIO(content))

    def _analyze_columns(
        self, df: pd.DataFrame
    ) -> Dict[str, Any]:
        """Analyze all columns and categorize them."""

        columns_analysis = []
        sensitive_features = []
        suggested_targets = []
        id_columns = []

        for col in df.columns:
            analysis = self._analyze_single_column(df, col)
            columns_analysis.append(analysis)

            if analysis["is_sensitive"]:
                sensitive_features.append({
                    "column": col,
                    "category": analysis["sensitive_category"],
                    "confidence": analysis["confidence"],
                    "risk": analysis["risk_level"],
                    "law": analysis["applicable_law"],
                    "reason": analysis["detection_reason"]
                })

            if analysis["is_target_candidate"]:
                suggested_targets.append({
                    "column": col,
                    "confidence": analysis["target_confidence"],
                    "reason": analysis["target_reason"],
                    "unique_values": analysis["unique_values"],
                    "distribution": analysis["value_distribution"]
                })

            if analysis["is_id_column"]:
                id_columns.append(col)

        # Sort by confidence
        sensitive_features.sort(
            key=lambda x: x["confidence"], reverse=True
        )
        suggested_targets.sort(
            key=lambda x: x["confidence"], reverse=True
        )

        return {
            "total_columns": len(df.columns),
            "total_rows": len(df),
            "column_names": list(df.columns),
            "sensitive_features": sensitive_features,
            "suggested_targets": suggested_targets,
            "id_columns": id_columns,
            "columns_analysis": columns_analysis,
            "auto_config": {
                "recommended_target": (
                    suggested_targets[0]["column"]
                    if suggested_targets else None
                ),
                "recommended_sensitive": [
                    f["column"]
                    for f in sensitive_features
                    if f["confidence"] >= 0.7
                ],
                "confidence_note": (
                    "High confidence detection. "
                    "Please verify before running analysis."
                )
            },
            "dataset_preview": df.head(5).to_dict(
                orient="records"
            )
        }

    def _analyze_single_column(
        self, df: pd.DataFrame, col: str
    ) -> Dict[str, Any]:
        """Deep analysis of a single column."""

        col_lower = col.lower().strip()
        col_clean = re.sub(r'[^a-z0-9]', '', col_lower)

        sample_values = df[col].dropna().head(100)
        unique_vals = df[col].nunique()
        dtype = str(df[col].dtype)

        # Get value distribution
        val_dist = {}
        if unique_vals <= 20:
            val_dist = df[col].value_counts(
                normalize=True
            ).round(3).to_dict()
            val_dist = {str(k): float(v) for k, v in val_dist.items()}

        # Check if ID column
        is_id = any(
            pattern in col_lower
            for pattern in ID_PATTERNS
        ) and unique_vals == len(df)

        # Check sensitive patterns
        sensitive_result = self._check_sensitive(
            col_lower, col_clean, sample_values
        )

        # Check target patterns
        target_result = self._check_target(
            col_lower, col_clean, df[col], unique_vals
        )

        return {
            "column": col,
            "dtype": dtype,
            "unique_values": int(unique_vals),
            "null_count": int(df[col].isnull().sum()),
            "null_percentage": round(
                df[col].isnull().mean() * 100, 2
            ),
            "value_distribution": val_dist,
            "is_id_column": is_id,
            "is_sensitive": sensitive_result["is_sensitive"],
            "sensitive_category": sensitive_result["category"],
            "confidence": sensitive_result["confidence"],
            "risk_level": sensitive_result["risk"],
            "applicable_law": sensitive_result["law"],
            "detection_reason": sensitive_result["reason"],
            "is_target_candidate": target_result["is_target"],
            "target_confidence": target_result["confidence"],
            "target_reason": target_result["reason"],
        }

    def _check_sensitive(
        self,
        col_lower: str,
        col_clean: str,
        sample_values: pd.Series
    ) -> Dict:
        """Check if column matches sensitive patterns."""

        best_match = {
            "is_sensitive": False,
            "category": None,
            "confidence": 0.0,
            "risk": "None",
            "law": "",
            "reason": ""
        }

        sample_str = " ".join(
            str(v).lower() for v in sample_values.head(20)
        )

        for category, pattern in SENSITIVE_PATTERNS.items():
            confidence = 0.0
            reasons = []

            # Check column name keywords
            for keyword in pattern["keywords"]:
                if keyword in col_lower:
                    confidence += 0.6
                    reasons.append(
                        f"column name contains '{keyword}'"
                    )
                    break
                if keyword in col_clean:
                    confidence += 0.5
                    reasons.append(
                        f"column name matches '{keyword}'"
                    )
                    break

            # Check sample values
            if pattern["values"]:
                value_matches = sum(
                    1 for v in pattern["values"]
                    if v in sample_str
                )
                if value_matches >= 2:
                    confidence += 0.4
                    reasons.append(
                        f"values match {category} patterns"
                    )
                elif value_matches == 1:
                    confidence += 0.2
                    reasons.append(
                        f"some values suggest {category}"
                    )

            confidence = min(confidence, 1.0)

            if confidence > best_match["confidence"]:
                best_match = {
                    "is_sensitive": confidence >= 0.4,
                    "category": category,
                    "confidence": round(confidence, 2),
                    "risk": pattern["risk"],
                    "law": pattern["law"],
                    "reason": " + ".join(reasons)
                }

        return best_match

    def _check_target(
        self,
        col_lower: str,
        col_clean: str,
        series: pd.Series,
        unique_vals: int
    ) -> Dict:
        """Check if column is likely the target variable."""

        confidence = 0.0
        reasons = []

        # Check name patterns
        for pattern in TARGET_PATTERNS:
            if pattern in col_lower:
                confidence += 0.5
                reasons.append(
                    f"name suggests outcome: '{pattern}'"
                )
                break

        # Binary columns are strong candidates
        if unique_vals == 2:
            confidence += 0.3
            reasons.append("binary column (2 unique values)")

        # Check if values are 0/1
        try:
            vals = series.dropna().unique()
            if set(vals).issubset({0, 1, True, False}):
                confidence += 0.2
                reasons.append("values are 0/1 (binary label)")
        except Exception:
            pass

        # Small number of unique values
        if 2 <= unique_vals <= 5:
            confidence += 0.1
            reasons.append(
                f"small number of unique values ({unique_vals})"
            )

        confidence = min(confidence, 1.0)

        return {
            "is_target": confidence >= 0.4,
            "confidence": round(confidence, 2),
            "reason": " + ".join(reasons) if reasons else ""
        }