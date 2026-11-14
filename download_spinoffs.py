import urllib.request
import ssl
import os

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
headers = {'User-Agent': 'Mozilla/5.0'}

# 1. Fetch search/landing for Breathing Gear and Smoke Detector
urls = {
    "lightweight_breathing_apparatus": "https://spinoff.nasa.gov/spinoff2002/ps_3.html",
    "smoke_detector_nasa": "https://www.nasa.gov/stem-content/smoke-detectors/"
}

for name, url in urls.items():
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            data = r.read()
            with open(f"resources/{name}.html", "wb") as f:
                f.write(data)
            print(f"Downloaded {name} ({len(data)} bytes)")
    except Exception as e:
        print(f"Failed {name}: {e}")
