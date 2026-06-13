FROM python:3.11-bookworm

# poppler-utils -> pdfinfo/pdftotext/pdftoppm; tectonic -> LaTeX engine.
# Install a pinned tectonic release binary straight into /usr/local/bin so it
# is unambiguously on PATH. (The upstream `curl | sh` installer drops the
# binary in the build's CURRENT directory — which was '/' before WORKDIR and
# NOT on PATH — so `tectonic` was never found at runtime and PDF generation
# failed with an opaque 500.)
#
# Use the musl (statically linked) build, not gnu: the gnu binary needs
# GLIBC 2.38/2.39 but this image (Debian 12 bookworm) ships glibc 2.36, so a
# gnu binary aborts at runtime with "GLIBC_2.38 not found".
ARG TECTONIC_VERSION=0.16.9
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    curl \
    ca-certificates \
  && curl --proto '=https' --tlsv1.2 -fsSL \
       "https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${TECTONIC_VERSION}/tectonic-${TECTONIC_VERSION}-x86_64-unknown-linux-musl.tar.gz" \
       | tar -xz -C /usr/local/bin tectonic \
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
  && (tectonic /tmp/prewarm.tex --outdir /tmp || echo "prewarm skipped (non-fatal)") \
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
