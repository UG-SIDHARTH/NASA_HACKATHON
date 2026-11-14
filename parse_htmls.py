import os
import re
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.texts = []
        self.in_script = False
        self.in_style = False

    def handle_starttag(self, tag, attrs):
        if tag in ['script']:
            self.in_script = True
        elif tag in ['style']:
            self.in_style = True

    def handle_endtag(self, tag):
        if tag in ['script']:
            self.in_script = False
        elif tag in ['style']:
            self.in_style = False

    def handle_data(self, data):
        if not self.in_script and not self.in_style:
            text = data.strip()
            if text:
                self.texts.append(text)

files = [
    ('resources/apollo_1.html', 'resources/apollo_1_summary.txt'),
    ('resources/apollo_13.html', 'resources/apollo_13_summary.txt'),
    ('resources/mir_fire.html', 'resources/mir_fire_summary.txt'),
    ('resources/fire_safety_suit.html', 'resources/fire_attire_summary.txt')
]

for src, dst in files:
    if os.path.exists(src):
        with open(src, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()
        parser = TextExtractor()
        parser.feed(html)
        content = "\n".join(parser.texts)
        # remove excessive newlines
        content = re.sub(r'\n{3,}', '\n\n', content)
        with open(dst, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Parsed {src} -> {dst} ({len(content)} characters)")
