FROM python:3.14-slim

WORKDIR /backend

# instalar uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# archivos de proyecto
COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-install-project

COPY ./app ./app
COPY ./db ./db

RUN uv sync --frozen

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

