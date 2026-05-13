# DomainGuard AI 🛡️ 
**Enterprise Web Intelligence & Threat Monitor (Testing-as-a-Service)**

DomainGuard AI is a distributed, AI-native threat intelligence platform designed to ingest, analyze, and report on malicious web infrastructure in real-time. Built as a scalable Testing-as-a-Service (TaaS) architecture, it leverages a distributed scraping fleet, a high-throughput message broker, and a multimodal Local LLM engine to automate security advisories.

## 🚀 System Architecture

DomainGuard AI is built on a modular, microservice-based architecture to ensure high availability and parallel processing of target URLs.

* **The Ingestion Engine (Redis + Scrapy + Playwright):** A distributed headless web fleet capable of bypassing Cloudflare 403s and executing dynamic JavaScript to capture raw DOM payloads of suspected phishing sites.
* **The Routing Layer (FastAPI):** A high-performance Python API handling bulk target deployments and asynchronous task queuing via Redis.
* **The Intelligence Brain (LangChain + Llama 3):** A 3-layer semantic triage system (Whitelist -> Keyword Heuristics -> Local LLM Inference) that reads raw HTML and outputs structured JSON (Executive Summaries, Threat Scores, and Network Nodes).
* **The Data Lake (MongoDB):** NoSQL document storage handling raw HTML dumps and enriched JSON threat intelligence.
* **The Security Console (Next.js + Recharts):** A dark-mode, NOC-style Next.js dashboard featuring short-polling for real-time batch tracking, macro-level telemetry, and automated PDF incident reporting.

## ⚡ Core Capabilities

* **Distributed Bulk Scanning:** CISOs can deploy the scraping fleet against hundreds of targets simultaneously via CSV upload, with real-time tracking of queue status and AI processing.
* **Automated Incident Reporting:** Transforms raw LLM threat data into professional, branded, and exportable PDF Security Advisories with one click.
* **NOC Telemetry Dashboard:** Real-time data visualization featuring Threat Velocity area charts and global sentiment distributions to monitor campaign spikes.
* **Intelligent Edge Bypassing:** Configured to deliberately consume HTTP 403/405 error pages and Cloudflare challenge screens, treating anti-bot walls as actionable threat intelligence.

## 🛠️ Technology Stack

**Frontend:** Next.js (React), TailwindCSS, Recharts, React-Hot-Toast, React-to-Print
**Backend API:** FastAPI (Python), Uvicorn, Pydantic
**Ingestion Fleet:** Scrapy, Playwright, Twisted
**AI Enrichment:** Local Llama 3 (Ollama), LangChain, BeautifulSoup4
**Infrastructure:** Redis (Message Broker), MongoDB (Data Lake), Docker

## 🧠 The 3-Layer AI Triage System

To optimize compute and reduce false positives, the enrichment service routes targets through three phases:
1. **Known-Entity Whitelist:** Fast-paths legitimate infrastructure (e.g., AWS, GitHub).
2. **Heuristic Keyword Scanning:** Detects high-risk strings ("credential", "verify account").
3. **Deep LLM Analysis:** For unknown entities, Llama 3 executes a zero-shot prompt to semantically evaluate the DOM, extracting the threat actor, assigning a `Threat Score (0-100)`, mapping associated `Network Nodes`, and generating a C-suite `Executive Summary`.

## 💻 Local Development Setup

Ensure you have Docker, Node.js, Python 3.13+, and Ollama installed.

**1. Infrastructure (Terminal 1)**
```bash
# Start MongoDB and Redis containers
docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=supersecretpassword mongo
docker run -d -p 6379:6379 redis

```

**2. FastAPI Backend (Terminal 2)**

```bash
cd search-api
source venv/bin/activate
pip install -r requirements.txt
python main.py

```

**3. Ingestion Fleet (Terminal 3)**

```bash
cd ingestion-fleet
source venv/bin/activate
pip install -r requirements.txt
scrapy crawl intel_spider

```

**4. AI Enrichment Daemon (Terminal 4)**

```bash
cd ai-enrichment-service
source venv/bin/activate
pip install -r requirements.txt
ollama run llama3
python threat_parser.py

```

**5. Next.js Security Console (Terminal 5)**

```bash
cd web-dashboard
npm install
npm run dev

```

## 👨‍💻 Architect

**Yusuf Abubakar Saka**
Senior Systems Architect | AI Developer Experience (DX) Engineer
*Based in Abuja, Nigeria (EMEA/US Timezones)*
