"""
PDF Report Generation Service
==============================
Generates a professional A4 PDF with:
  - Header with logo/branding
  - Patient details
  - Session metrics table
  - Injury status with color coding
  - Graph image (angle vs time)
  - Progress graph
  - Doctor notes section
"""

import os
import uuid
from datetime import datetime
from typing import Dict, Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image as RLImage, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

OUTPUT_DIR = "outputs/reports"

# ── Color palette ──────────────────────────────────────────────────────────────
NAVY    = colors.HexColor("#04364A")
OCEAN   = colors.HexColor("#176B87")
TEAL    = colors.HexColor("#64CCC5")
MINT    = colors.HexColor("#DAFFFB")
GREEN   = colors.HexColor("#3fb950")
RED     = colors.HexColor("#f85149")
AMBER   = colors.HexColor("#e3b341")
GRAY    = colors.HexColor("#8b949e")
LIGHT   = colors.HexColor("#f0f6fc")

STATUS_COLORS = {
    "improving":       GREEN,
    "stable":          OCEAN,
    "needs_attention": RED,
    "first_session":   GRAY,
}


def _build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle("ReportTitle",
        fontSize=22, textColor=NAVY, fontName="Helvetica-Bold",
        alignment=TA_LEFT, spaceAfter=4))
    styles.add(ParagraphStyle("SectionHead",
        fontSize=13, textColor=OCEAN, fontName="Helvetica-Bold",
        spaceBefore=14, spaceAfter=6,
        borderPad=4, borderColor=TEAL, borderWidth=0))
    styles.add(ParagraphStyle("BodySmall",
        fontSize=9, textColor=colors.HexColor("#444"), fontName="Helvetica",
        spaceAfter=3))
    styles.add(ParagraphStyle("Metric",
        fontSize=11, textColor=NAVY, fontName="Helvetica-Bold",
        alignment=TA_CENTER))
    styles.add(ParagraphStyle("MetricLabel",
        fontSize=8, textColor=GRAY, fontName="Helvetica",
        alignment=TA_CENTER))
    styles.add(ParagraphStyle("StatusText",
        fontSize=12, fontName="Helvetica-Bold",
        alignment=TA_CENTER))
    styles.add(ParagraphStyle("DoctorNote",
        fontSize=10, textColor=colors.HexColor("#222"),
        fontName="Helvetica", leading=16))
    return styles


