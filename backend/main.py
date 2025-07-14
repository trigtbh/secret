from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from typing import *

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(exc.errors())  # Logs detailed error info
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )
# ...existing code..

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ColorModel(BaseModel):
    foreground: str
    background: str
    accent: str

class FileModel(BaseModel):
    name: str
    type: str
    encryptedData: str
    originalSize: int

class SettingsModel(BaseModel):
    expiration: int
    viewLimit: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    selectedColors: ColorModel

class MetadataModel(BaseModel):
    totalFiles: int
    uploadTime: str
    totalOriginalSize: int

class UploadRequestModel(BaseModel):
    files: List[FileModel]
    passwordHash: str
    settings: SettingsModel
    metadata: MetadataModel

from uuid import uuid4

@app.get("/")
@limiter.limit("5/minute")
async def root(request: Request):
    return {"message": "This server is running Secret."}


@app.post("/api/upload")
# @limiter.limit("5/minute")
async def upload(json: UploadRequestModel):
    # verify colors are valid colors
    for part in json.settings.selectedColors:
        color = part[1]
        if not color.startswith("#") or len(color) != 7 or not all(c in "0123456789ABCDEFabcdef" for c in color[1:]):
            return JSONResponse(
                status_code=422,
                content={"message": "Invalid color format. Use hex format like #RRGGBB."}
            )
    return {
        "message": "Files uploaded successfully",
        "ID": str(uuid4()),
    }