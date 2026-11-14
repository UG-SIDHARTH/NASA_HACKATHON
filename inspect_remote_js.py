import urllib.request
import re

req = urllib.request.Request(
    'https://sanju.ugsidharth.in/assets/index-D49XntEm.js',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
)
try:
    with urllib.request.urlopen(req, timeout=10) as sr:
        js = sr.read().decode('utf-8')
        print("Live JS bundle length:", len(js))
        print("Contains localhost in live bundle?:", "localhost" in js)
        # find API_BASE or fetch urls
        urls = re.findall(r'http://localhost:[0-9]+', js)
        print("Found localhost URLs in live bundle:", urls)
except Exception as e:
    print("Error:", e)
