FROM python:3.14-slim

WORKDIR /backend

# dependencias weasy print
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz-subset0 \
    libffi-dev \
    shared-mime-info \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# instalar uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# archivos de proyecto
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project

COPY ./app ./app
COPY ./db ./db
COPY ./templates ./templates

RUN uv sync --frozen

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

