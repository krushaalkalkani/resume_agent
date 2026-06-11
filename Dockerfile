FROM python:3.11-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    curl \
    ca-certificates \
  && curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh -s -- -y \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api.py config.yaml generate_resume.py ./
COPY src/ src/
COPY templates/ templates/
COPY supabase/ supabase/

RUN mkdir -p data output

ENV PORT=8000
EXPOSE 8000

CMD uvicorn api:app --host 0.0.0.0 --port ${PORT}
