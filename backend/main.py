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

# Definitive CORS and Iframe Middleware
class ForceCORSAndIframeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Handle Preflight (OPTIONS) requests immediately with status 204
        if request.method == "OPTIONS":
            response = Response(status_code=204)
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            return response
            
        # Proceed with actual request
        response = await call_next(request)
        
        # Inject CORS headers into the response
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        
        # Inject Iframe embedding headers
        response.headers.pop("X-Frame-Options", None)
        response.headers.pop("Content-Security-Policy", None)
        response.headers["X-Frame-Options"] = "ALLOWALL"
        response.headers["Content-Security-Policy"] = "frame-ancestors *"
        
        return response

# Web Endpoint to spawn sandboxes
@app.function(image=image, timeout=300)
@modal.asgi_app()
def create_sandbox():
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    web_app = FastAPI()

    # Add the custom middleware as the FIRST one to catch all requests and preflights
    web_app.add_middleware(ForceCORSAndIframeMiddleware)

    # Standard FastAPI CORS middleware as backup
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @web_app.post("/")
    def create():
        # Create a Sandbox running our server.py with 5-minute timeout
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
