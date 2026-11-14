import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
headers = {'User-Agent': 'Mozilla/5.0'}

endpoints = [
    'https://sanju.ugsidharth.in/api/investigations',
    'https://sanju.ugsidharth.in/api/rankings',
    'https://sanju.ugsidharth.in/api/domain'
]

for ep in endpoints:
    try:
        req = urllib.request.Request(ep, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
            data = json.loads(r.read())
            count = len(data) if isinstance(data, list) else len(data.keys())
            print(f"SUCCESS {ep}: Status {r.status}, items/keys: {count}")
    except Exception as e:
        print(f"FAILED {ep}: {e}")

# Test POST SI Query
try:
    post_url = 'https://sanju.ugsidharth.in/api/si/query'
    payload = json.dumps({"query": "cool flames"}).encode('utf-8')
    req = urllib.request.Request(post_url, data=payload, headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
        res = json.loads(r.read())
        print(f"SUCCESS POST SI Query: mode={res.get('mode')}, citations={len(res.get('citations', []))}")
except Exception as e:
    print(f"FAILED POST SI Query: {e}")
