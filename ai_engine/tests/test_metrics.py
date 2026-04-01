import numpy as np
import pytest
from bias_detection.metrics import FairnessMetrics


def test_demographic_parity_fair():
    y_pred = np.array([1, 1, 0, 1, 1, 0, 1, 0])
    sensitive = np.array(["A", "A", "A", "A", "B", "B", "B", "B"])
    result = FairnessMetrics.demographic_parity_difference(
        y_pred, sensitive
    )
    assert "value" in result
    assert "is_fair" in result
    assert 0 <= result["value"] <= 1


def test_disparate_impact_ratio():
    y_pred = np.array([1, 1, 1, 1, 0, 0, 1, 0])
    sensitive = np.array(["A", "A", "A", "A", "B", "B", "B", "B"])
    result = FairnessMetrics.disparate_impact_ratio(y_pred, sensitive)
    assert 0 <= result["value"] <= 1


def test_equal_opportunity():
    y_true = np.array([1, 1, 0, 1, 1, 0, 1, 0])
    y_pred = np.array([1, 0, 0, 1, 1, 0, 0, 0])
    sensitive = np.array(["A", "A", "A", "A", "B", "B", "B", "B"])
    result = FairnessMetrics.equal_opportunity_difference(
        y_true, y_pred, sensitive
    )
    assert "value" in result


def test_overall_fairness_score():
    metrics = [
        {"metric": "Demographic Parity Difference", "value": 0.05},
        {"metric": "Disparate Impact Ratio", "value": 0.9},
    ]
    result = FairnessMetrics.overall_fairness_score(metrics)
    assert 0 <= result["score"] <= 100
    assert "label" in result
    assert "color" in result