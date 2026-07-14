"""Create or promote a user to admin.

Usage:
  python scripts/create_admin.py [email] [password]

If no args are provided, defaults to admin@example.com / Admin@123
This script MUST be run in a trusted environment (local or CI) and should
not be exposed to the internet.
"""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from database import SessionLocal
from models.user import User
from database import engine, Base


def create_admin(argv):
    db = SessionLocal()
    try:
        # Ensure all tables exist (useful when running script without the app server)
        Base.metadata.create_all(bind=engine)

        email = "admin@example.com"
        password = "Admin@123"
        if len(argv) >= 3:
            email = argv[1]
            password = argv[2]

        existing = db.query(User).filter(User.email == email).first()
        if existing:
            existing.role = "admin"
            # Use the model setter to update password (applies hashing)
            existing.password = password
            db.add(existing)
            db.commit()
            print("Existing user promoted to admin and password updated")
            print("Email:", email)
            return

        admin = User(name="Administrator", email=email, role="admin")
        admin.password = password
        db.add(admin)
        db.commit()

        print("==========================")
        print("ADMIN CREATED")
        print("==========================")
        print("Email:", email)
        print("Password:", password)
        print("==========================")

    except Exception as e:
        db.rollback()
        print("ERROR:", e)
    finally:
        db.close()


if __name__ == "__main__":
    create_admin(sys.argv)