def generate_pdf_report(
    patient: Dict,
    session: Dict,
    graph_path: Optional[str],
    progress_path: Optional[str],
    status_message: str,
) -> str:
    """
    Build the full PDF and return its file path.
    """
    filename = f"report_patient{patient['id']}_session{session['id']}_{uuid.uuid4().hex[:6]}.pdf"
    filepath = os.path.join(OUTPUT_DIR, filename)

    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )
    styles  = _build_styles()
    story   = []
    W       = A4[0] - 4*cm   # usable width

    # ── HEADER ─────────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph("🏥 RehabMonitor", styles["ReportTitle"]),
        Paragraph(
            f"Generated: {datetime.now().strftime('%d %b %Y, %H:%M')}<br/>"
            f"<font color='#176B87'>Rehabilitation Progress Report</font>",
            styles["BodySmall"]
        )
    ]]
    header_table = Table(header_data, colWidths=[W * 0.6, W * 0.4])
    header_table.setStyle(TableStyle([
        ("VALIGN",      (0,0), (-1,-1), "MIDDLE"),
        ("ALIGN",       (1,0), (1,0),   "RIGHT"),
        ("BACKGROUND",  (0,0), (-1,-1), MINT),
        ("BOX",         (0,0), (-1,-1), 1.5, TEAL),
        ("ROUNDEDCORNERS", [6]),
        ("TOPPADDING",  (0,0), (-1,-1), 10),
        ("BOTTOMPADDING",(0,0), (-1,-1), 10),
        ("LEFTPADDING", (0,0), (-1,-1), 12),
        ("RIGHTPADDING",(0,0), (-1,-1), 12),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.5*cm))

    # ── PATIENT DETAILS ─────────────────────────────────────────────────────────
    story.append(Paragraph("Patient Information", styles["SectionHead"]))
    story.append(HRFlowable(width=W, thickness=1, color=TEAL, spaceAfter=6))

    pd_data = [
        ["Patient Name",  patient["name"],       "Condition",      patient.get("condition","–")],
        ["Email",         patient["email"],       "Doctor Email",   patient["doctor_email"]],
        ["Target Angle",  f"{patient['target_angle']}°",
         "Session #",     str(session["id"])],
    ]
    pd_table = Table(pd_data, colWidths=[W*0.2, W*0.3, W*0.2, W*0.3])
    pd_table.setStyle(TableStyle([
        ("FONTNAME",     (0,0), (-1,-1), "Helvetica"),
        ("FONTNAME",     (0,0), (0,-1), "Helvetica-Bold"),
        ("FONTNAME",     (2,0), (2,-1), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 9),
        ("TEXTCOLOR",    (0,0), (0,-1), NAVY),
        ("TEXTCOLOR",    (2,0), (2,-1), NAVY),
        ("TEXTCOLOR",    (1,0), (1,-1), colors.HexColor("#333")),
        ("TEXTCOLOR",    (3,0), (3,-1), colors.HexColor("#333")),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[LIGHT, colors.white]),
        ("GRID",         (0,0), (-1,-1), 0.5, colors.HexColor("#ddd")),
        ("TOPPADDING",   (0,0), (-1,-1), 6),
        ("BOTTOMPADDING",(0,0), (-1,-1), 6),
        ("LEFTPADDING",  (0,0), (-1,-1), 8),
    ]))
    story.append(pd_table)
    story.append(Spacer(1, 0.4*cm))

    # ── SESSION METRICS ─────────────────────────────────────────────────────────
    story.append(Paragraph("Session Metrics", styles["SectionHead"]))
    story.append(HRFlowable(width=W, thickness=1, color=TEAL, spaceAfter=8))

    metrics = [
        ("Avg Angle",    f"{session['avg_angle']:.1f}°"),
        ("Max Angle",    f"{session['max_angle']:.1f}°"),
        ("Min Angle",    f"{session['min_angle']:.1f}°"),
        ("Accuracy",     f"{session['accuracy']:.1f}%"),
        ("Consistency",  f"{session['consistency']:.1f}%"),
        ("Frames",       str(session.get("frame_count", "–"))),
    ]
    metric_cells = [[
        Table([[Paragraph(v, styles["Metric"])],
               [Paragraph(k, styles["MetricLabel"])]],
              colWidths=[W/6 - 0.2*cm])
        for k, v in metrics
    ]]
    metric_table = Table(metric_cells, colWidths=[W/6]*6)
    metric_table.setStyle(TableStyle([
        ("BOX",          (0,0),(-1,-1), 1, TEAL),
        ("INNERGRID",    (0,0),(-1,-1), 0.5, colors.HexColor("#cde")),
        ("BACKGROUND",   (0,0),(-1,-1), MINT),
        ("TOPPADDING",   (0,0),(-1,-1), 10),
        ("BOTTOMPADDING",(0,0),(-1,-1), 10),
        ("ALIGN",        (0,0),(-1,-1), "CENTER"),
    ]))
    story.append(metric_table)
    story.append(Spacer(1, 0.4*cm))

    # ── INJURY STATUS BANNER ────────────────────────────────────────────────────
    status      = session.get("injury_status", "first_session")
    status_col  = STATUS_COLORS.get(status, GRAY)
    delta       = session.get("angle_delta", 0.0)

    status_data = [[
        Paragraph(status.replace("_", " ").upper(), styles["StatusText"]),
        Paragraph(
            f"Change from last session: <b>{delta:+.1f}°</b><br/>{status_message}",
            styles["BodySmall"]
        )
    ]]
    st = Table(status_data, colWidths=[W*0.28, W*0.72])
    st.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(0,0), status_col),
        ("BACKGROUND",   (1,0),(1,0), colors.white),
        ("TEXTCOLOR",    (0,0),(0,0), colors.white),
        ("FONTNAME",     (0,0),(0,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0),(0,0), 12),
        ("ALIGN",        (0,0),(0,0), "CENTER"),
        ("VALIGN",       (0,0),(-1,-1),"MIDDLE"),
        ("BOX",          (0,0),(-1,-1), 1.5, status_col),
        ("TOPPADDING",   (0,0),(-1,-1), 12),
        ("BOTTOMPADDING",(0,0),(-1,-1), 12),
        ("LEFTPADDING",  (0,0),(-1,-1), 10),
    ]))
    story.append(st)
    story.append(Spacer(1, 0.5*cm))

    # ── ANGLE VS TIME GRAPH ─────────────────────────────────────────────────────
    if graph_path and os.path.exists(graph_path):
        story.append(Paragraph("Angle vs Time – This Session", styles["SectionHead"]))
        story.append(HRFlowable(width=W, thickness=1, color=TEAL, spaceAfter=6))
        story.append(RLImage(graph_path, width=W, height=W*0.42))
        story.append(Spacer(1, 0.4*cm))

    # ── PROGRESS GRAPH ──────────────────────────────────────────────────────────
    if progress_path and os.path.exists(progress_path):
        story.append(Paragraph("Multi-Session Progress", styles["SectionHead"]))
        story.append(HRFlowable(width=W, thickness=1, color=TEAL, spaceAfter=6))
        story.append(RLImage(progress_path, width=W, height=W*0.45))
        story.append(Spacer(1, 0.4*cm))

    # ── DOCTOR NOTES ────────────────────────────────────────────────────────────
    story.append(Paragraph("Doctor Notes", styles["SectionHead"]))
    story.append(HRFlowable(width=W, thickness=1, color=TEAL, spaceAfter=6))

    notes_text = session.get("doctor_notes") or "No notes recorded for this session."
    notes_data = [[Paragraph(notes_text, styles["DoctorNote"])]]
    notes_table = Table(notes_data, colWidths=[W])
    notes_table.setStyle(TableStyle([
        ("BOX",          (0,0),(-1,-1), 1, colors.HexColor("#ccc")),
        ("BACKGROUND",   (0,0),(-1,-1), LIGHT),
        ("TOPPADDING",   (0,0),(-1,-1), 12),
        ("BOTTOMPADDING",(0,0),(-1,-1), 60),   # room to write
        ("LEFTPADDING",  (0,0),(-1,-1), 12),
    ]))
    story.append(notes_table)
    story.append(Spacer(1, 0.5*cm))

    # ── FOOTER ─────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width=W, thickness=0.5, color=GRAY))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        "This report was automatically generated by RehabMonitor. "
        "For medical decisions, always consult a licensed healthcare professional.",
        ParagraphStyle("Footer", fontSize=7, textColor=GRAY,
                       alignment=TA_CENTER, fontName="Helvetica")
    ))

    doc.build(story)
    return filepath