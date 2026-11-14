import urllib.request
import ssl
import json
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# 1. Fetch Researcher's guide landing page to extract PDF link
guide_page_url = "https://www.nasa.gov/mission/station/research-explorer/a-researchers-guide-to-combustion-science/"
print("Fetching Guide Landing Page...")
try:
    req = urllib.request.Request(guide_page_url, headers=headers)
    with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
        content = resp.read().decode('utf-8', errors='ignore')
        with open("resources/researchers_guide_landing.html", "w", encoding='utf-8') as f:
            f.write(content)
        # Find pdf links
        pdf_links = re.findall(r'href=["\'](https?://[^"\']+\.pdf)["\']', content)
        print("Found PDF links:", pdf_links)
        if pdf_links:
            pdf_url = pdf_links[0]
            print(f"Downloading PDF from {pdf_url}...")
            req_pdf = urllib.request.Request(pdf_url, headers=headers)
            with urllib.request.urlopen(req_pdf, context=ctx, timeout=60) as presp:
                pdf_data = presp.read()
                with open("resources/ISS_Combustion_Science_Researchers_Guide.pdf", "wb") as pf:
                    pf.write(pdf_data)
                print(f"Saved ISS_Combustion_Science_Researchers_Guide.pdf ({len(pdf_data)} bytes)")
except Exception as e:
    print("Error fetching guide:", e)

# 2. Spinoff pages: search / fetch
spinoff_urls = {
    "firemans_air_tanks": "https://spinoff.nasa.gov/spinoff/spinitem?title=Lightweight+Breathing+Gear",
    "fire_detector": "https://spinoff.nasa.gov/spinoff/spinitem?title=Smoke+Detector",
    "fire_safety_suit": "https://spinoff.nasa.gov/Spinoff2015/ps_2.html"
}

for name, url in spinoff_urls.items():
    print(f"Fetching {name} from {url}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
            data = resp.read()
            with open(f"resources/{name}.html", "wb") as f:
                f.write(data)
            print(f"Saved {name}.html ({len(data)} bytes)")
    except Exception as e:
        print(f"Failed {name}: {e}")
