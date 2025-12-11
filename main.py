from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from . import models
from .config import get_settings
from .database import SessionLocal, engine
from .auth import get_current_user, router as auth_router
from .routers import projects

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DocFlow Buddy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

settings = get_settings()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/", response_class=HTMLResponse)
async def read_root():
    return RedirectResponse(url="/static/index.html")


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(current_user=Depends(get_current_user)):
    return RedirectResponse(url="/static/dashboard.html")


app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
