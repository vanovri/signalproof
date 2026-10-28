"""Optional owner-operated CPU host. Requires an authenticated Modal client.

Create a Modal secret named signalproof-owner containing SIGNALPROOF_ACCESS_TOKEN.
Add FIREWORKS_API_KEY and FIREWORKS_MODEL only when enabling model requests.
Never put credentials in this file. Deployment is not performed by this recipe.
"""
from pathlib import Path
import os
import subprocess
import modal

source = Path(__file__).parent
image = modal.Image.debian_slim(python_version="3.12").apt_install("nodejs")
for name in ("server.mjs", "engine.mjs", "app.mjs", "index.html", "style.css", "api/analyze.mjs"):
    image = image.add_local_file(str(source / name), "/app/" + name)
app = modal.App("signalproof")

@app.function(image=image, cpu=1, memory=512, max_containers=1,
              secrets=[modal.Secret.from_name("signalproof-owner")], timeout=300)
@modal.web_server(8000, startup_timeout=30)
def web():
    subprocess.Popen(["node", "/app/server.mjs"],
                     env={**os.environ, "HOST": "0.0.0.0", "PORT": "8000"})
