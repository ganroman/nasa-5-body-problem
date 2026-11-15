from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.admin import public_router as flags_router
from app.admin import router as admin_router
from app.api import router
from app.config import get_settings
from app.db import get_session

app = FastAPI(title="Cargo Passport API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["*"],
)


@app.get("/health")
def health(session: Session = Depends(get_session)) -> dict[str, str]:
    session.execute(text("select 1"))
    return {"status": "ok", "db": "ok"}


app.include_router(router)
app.include_router(flags_router)
app.include_router(admin_router)
