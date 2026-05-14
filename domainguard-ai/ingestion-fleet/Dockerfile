FROM python:3.13-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libnss3 libatk-bridge2.0-0 libgtk-3-0 libasound2 libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpangocairo-1.0-0 libpango-1.0-0 libatk1.0-0 libcups2 libdrm2 libxshmfence1 libxkbcommon0 curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && playwright install --with-deps chromium

COPY . ./

CMD ["scrapy", "crawl", "intel_spider"]