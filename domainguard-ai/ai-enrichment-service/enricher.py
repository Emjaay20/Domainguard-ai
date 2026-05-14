import os
import pymongo
import logging
from bs4 import BeautifulSoup
from transformers import pipeline

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# 1. Connect to our Dockerized MongoDB
MONGO_URI = os.getenv("MONGO_URI", 'mongodb://admin:supersecretpassword@mongodb:27017/')
client = pymongo.MongoClient(MONGO_URI)
db = client['domainguard_raw_intel']
collection = db['raw_html_dump']

# 2. Load the Hugging Face Sentiment Analysis Model
logging.info("Loading Hugging Face NLP Pipeline...")
# This uses the default distilbert model for sentiment analysis
sentiment_analyzer = pipeline("sentiment-analysis")
logging.info("Model loaded successfully.")

def clean_html(raw_html):
    """Strips HTML tags and returns plain text."""
    soup = BeautifulSoup(raw_html, "html.parser")
    # For a tech forum like Hacker News, we grab the text from links/titles
    text = soup.get_text(separator=' ', strip=True)
    # Truncate to the first 500 characters so we don't overload the LLM token limit
    return text[:500] 

def process_next_item():
    # 3. Find one item that hasn't been processed by the AI yet
    target = collection.find_one({"status": "unprocessed"})
    
    if not target:
        logging.info("No unprocessed items found in the queue.")
        return

    logging.info(f"Processing URL: {target.get('url')}")
    
    # 4. Clean the raw HTML
    clean_text = clean_html(target.get('raw_html', ''))
    
    # 5. Run the Hugging Face Model
    try:
        ai_result = sentiment_analyzer(clean_text)[0]
        logging.info(f"AI Analysis Complete: {ai_result}")
        
        # 6. Update the MongoDB document with the AI enrichment
        collection.update_one(
            {"_id": target["_id"]},
            {"$set": {
                "status": "processed",
                "clean_text": clean_text,
                "ai_sentiment_label": ai_result['label'],
                "ai_sentiment_score": ai_result['score']
            }}
        )
        logging.info("MongoDB record successfully updated with AI enrichment.")
        
    except Exception as e:
        logging.error(f"AI Processing failed: {e}")

if __name__ == "__main__":
    process_next_item()