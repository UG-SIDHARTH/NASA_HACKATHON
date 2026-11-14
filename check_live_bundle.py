import urllib.request
import re

req = urllib.request.Request('https://sanju.ugsidharth.in/', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    html = r.read().decode('utf-8')
    print('HTML length:', len(html))
    scripts = re.findall(r'src=["\']([^"\']+)["\']', html)
    print('Script tags:', scripts)
    for s in scripts:
        if s.endswith('.js'):
            script_url = 'https://sanju.ugsidharth.in' + s if s.startswith('/') else 'https://sanju.ugsidharth.in/' + s
            print('Checking script:', script_url)
            with urllib.request.urlopen(script_url, timeout=10) as sr:
                js_content = sr.read().decode('utf-8')
                print('Contains localhost?:', 'localhost' in js_content)
                print('Script size:', len(js_content))
