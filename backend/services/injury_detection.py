"""
Injury Detection Service
========================
Compares the current session's average angle with the most recent
previous session to classify rehabilitation progress.

Rules:
  improvement > 5°  → IMPROVING
  decrease    > 5°  → NEEDS_ATTENTION
  otherwise        → STABLE
  no previous      → FIRST_SESSION
"""

import math
from typing import List, Dict, Optional, Tuple
from models.models import InjuryStatus


def calculate_metrics(
    angle_series: List[Dict],
    target_angle: float
) -> Dict:
    """
    Compute all session statistics from raw angle timeseries.

    Args:
        angle_series : list of {t, angle} dicts
        target_angle : the clinically prescribed target ROM

    Returns:
        dict with avg, max, min, accuracy, consistency
    """
    if not angle_series:
        return {
            "avg_angle": 0.0, "max_angle": 0.0, "min_angle": 0.0,
            "accuracy": 0.0, "consistency": 0.0, "frame_count": 0,
        }

    angles = [p["angle"] for p in angle_series]
    n      = len(angles)
    avg    = sum(angles) / n
    mx     = max(angles)
    mn     = min(angles)

    # Accuracy: percentage closeness to target (capped 0-100)
    accuracy = max(0.0, 100.0 - abs(avg - target_angle))

    # Consistency: inverse of normalised std deviation (higher = more consistent)
    variance    = sum((a - avg) ** 2 for a in angles) / n
    std_dev     = math.sqrt(variance)
    consistency = max(0.0, 100.0 - std_dev)   # score, not raw std

    return {
        "avg_angle":    round(avg, 2),
        "max_angle":    round(mx, 2),
        "min_angle":    round(mn, 2),
        "accuracy":     round(accuracy, 2),
        "consistency":  round(consistency, 2),
        "std_dev":      round(std_dev, 2),
        "frame_count":  n,
    }


def detect_injury_status(
    current_avg: float,
    previous_avg: Optional[float]
) -> Tuple[InjuryStatus, float]:
    """
    Compare current vs previous session average angle.

    Returns:
        (InjuryStatus, delta_degrees)
    """
    if previous_avg is None:
        return InjuryStatus.FIRST_SESSION, 0.0

    delta = current_avg - previous_avg   # positive = improvement in ROM

    if delta > 5.0:
        return InjuryStatus.IMPROVING, round(delta, 2)
    elif delta < -5.0:
        return InjuryStatus.NEEDS_ATTENTION, round(delta, 2)
    else:
        return InjuryStatus.STABLE, round(delta, 2)


def get_status_message(status: InjuryStatus, delta: float) -> str:
    """Human-readable status for PDF/email."""
    messages = {
        InjuryStatus.FIRST_SESSION:    "Baseline session recorded. Future sessions will track progress.",
        InjuryStatus.IMPROVING:        f"✅ Excellent progress! Range of motion improved by {abs(delta):.1f}°.",
        InjuryStatus.STABLE:           f"➡️  Condition stable. Difference from last session: {delta:+.1f}°.",
        InjuryStatus.NEEDS_ATTENTION:  f"⚠️  Range of motion decreased by {abs(delta):.1f}°. Consult your doctor.",
    }
    return messages.get(status, "Status unknown.")