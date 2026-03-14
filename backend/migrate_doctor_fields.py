"""
migrate_doctor_fields.py
────────────────────────
Run this ONCE from your backend folder to add the new doctor-profile
columns to the existing SQLite users table.

Usage (from backend/ directory):
    python migrate_doctor_fields.py

Safe to run multiple times — skips columns that already exist.
"""

import sqlite3
import os
import sys

# ── Locate the database file ──────────────────────────────────────────────────
# Flask-SQLAlchemy stores the DB in the instance/ folder by default.
# We auto-scan all common locations and pick the one with a 'users' table.

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

CANDIDATE_PATHS = [
    os.path.join(BASE_DIR, "instance", "app.db"),
    os.path.join(BASE_DIR, "instance", "users.db"),
    os.path.join(BASE_DIR, "instance", "site.db"),
    os.path.join(BASE_DIR, "instance", "database.db"),
    os.path.join(BASE_DIR, "app.db"),
    os.path.join(BASE_DIR, "users.db"),
    os.path.join(BASE_DIR, "site.db"),
    os.path.join(BASE_DIR, "database.db"),
]

# Auto-scan instance/ folder for any .db file
instance_dir = os.path.join(BASE_DIR, "instance")
if os.path.isdir(instance_dir):
    for fname in os.listdir(instance_dir):
        if fname.endswith(".db"):
            p = os.path.join(instance_dir, fname)
            if p not in CANDIDATE_PATHS:
                CANDIDATE_PATHS.append(p)

# Also scan backend/ root for any .db file
for fname in os.listdir(BASE_DIR):
    if fname.endswith(".db"):
        p = os.path.join(BASE_DIR, fname)
        if p not in CANDIDATE_PATHS:
            CANDIDATE_PATHS.append(p)

# Find the DB that actually has a 'users' table
DB_PATH = None
print("[INFO] Scanning for the users database...\n")
for path in CANDIDATE_PATHS:
    if not os.path.exists(path):
        continue
    try:
        c = sqlite3.connect(path)
        tables = {r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()}
        c.close()
        print(f"  Found : {path}")
        print(f"  Tables: {sorted(tables)}")
        if "users" in tables:
            DB_PATH = path
            print(f"  ✓ Has 'users' table — USING THIS\n")
            break
        else:
            print(f"  ✗ No 'users' table\n")
    except Exception as e:
        print(f"  ✗ Could not read {path}: {e}\n")

if not DB_PATH:
    print("[ERROR] Could not find a database with a 'users' table.")
    print("  Open config.py or app.py and look for SQLALCHEMY_DATABASE_URI")
    sys.exit(1)

print(f"[INFO] Using: {os.path.abspath(DB_PATH)}\n")

# ── Columns to add ────────────────────────────────────────────────────────────
# (column_name, SQL type + default)
NEW_COLUMNS = [
    ("specialization", "VARCHAR(120)  DEFAULT NULL"),
    ("qualification",  "VARCHAR(200)  DEFAULT NULL"),
    ("hospital",       "VARCHAR(200)  DEFAULT NULL"),
    ("experience",     "INTEGER       DEFAULT NULL"),
    ("rating",         "REAL          DEFAULT NULL"),
    ("review_count",   "INTEGER       DEFAULT NULL"),
    ("location",       "VARCHAR(200)  DEFAULT NULL"),
    ("languages",      "VARCHAR(200)  DEFAULT NULL"),
    ("consult_fee",    "VARCHAR(50)   DEFAULT NULL"),
    ("bio",            "TEXT          DEFAULT NULL"),
    ("availability",   "VARCHAR(200)  DEFAULT NULL"),
    ("verified",       "BOOLEAN       DEFAULT 0   NOT NULL"),
    ("profile_image",  "VARCHAR(300)  DEFAULT NULL"),
]

# ── Run migration ─────────────────────────────────────────────────────────────
conn   = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(users)")
existing = {row[1] for row in cursor.fetchall()}
print(f"[INFO] Existing columns in 'users': {sorted(existing)}\n")

added = []
skipped = []

for col_name, col_def in NEW_COLUMNS:
    if col_name in existing:
        skipped.append(col_name)
        print(f"  [SKIP]  {col_name:20s} — already exists")
    else:
        sql = f"ALTER TABLE users ADD COLUMN {col_name} {col_def}"
        try:
            cursor.execute(sql)
            added.append(col_name)
            print(f"  [ADD]   {col_name:20s} — added ✓")
        except sqlite3.OperationalError as e:
            print(f"  [ERROR] {col_name:20s} — {e}")

conn.commit()
conn.close()

print(f"\n[DONE]  Added {len(added)} column(s), skipped {len(skipped)} existing.")
print("You can now restart your Flask server with: python app.py")