"""
Email Service
=============
Sends the PDF report to the doctor using SMTP.
Configure via environment variables.
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Dict
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST     = os.getenv("SMTP_HOST",     "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER",     "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_NAME     = os.getenv("FROM_NAME",     "RehabMonitor System")


def send_report_to_doctor(
    doctor_email:   str,
    patient:        Dict,
    session:        Dict,
    pdf_path:       str,
    status_message: str,
) -> bool:
    """
    Email the PDF report to the assigned doctor.
    Returns True on success, False on failure.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️  SMTP credentials not configured – skipping email.")
        return False

    subject = (
        f"[RehabMonitor] Session Report – {patient['name']} "
        f"(Session #{session['id']})"
    )

    html_body = f"""
    <html><body style="font-family:Arial,sans-serif;color:#222;max-width:600px">
      <div style="background:#04364A;padding:20px;border-radius:8px 8px 0 0">
        <h2 style="color:#64CCC5;margin:0">🏥 RehabMonitor Report</h2>
        <p style="color:#DAFFFB;margin:4px 0 0">Automated Rehabilitation Progress Report</p>
      </div>
      <div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px">
        <p>Dear Doctor,</p>
        <p>A new rehabilitation session has been completed by your patient:</p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px;font-weight:bold;color:#176B87">Patient</td>
              <td style="padding:6px">{patient['name']}</td></tr>
          <tr style="background:#f5f5f5">
              <td style="padding:6px;font-weight:bold;color:#176B87">Session #</td>
              <td style="padding:6px">{session['id']}</td></tr>
          <tr><td style="padding:6px;font-weight:bold;color:#176B87">Avg Angle</td>
              <td style="padding:6px">{session['avg_angle']:.1f}°</td></tr>
          <tr style="background:#f5f5f5">
              <td style="padding:6px;font-weight:bold;color:#176B87">Status</td>
              <td style="padding:6px"><b>{session['injury_status'].replace('_',' ').title()}</b></td></tr>
          <tr><td style="padding:6px;font-weight:bold;color:#176B87">Assessment</td>
              <td style="padding:6px">{status_message}</td></tr>
        </table>
        <p>Please find the full PDF report attached for review.</p>
        <p style="color:#888;font-size:12px">
          This is an automated message from RehabMonitor.
          Do not reply to this email.
        </p>
      </div>
    </html></body>
    """

    msg = MIMEMultipart("mixed")
    msg["Subject"] = subject
    msg["From"]    = f"{FROM_NAME} <{SMTP_USER}>"
    msg["To"]      = doctor_email

    msg.attach(MIMEText(html_body, "html"))

    # Attach PDF
    if os.path.exists(pdf_path):
        with open(pdf_path, "rb") as f:
            pdf_part = MIMEApplication(f.read(), _subtype="pdf")
            pdf_part.add_header(
                "Content-Disposition", "attachment",
                filename=os.path.basename(pdf_path)
            )
            msg.attach(pdf_part)

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, [doctor_email], msg.as_string())
        print(f"✅  Report emailed to {doctor_email}")
        return True
    except Exception as e:
        print(f"❌  Email failed: {e}")
        return False