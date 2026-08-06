# Dockerfile
#
# Multi-stage build for the Aavedan Setu AI Assistant FastAPI service.
#
# Stage 1 (builder): installs dependencies into a virtualenv so the
# final image doesn't carry build tools/caches.
# Stage 2 (runtime): copies only the venv + application code, runs as
# a non-root user, and starts uvicorn.

FROM python:3.11-slim AS builder

WORKDIR /build

# System deps needed only for building wheels (e.g. for any package
# that needs compilation); kept out of the final image.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt


FROM python:3.11-slim AS runtime

# Non-root user — this service will run in a government production
# environment; don't run the process as root.
RUN groupadd --system app && useradd --system --gid app app

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY app ./app
COPY pyproject.toml ./

RUN chown -R app:app /app
USER app

EXPOSE 8000

# Basic container healthcheck hitting the dependency-free /health route.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=3)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
