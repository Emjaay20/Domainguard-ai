import scrapy
from scrapy_redis.spiders import RedisSpider
from datetime import datetime

# Notice we inherit from RedisSpider now, not scrapy.Spider
class IntelSpider(RedisSpider):
    name = "intel_spider"
    
    # This is the name of the Redis queue the spider will listen to
    redis_key = 'intel_spider:start_urls'

    # We use make_request_from_data to intercept the URL from Redis 
    # and attach the Playwright meta tag to it before sending the request.
    def make_request_from_data(self, data):
        url = data.decode('utf-8')
        # We add dont_filter=True so we can re-scan threats multiple times
        # We also allow 403, 404, and other error responses to reach parse()
        return scrapy.Request(
            url,
            meta={"playwright": True, "handle_httpstatus_list": [403, 404, 405]},
            callback=self.parse,
            dont_filter=True
        )

    def parse(self, response):
        page_title = response.css('title::text').get()
        raw_html = response.text

        payload = {
            "url": response.url,
            "title": page_title,
            "scraped_at": datetime.utcnow().isoformat(),
            "http_status": response.status,
            "raw_html": raw_html,
            "status": "unprocessed"
        }

        yield payload
