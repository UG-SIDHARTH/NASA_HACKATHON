import re

with open('resources/researchers_guide_landing.html', encoding='utf-8') as f:
    html = f.read()

links = re.findall(r'href=["\']([^"\']+)["\']', html)
print(f"Total links: {len(links)}")
for l in set(links):
    if any(k in l.lower() for k in ['pdf', 'combustion', 'researcher', 'guide', 'download']):
        print(l)
