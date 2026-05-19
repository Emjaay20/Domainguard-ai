import os
import pymongo
import logging
import time
from bs4 import BeautifulSoup
from langchain_ollama import ChatOllama # Updated import!
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

MONGO_URI = os.getenv("MONGO_URI", 'mongodb://admin:supersecretpassword@localhost:27017/?authSource=admin')
client = pymongo.MongoClient(MONGO_URI)
db = client['domainguard_raw_intel']
collection = db['raw_html_dump']

logging.info("Connecting to Local Llama 3 Model...")
ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
llm = ChatOllama(model="llama3", base_url=ollama_host, format="json", temperature=0)

# --- THE UPGRADED ENTERPRISE PROMPT ---
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an elite Cyber Threat Intelligence Analyst. 
    Analyze the following URL, HTTP status, and scraped website text. Output ONLY valid JSON matching this exact schema:
    {{
        "author": "string or null",
        "main_topic": "string",
        "extracted_urls": ["string"],
        "threat_score": <integer between 0 and 100, where 100 is a critical threat>,
        "network_nodes": ["list of key entities like IPs, associated domains, or organization names found"],
        "executive_summary": "A 3 to 5 sentence professional briefing summarizing the site's content, purpose, and specific threat context."
    }}"""),
    ("human", "URL: {url}\nHTTP_STATUS: {http_status}\nSCRAPED_TEXT:\n{text}")
])

parser = JsonOutputParser()
chain = prompt | llm | parser

# --- LAYER 1 & 2: QUICK TRIAGE ---
SAFE_DOMAINS = ["google.com", "github.com", "example.com", "wikipedia.org"]
THREAT_KEYWORDS = ["phishing", "malware", "verify account", "login credential", "urgent action required"]
PHISHING_KEYWORDS = ["phishing", "credential", "password", "account locked", "verify account", "login", "secure your account"]
ERROR_PAGE_PATTERNS = [
    "site not found",
    "page not found",
    "404 not found",
    "server not found",
    "this site can't be reached",
    "this site cannot be reached",
    "dns_probe_finished",
    "domain is for sale",
    "buy this domain",
    "access denied",
    "temporarily unavailable",
    "service unavailable",
    "error 404",
    "error 403",
    "not available",
]


def score_to_sentiment(score):
    if score > 75:
        return "NEGATIVE"
    if score > 40:
        return "NEUTRAL"
    return "BENIGN"


def detect_availability_risk(http_status, text):
    """Detect non-content/error pages so they do not get treated as benign web content."""
    flags = []
    text_lower = text.lower()

    if isinstance(http_status, int) and http_status >= 400:
        flags.append(f"http_status_{http_status}")

    if len(text.strip()) < 120:
        flags.append("thin_or_empty_content")

    matched_patterns = [pattern for pattern in ERROR_PAGE_PATTERNS if pattern in text_lower]
    if matched_patterns:
        flags.append("availability_error_page")

    return flags, matched_patterns


def detect_url_risk(url):
    """Lexical URL checks for obvious brand-spoofing and credential-harvest patterns."""
    url_lower = (url or "").lower()
    flags = []

    if "xn--" in url_lower:
        flags.append("punycode_domain")

    suspicious_terms = ["login", "signin", "verify", "secure", "wallet", "auth"]
    brand_terms = ["coinbase", "metamask", "binance", "paypal", "microsoft", "apple", "google"]

    has_suspicious_term = any(term in url_lower for term in suspicious_terms)
    has_brand_term = any(term in url_lower for term in brand_terms)

    if has_suspicious_term and has_brand_term:
        flags.append("brand_spoof_pattern")

    return flags

def quick_triage(url, text):
    """Checks the whitelist and basic keywords before asking the LLM."""
    if any(safe in url.lower() for safe in SAFE_DOMAINS):
        return "BENIGN"
    
    text_lower = text.lower()
    keyword_hits = sum(1 for word in THREAT_KEYWORDS if word in text_lower)
    phishing_hits = sum(1 for word in PHISHING_KEYWORDS if word in text_lower)

    if phishing_hits > 0:
        return "NEGATIVE"

    if keyword_hits >= 3:
        return "NEGATIVE"
    elif keyword_hits > 0:
        return "NEUTRAL"
    return "UNKNOWN" # Let the LLM decide

def clean_html(raw_html):
    soup = BeautifulSoup(raw_html, "html.parser")
    return soup.get_text(separator=' ', strip=True)[:3000] # Expanded context window

def process_next_item():
    target = collection.find_one({"status": "unprocessed"})
    
    if not target:
        return False 

    url = target.get('url', '')
    http_status = target.get('http_status')
    logging.info(f"Analyzing Target: {url}")
    clean_text = clean_html(target.get('raw_html', ''))
    availability_flags, matched_patterns = detect_availability_risk(http_status, clean_text)
    url_risk_flags = detect_url_risk(url)
    
    try:
        logging.info("Running LLM Deep Extraction & Summary...")
        structured_data = chain.invoke(
            {
                "url": url,
                "http_status": http_status if http_status is not None else "unknown",
                "text": clean_text,
            }
        )
        logging.info("LLM Extraction Complete.")
        
        # Start with LLM score, then enforce deterministic guardrails for fetch/error pages.
        original_score = int(structured_data.get("threat_score", 0) or 0)
        adjusted_score = original_score

        if availability_flags:
            adjusted_score = max(adjusted_score, 45)
            structured_data["analysis_flags"] = availability_flags
            if matched_patterns:
                structured_data["availability_matches"] = matched_patterns[:6]

        if url_risk_flags:
            adjusted_score = max(adjusted_score, 80)
            existing_flags = structured_data.get("analysis_flags", [])
            structured_data["analysis_flags"] = list(dict.fromkeys(existing_flags + url_risk_flags))

        if adjusted_score != original_score:
            structured_data["original_threat_score"] = original_score
            structured_data["threat_score"] = adjusted_score

        sentiment = score_to_sentiment(adjusted_score)

        collection.update_one(
            {"_id": target["_id"]},
            {"$set": {
                "status": "parsed",
                "ai_sentiment_label": sentiment,
                "structured_threat_data": structured_data
            }}
        )
        logging.info(
            f"Target locked and filed as {sentiment} (threat_score: {adjusted_score}/100, original: {original_score}/100)."
        )
        return True
        
    except Exception as e:
        logging.error(f"LLM Parsing failed: {e}")
        return False

if __name__ == "__main__":
    logging.info("DomainGuard AI Brain is online. Monitoring queue...")
    while True:
        found_item = process_next_item()
        if not found_item:
            time.sleep(3)