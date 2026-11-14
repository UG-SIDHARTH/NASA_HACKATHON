import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://www.spaceappschallenge.org/nasa-space-apps-2024/challenges/flame-in-freefall/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        with open('resources/challenge_page.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print('Saved challenge_page.html')
        links = re.findall(r'href=["\'](https?://[^"\'>\s]+)["\']', html)
        with open('resources/all_links.txt', 'w', encoding='utf-8') as f:
            for l in sorted(set(links)):
                f.write(l + '\n')
        print(f'Extracted {len(set(links))} links.')
except Exception as e:
    print('Error:', e)
