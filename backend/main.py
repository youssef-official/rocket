import modal
import os
from pathlib import Path

# Define the Modal App
app = modal.App("rocket-preview")

# Get the directory where this script lives
SCRIPT_DIR = Path(__file__).parent

# Define the image with Node.js and Python
image = (
    modal.Image.debian_slim()
    .apt_install("curl", "git")
    .run_commands("curl -fsSL https://deb.nodesource.com/setup_20.x | bash -")
    .apt_install("nodejs")
    .pip_install("fastapi", "uvicorn")
    .run_commands("npm install -g vite")
    .run_commands("mkdir -p /app")
    .add_local_file(str(SCRIPT_DIR / "server.py"), "/root/server.py")
)

# Web Endpoint to spawn sandboxes
@app.function(image=image, timeout=300)
@modal.asgi_app()
def create_sandbox():
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    web_app = FastAPI()

    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @web_app.post("/")
    def create():
        # Create a Sandbox running our server.py
        # We expose port 8000 (API) and 5173 (Vite Preview)
        sandbox = modal.Sandbox.create(
            "python", "/root/server.py",
            image=image,
            encrypted_ports=[8000, 5173],
            timeout=300  # 5 minutes
        )
        
        print(f"Sandbox created: {sandbox.object_id}")
        
        tunnels = sandbox.tunnels()
        api_url = tunnels[8000].url
        preview_url = tunnels[5173].url
        
        return {
            "sandbox_id": sandbox.object_id,
            "api_url": api_url,
            "preview_url": preview_url
        }

    return web_app

# We also need a way to keep the app alive? 
# No, web_endpoint spawns on demand.
