FROM python:3.12-slim

WORKDIR /app

# Optimize Python and Threading for Low-Resource CPUs (Pentium 2-core / 3GB RAM)
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    VECLIB_MAXIMUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3003

# Single worker, thread-capped to prevent OOM / CPU thrashing on Pentium hardware
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3003", "--workers", "1", "--limit-concurrency", "50"]
