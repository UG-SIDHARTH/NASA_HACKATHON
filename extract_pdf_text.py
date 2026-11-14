from pypdf import PdfReader
import re

reader = PdfReader("resources/A_Researchers_Guide_to_ISS_Combustion_Science.pdf")
print("Total pages:", len(reader.pages))

text_by_page = []
for idx, page in enumerate(reader.pages):
    t = page.extract_text() or ""
    text_by_page.append(t)

full_text = "\n".join(text_by_page)
with open("resources/pdf_full_text.txt", "w", encoding="utf-8") as f:
    f.write(full_text)
print("Saved pdf_full_text.txt, length:", len(full_text))

# Search for key investigations
keywords = ["BASS", "FLEX", "ACME", "Saffire", "SAME", "CFI", "BRE", "SPICE", "SLICE", "DAFT"]
for kw in keywords:
    matches = len(re.findall(rf"\b{kw}\b", full_text, re.I))
    print(f"Keyword '{kw}': {matches} occurrences")
