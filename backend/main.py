from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError

import random, json
import time

from typing import *

import oci
from oci.config import from_file
config = from_file(file_location="./.oci/config")
object_storage = oci.object_storage.ObjectStorageClient(config)
namespace = object_storage.get_namespace().data

bucket_name = "secret-bucket"


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



def write_bucket(id_, data):
    try:
        object_storage.put_object(
            namespace,
            bucket_name,
            f"{id_}",
            data
        )
    except oci.exceptions.ServiceError as e:
        print(f"Error uploading {id_} to bucket {bucket_name}: {e}")
        raise e

def read_bucket(id_):
    try:
        response = object_storage.get_object(
            namespace,
            bucket_name,
            f"{id_}"
        )
        return response.data.raw
    except oci.exceptions.ServiceError as e:
        print(f"Error reading {id_} from bucket {bucket_name}: {e}")
        raise e


@app.get("/api/check/{id_}")
@limiter.limit("5/minute")
async def check_id(request: Request, id_: str):
    response = {
        "exists": True,
        "time": True,
        "downloads": True
    }
    try:
        object_storage.get_object(
            namespace,
            bucket_name,
            id_
        )
    except oci.exceptions.ServiceError as e:
        if e.status == 404:
            response["exists"] = False
        else:
            return JSONResponse(
                status_code=500,
                content={"message": "Error checking ID existence."}
            )
        
    if response["exists"]:


        data = json.load(read_bucket(id_))
        if data.get("settings", {}).get("expiration", 0) < time.time():
            response["time"] = False
        if data.get("settings", {}).get("viewLimit", None) is not None:
            if data["settings"]["viewLimit"] <= 0:
                response["downloads"] = False

    return response

@app.get("/api/get/{id_}")
@limiter.limit("5/minute")
async def get_id(request: Request, id_: str):
    # check if exists(id) is true for all 3
    response = await check_id(request, id_)
    print(response)
    if not all(response.values()):
        return JSONResponse(
            status_code=404,
            content={"message": "ID not found or inaccessible."}
        )
    try:
        data = json.load(read_bucket(id_))
    except Exception as e:
        print(f"Error reading data for ID {id_}: {e}")
        return JSONResponse(
            status_code=500,
            content={"message": "Error reading data."}
        )
    
    # decrement view limit
    if data.get("settings", {}).get("viewLimit", None) is not None:
        if data["settings"]["viewLimit"] > 0:
            data["settings"]["viewLimit"] -= 1
            write_bucket(id_, json.dumps(data).encode('utf-8'))
    
    return data
        

@app.post("/api/upload")
@limiter.limit("5/minute")
async def upload(request: Request, json: UploadRequestModel):
    # verify colors are valid colors
    for part in json.settings.selectedColors:
        color = part[1]
        if not color.startswith("#") or len(color) != 7 or not all(c in "0123456789ABCDEFabcdef" for c in color[1:]):
            return JSONResponse(
                status_code=422,
                content={"message": "Invalid color format. Use hex format like #RRGGBB."}
            )
        

    identifier = ""
    for _ in range(6):
        identifier += random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
    while True:
        try:
            object_storage.get_object(
                namespace,
                bucket_name,
                identifier
            )
        except oci.exceptions.ServiceError as e:
            if e.status == 404: 
                break
            else:
                return JSONResponse(
                    status_code=500,
                    content={"message": "Error checking identifier uniqueness."}
                )
        identifier = ""
        for _ in range(6):
            identifier += random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")


    json.settings.expiration += time.time()

    try:
        object_storage.put_object(
            namespace,
            bucket_name,
            f"{identifier}",
            json.model_dump_json(indent=2).encode('utf-8')
        )
    except oci.exceptions.ServiceError as e:
        print(f"Error uploading metadata for identifier {identifier}: {e}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error uploading metadata: {e.message}"}
        )



    return {
        "message": "Files uploaded successfully",
        "ID": identifier,
    }

import os
from fastapi.staticfiles import StaticFiles


static_files_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

# Mount the static files directory
# This will serve files like JS, CSS, and images
app.mount(
    "/_expo",
    StaticFiles(directory=os.path.join(static_files_dir, "_expo")),
    name="expo-assets"
)

app.mount(
    "/assets",
    StaticFiles(directory=os.path.join(static_files_dir, "assets")),
    name="other-assets"
)

# Catch-all route to serve the index.html
# This is crucial for single-page applications with client-side routing
@app.api_route("/{path_name:path}")
async def catch_all(request: Request, path_name: str):
    file_path = os.path.abspath(os.path.join(static_files_dir, path_name))

    # If the requested path is a file, serve it
    if os.path.isfile(file_path) and file_path.startswith(static_files_dir):
        return FileResponse(file_path)

    # Otherwise, serve the index.html for client-side routing
    index_path = os.path.join(static_files_dir, "index.html")
    return FileResponse(index_path)
