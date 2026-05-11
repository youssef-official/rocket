from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import os
import subprocess
import uvicorn
import sys

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FileMap(BaseModel):
    files: Dict[str, Any]

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/init")
async def init_project(data: FileMap, background_tasks: BackgroundTasks):
    print("Init project received")
    # Clean /app if needed?
    # Write files
    for path, content in data.files.items():
        if isinstance(content, dict): 
            content = content.get('content', '')
        
        # Helper to ensure content is string
        if not isinstance(content, str):
            continue

        # Adjust path (remove leading /)
        clean_path = path.lstrip('/')
        full_path = os.path.join("/app", clean_path)
        
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w") as f:
            f.write(content)
            
    # Install dependencies & Start Vite
    background_tasks.add_task(start_vite)
    return {"status": "initializing"}

@app.post("/update")
async def update_files(data: FileMap):
    package_json_updated = False
    for path, content in data.files.items():
        if isinstance(content, dict): 
            content = content.get('content', '')
            
        if not isinstance(content, str):
            continue

        clean_path = path.lstrip('/')
        if clean_path == "package.json":
            package_json_updated = True

        full_path = os.path.join("/app", clean_path)
        
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w") as f:
            f.write(content)
    
    if package_json_updated:
        print("package.json updated, running npm install...")
        subprocess.run(["npm", "install"], cwd="/app")

    return {"status": "updated"}

def start_vite():
    print("Starting Vite...")
    os.chdir("/app")
    
    # Check if package.json exists
    if not os.path.exists("package.json"):
        print("No package.json found")
        return

    # Install if node_modules missing
    if not os.path.exists("node_modules"):
        print("Installing dependencies...")
        subprocess.run(["npm", "install"], check=True)
    
    # Start Vite
    # We use --host to expose to 0.0.0.0 so tunnel picks it up
    print("Running dev server...")
    subprocess.Popen(["npm", "run", "dev", "--", "--host", "--port", "5173"])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
