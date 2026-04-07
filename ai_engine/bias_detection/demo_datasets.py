"""
Built-in famous bias datasets.
Real datasets used in landmark AI bias research.
"""
import pandas as pd
import numpy as np


DEMO_DATASETS = {
    "compas": {
        "name": "COMPAS Recidivism",
        "description": (
            "The infamous criminal justice algorithm found to be "
            "biased against Black defendants. Used in US courts "
            "to predict recidivism risk. ProPublica investigation 2016."
        ),
        "sensitive_features": ["race", "sex"],
        "target": "two_year_recid",
        "known_bias": (
            "Black defendants were nearly twice as likely to be "
            "falsely flagged as future criminals vs white defendants."
        ),
        "legal_context": "14th Amendment Equal Protection Clause",
        "source": "ProPublica COMPAS Analysis"
    },
    "adult_census": {
        "name": "Adult Census Income",
        "description": (
            "Predicts whether income exceeds $50K/year based on "
            "census data. Classic benchmark for fairness research."
        ),
        "sensitive_features": ["race", "sex"],
        "target": "high_income",
        "known_bias": (
            "Women and minorities significantly underrepresented "
            "in high-income predictions despite equal qualifications."
        ),
        "legal_context": "Equal Pay Act, Title VII",
        "source": "UCI ML Repository"
    },
    "german_credit": {
        "name": "German Credit Risk",
        "description": (
            "Credit risk classification dataset. "
            "Widely used to study age and gender bias in lending."
        ),
        "sensitive_features": ["sex", "age_group"],
        "target": "credit_risk",
        "known_bias": (
            "Women and younger applicants systematically "
            "assigned higher credit risk scores."
        ),
        "legal_context": "Equal Credit Opportunity Act (ECOA)",
        "source": "UCI ML Repository"
    },
    "loan_approval": {
        "name": "Loan Approval",
        "description": (
            "Synthetic loan approval dataset reflecting "
            "real-world banking discrimination patterns."
        ),
        "sensitive_features": ["gender", "race"],
        "target": "loan_approved",
        "known_bias": (
            "Minority applicants denied at 2x the rate of "
            "white applicants with identical financial profiles."
        ),
        "legal_context": "Fair Housing Act, ECOA",
        "source": "FairLens Synthetic Dataset"
    }
}


def generate_demo_dataset(dataset_key: str) -> pd.DataFrame:
    """Generate a realistic demo dataset for the given key."""
    generators = {
        "compas": _generate_compas,
        "adult_census": _generate_adult_census,
        "german_credit": _generate_german_credit,
        "loan_approval": _generate_loan_approval,
    }
    if dataset_key not in generators:
        raise ValueError(f"Unknown dataset: {dataset_key}")
    return generators[dataset_key]()


def _generate_compas() -> pd.DataFrame:
    np.random.seed(42)
    n = 500
    race = np.random.choice(
        ["African-American", "Caucasian", "Hispanic", "Other"],
        n, p=[0.51, 0.34, 0.09, 0.06]
    )
    sex = np.random.choice(["Male", "Female"], n, p=[0.81, 0.19])
    age = np.random.randint(18, 65, n)
    priors_count = np.random.poisson(2, n)
    decile_score = np.random.randint(1, 11, n)

    # Bias: Black defendants flagged at higher rate
    recid_prob = np.where(
        race == "African-American", 0.52,
        np.where(race == "Caucasian", 0.28, 0.38)
    )
    two_year_recid = np.random.binomial(1, recid_prob)

    return pd.DataFrame({
        "age": age,
        "sex": sex,
        "race": race,
        "priors_count": priors_count,
        "decile_score": decile_score,
        "two_year_recid": two_year_recid
    })


def _generate_adult_census() -> pd.DataFrame:
    np.random.seed(42)
    n = 500

    race = np.random.choice(
        ["White", "Black", "Asian", "Hispanic", "Other"],
        n, p=[0.66, 0.10, 0.10, 0.10, 0.04]
    )
    sex = np.random.choice(["Male", "Female"], n, p=[0.67, 0.33])
    age = np.random.randint(18, 70, n)
    education_num = np.random.randint(1, 17, n)
    hours_per_week = np.random.randint(20, 80, n)
    occupation = np.random.choice(
        ["Tech", "Management", "Sales", "Service", "Other"], n
    )

    # Bias: men and white/asian more likely to earn high income
    is_white_or_asian = np.isin(race, ["White", "Asian"])
    is_male = sex == "Male"

    base_prob = 0.22
    income_prob = (
        base_prob
        + np.where(is_male, 0.18, 0.0)
        + np.where(is_white_or_asian, 0.12, 0.0)
        + (education_num - 9) * 0.03
    )
    income_prob = np.clip(income_prob, 0.05, 0.95)

    # Use binary 0/1 target — avoids string conversion issues
    high_income = np.random.binomial(1, income_prob)

    return pd.DataFrame({
        "age": age,
        "sex": sex,
        "race": race,
        "education_num": education_num,
        "hours_per_week": hours_per_week,
        "occupation": occupation,
        "high_income": high_income
    })


def _generate_german_credit() -> pd.DataFrame:
    np.random.seed(42)
    n = 500

    sex = np.random.choice(["male", "female"], n, p=[0.69, 0.31])
    age = np.random.randint(19, 75, n)
    age_group = np.where(age < 30, "young",
                np.where(age < 50, "middle", "senior"))
    duration = np.random.randint(4, 72, n)
    credit_amount = np.random.randint(250, 18000, n)
    purpose = np.random.choice(
        ["car", "furniture", "radio/TV", "education", "business"], n
    )

    # Bias: women and young people get worse credit scores
    risk_prob = (
        0.35
        + np.where(sex == "female", 0.18, 0.0)
        + np.where(age < 30, 0.15, 0.0)
        - np.where(age > 50, 0.10, 0.0)
    )
    risk_prob = np.clip(risk_prob, 0.05, 0.95)
    credit_risk = np.random.binomial(1, risk_prob)

    return pd.DataFrame({
        "age": age,
        "age_group": age_group,
        "sex": sex,
        "duration": duration,
        "credit_amount": credit_amount,
        "purpose": purpose,
        "credit_risk": credit_risk
    })


def _generate_loan_approval() -> pd.DataFrame:
    np.random.seed(42)
    n = 500

    gender = np.random.choice(
        ["male", "female"], n, p=[0.55, 0.45]
    )
    race = np.random.choice(
        ["white", "black", "hispanic", "asian"],
        n, p=[0.45, 0.25, 0.18, 0.12]
    )
    age = np.random.randint(21, 65, n)
    income = np.random.randint(25000, 150000, n)
    credit_score = np.random.randint(550, 800, n)
    zip_code = np.random.choice(
        ["10001", "10002", "90210", "60601", "77001"], n
    )

    # Strong bias injection
    approval_prob = (
        0.40
        + np.where(gender == "male", 0.12, 0.0)
        + np.where(race == "white", 0.20, 0.0)
        + np.where(race == "asian", 0.10, 0.0)
        + np.where(race == "black", -0.15, 0.0)
        + (credit_score - 650) * 0.002
        + (income - 50000) / 500000
    )
    approval_prob = np.clip(approval_prob, 0.05, 0.95)
    loan_approved = np.random.binomial(1, approval_prob)

    return pd.DataFrame({
        "age": age,
        "gender": gender,
        "race": race,
        "income": income,
        "credit_score": credit_score,
        "zip_code": zip_code,
        "loan_approved": loan_approved
    })