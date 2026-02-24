import modal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import time

# Define the Modal App
app = modal.App("rocket-preview")

# Define the image with Node.js and Python
image = (
    modal.Image.debian_slim()
    .apt_install("curl", "git")
    .run_commands("curl -fsSL https://deb.nodesource.com/setup_20.x | bash -")
    .apt_install("nodejs")
    .pip_install("fastapi", "uvicorn")
    .run_commands("npm install -g vite")
    .run_commands("mkdir -p /app")
    .add_local_file("server.py", "/root/server.py")
)

# Middleware to allow iframe embedding and handle CORS preflights
class IframeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            response = Response(status_code=204)
        else:
            response = await call_next(request)
        
        # Remove restrictive headers to allow iframe embedding
        response.headers.pop("X-Frame-Options", None)
        response.headers.pop("Content-Security-Policy", None)
        
        # Explicitly allow embedding from any origin
        response.headers["X-Frame-Options"] = "ALLOWALL"
        response.headers["Content-Security-Policy"] = "frame-ancestors *"
        
        # Ensure CORS headers are present for the response
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        
        return response

# Web Endpoint to spawn sandboxes
@app.function(image=image, timeout=300)
@modal.asgi_app()
def create_sandbox():
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    web_app = FastAPI()

    # Add standard CORS middleware
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add our custom IframeMiddleware to allow embedding
    web_app.add_middleware(IframeMiddleware)

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
