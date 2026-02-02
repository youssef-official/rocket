import requests
import os

url = "https://youssef-official-2411--rocket-preview-create-sandbox.modal.run/"
print(f"Testing URL: {url}")

try:
    resp = requests.post(url)
    print(f"Status: {resp.status_code}")
    print(f"Content: {resp.text}")
    print(f"Headers: {resp.headers}")
except Exception as e:
    print(f"Error: {e}")
