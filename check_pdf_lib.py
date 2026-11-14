import fitz # PyMuPDF if available, or pypdf
import sys
import re

for mod in ['pypdf', 'fitz', 'pdfplumber']:
    try:
        __import__(mod)
        print(f"Available: {mod}")
    except ImportError:
        pass
