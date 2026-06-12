FROM python:3.11-bookworm

# poppler-utils -> pdfinfo/pdftotext/pdftoppm; tectonic -> LaTeX engine.
# The tectonic installer drops the binary in the CURRENT directory, so we
# explicitly move it onto PATH (/usr/local/bin) — otherwise `tectonic` is not
# found at runtime and PDF generation fails with an opaque 500.
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    curl \
    ca-certificates \
  && curl --proto '=https' --tlsv1.2 -fsSL https://drop-sh.fullyjustified.net | sh -s -- -y \
  && mv ./tectonic /usr/local/bin/tectonic \
  && tectonic --version \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Pre-warm Tectonic's package bundle into the image so the first real compile
# on Render's free tier doesn't have to download packages over the network
# (which can exceed the client request timeout on a cold start).
RUN printf '%s\n' \
    '\documentclass[letterpaper,11pt]{article}' \
    '\usepackage{lmodern}\usepackage{latexsym}\usepackage[empty]{fullpage}' \
    '\usepackage{titlesec}\usepackage{marvosym}\usepackage[usenames,dvipsnames]{color}' \
    '\usepackage{verbatim}\usepackage{enumitem}\usepackage[hidelinks]{hyperref}' \
    '\usepackage{fancyhdr}\usepackage[english]{babel}\usepackage{tabularx}\usepackage{multicol}' \
    '\begin{document}Prewarm\end{document}' > /tmp/prewarm.tex \
  && tectonic /tmp/prewarm.tex --outdir /tmp \
  && rm -f /tmp/prewarm.*

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
