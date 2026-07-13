"""
Graph Generation Service
========================
Generates two chart types:
1. angle_vs_time  – single session angle timeseries
2. progress_chart – multi-session average angle comparison
"""

import os
import uuid
import matplotlib
matplotlib.use("Agg")   # non-interactive backend for servers
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
from typing import List, Dict, Optional

OUTPUT_DIR = "outputs/graphs"


def _save(fig, prefix: str) -> str:
    """Save figure and return relative path."""
    filename = f"{prefix}_{uuid.uuid4().hex[:8]}.png"
    path     = os.path.join(OUTPUT_DIR, filename)
    fig.savefig(path, dpi=150, bbox_inches="tight",
                facecolor=fig.get_facecolor())
    plt.close(fig)
    return path


def generate_angle_vs_time(
    angle_series: List[Dict],
    target_angle: float,
    avg_angle: float,
    patient_name: str,
    session_id: int,
) -> str:
    """
    Line chart: Angle (°) vs Time (s) for a single session.
    Highlights target angle reference line.
    """
    times  = [p["t"]     for p in angle_series]
    angles = [p["angle"] for p in angle_series]

    # ── Smooth with rolling average ────────────────────────────────────────────
    window = max(1, len(angles) // 20)
    smoothed = np.convolve(angles, np.ones(window) / window, mode="same")

    fig, ax = plt.subplots(figsize=(10, 4))
    fig.patch.set_facecolor("#0d1117")
    ax.set_facecolor("#161b22")

    # Raw signal (faded)
    ax.plot(times, angles, color="#30a0c0", alpha=0.3, linewidth=1, label="Raw angle")
    # Smoothed
    ax.plot(times, smoothed, color="#64CCC5", linewidth=2.5, label="Smoothed angle")
    # Target line
    ax.axhline(target_angle, color="#f0883e", linewidth=1.5,
               linestyle="--", label=f"Target: {target_angle}°")
    # Average line
    ax.axhline(avg_angle, color="#58a6ff", linewidth=1.5,
               linestyle=":", label=f"Session avg: {avg_angle:.1f}°")

    ax.set_xlabel("Time (seconds)", color="#8b949e", fontsize=10)
    ax.set_ylabel("Elbow Angle (°)", color="#8b949e", fontsize=10)
    ax.set_title(f"Session #{session_id} – {patient_name} | Angle vs Time",
                 color="#e6edf3", fontsize=12, fontweight="bold", pad=12)

    ax.tick_params(colors="#8b949e")
    for spine in ax.spines.values():
        spine.set_edgecolor("#30363d")

    ax.legend(facecolor="#21262d", edgecolor="#30363d",
              labelcolor="#e6edf3", fontsize=9)
    ax.grid(True, color="#21262d", linestyle="--", alpha=0.6)

    plt.tight_layout()
    return _save(fig, f"session_{session_id}_angle")


def generate_progress_chart(
    sessions: List[Dict],
    patient_name: str,
    target_angle: float,
) -> str:
    """
    Bar + line chart: Average angle per session (multi-session progress).
    Color-codes bars by injury status.
    """
    STATUS_COLORS = {
        "improving":       "#3fb950",
        "stable":          "#58a6ff",
        "needs_attention": "#f85149",
        "first_session":   "#8b949e",
    }

    ids     = [s["id"]          for s in sessions]
    avgs    = [s["avg_angle"]   for s in sessions]
    statuses= [s["injury_status"] for s in sessions]
    dates   = [s["created_at"][:10] for s in sessions]
    colors  = [STATUS_COLORS.get(st, "#8b949e") for st in statuses]

    fig, ax = plt.subplots(figsize=(max(8, len(sessions) * 1.2), 5))
    fig.patch.set_facecolor("#0d1117")
    ax.set_facecolor("#161b22")

    x = np.arange(len(ids))
    bars = ax.bar(x, avgs, color=colors, width=0.55, zorder=3, alpha=0.85)

    # Target reference
    ax.axhline(target_angle, color="#f0883e", linewidth=2,
               linestyle="--", label=f"Target: {target_angle}°", zorder=4)

    # Trend line
    if len(avgs) > 1:
        z = np.polyfit(x, avgs, 1)
        p = np.poly1d(z)
        ax.plot(x, p(x), color="#e3b341", linewidth=2,
                linestyle="-", label="Trend", zorder=5, alpha=0.8)

    ax.set_xticks(x)
    ax.set_xticklabels([f"S{i}\n{d}" for i, d in zip(ids, dates)],
                       color="#8b949e", fontsize=8)
    ax.set_ylabel("Average Angle (°)", color="#8b949e", fontsize=10)
    ax.set_title(f"Progress Overview – {patient_name}",
                 color="#e6edf3", fontsize=13, fontweight="bold", pad=12)

    ax.tick_params(colors="#8b949e")
    for spine in ax.spines.values():
        spine.set_edgecolor("#30363d")
    ax.grid(True, axis="y", color="#21262d", linestyle="--", alpha=0.6, zorder=0)

    # Legend patches for status colors
    legend_patches = [
        mpatches.Patch(color=c, label=s.replace("_", " ").title())
        for s, c in STATUS_COLORS.items()
    ]
    ax.legend(handles=legend_patches + [
        plt.Line2D([0],[0], color="#f0883e", lw=2, linestyle="--", label=f"Target {target_angle}°"),
        plt.Line2D([0],[0], color="#e3b341", lw=2, label="Trend"),
    ], facecolor="#21262d", edgecolor="#30363d", labelcolor="#e6edf3", fontsize=8)

    plt.tight_layout()
    return _save(fig, f"progress_{sessions[-1]['patient_id']}")