import os
from typing import List

import pymongo
import redis
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="DomainGuard AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://192.168.100.20:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Database Connections
MONGO_URI = os.getenv("MONGO_URI", "mongodb://admin:supersecretpassword@localhost:27017/?authSource=admin")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

mongo_client = pymongo.MongoClient(MONGO_URI)
db = mongo_client['domainguard_raw_intel']
collection = db['raw_html_dump']

redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0)

# 2. Pydantic Models for Data Validation
class ScanRequest(BaseModel):
    url: str


class BulkScanRequest(BaseModel):
    urls: List[str]

@app.get("/api/threats")
def get_threats(limit: int = 10):
    """Fetches the latest AI-parsed threats from MongoDB."""
    # Find items that our Llama 3 parser has successfully processed
    cursor = collection.find({"status": "parsed"}).sort("scraped_at", -1).limit(limit)
    
    threats = []
    for doc in cursor:
        threats.append({
            "id": str(doc["_id"]),
            "url": doc.get("url"),
            "title": doc.get("title"),
            "ai_sentiment_label": doc.get("ai_sentiment_label"),
            "structured_data": doc.get("structured_threat_data", {})
        })
        
    return {"status": "success", "data": threats}

@app.post("/api/scan")
def trigger_scan(request: ScanRequest):
    """Pushes a new URL into the Redis queue for the Scrapy fleet."""
    try:
        # Push the URL to the exact queue our Scrapy worker is listening to
        redis_client.lpush('intel_spider:start_urls', request.url)
        return {"status": "success", "message": f"URL {request.url} added to the scan queue."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scan/bulk")
def trigger_bulk_scan(request: BulkScanRequest):
    """Pushes multiple URLs into the Redis queue for the Scrapy fleet."""
    try:
        if not request.urls:
            raise HTTPException(status_code=400, detail="No URLs provided")

        redis_client.lpush('intel_spider:start_urls', *request.urls)
        return {
            "status": "success",
            "message": f"{len(request.urls)} targets deployed to the ingestion fleet.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)