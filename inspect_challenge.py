import re

with open('resources/challenge_page.html', encoding='utf-8') as f:
    text = f.read()

print('Length of html:', len(text))
matches = re.findall(r'https?://[^\s"\'<>]+', text)
print(f'Total URLs found: {len(matches)}')

nasa_links = [m for m in set(matches) if any(k in m.lower() for k in ['nasa', 'psi', 'combustion', 'spinoff', 'apollo', 'mir', 'youtube'])]
for link in sorted(nasa_links):
    print(link)
