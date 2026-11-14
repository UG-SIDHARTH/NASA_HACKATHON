import urllib.request
import ssl
import sys

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

pdf_url = "https://www.nasa.gov/wp-content/uploads/2016/05/np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf?emrc=c9b273"
dest = "resources/A_Researchers_Guide_to_ISS_Combustion_Science.pdf"

print("Downloading PDF...")
try:
    req = urllib.request.Request(pdf_url, headers=headers)
    with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
        data = resp.read()
        with open(dest, "wb") as f:
            f.write(data)
    print(f"Successfully saved {dest} ({len(data)} bytes / {len(data)/(1024*1024):.2f} MB)")
except Exception as e:
    print("Download failed:", e)
