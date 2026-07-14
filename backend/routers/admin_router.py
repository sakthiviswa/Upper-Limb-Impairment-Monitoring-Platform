from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from security import get_current_user


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


def admin_required(
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user



@router.get("/dashboard")
def admin_dashboard(
    current_admin: User = Depends(admin_required)
):

    return {
        "status": "success",
        "message": "Welcome Admin",
        "admin": {
            "id": current_admin.id,
            "name": current_admin.name,
            "email": current_admin.email,
            "role": current_admin.role
        }
    }



@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_required)
):

    users = db.query(User).all()

    return {
        "total_users": len(users),
        "users": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
            for user in users
        ]
    }



@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(admin_required)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()


    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )


    if user.role == "admin":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete admin account"
        )


    db.delete(user)
    db.commit()


    return {
        "message": "User deleted successfully"
    }