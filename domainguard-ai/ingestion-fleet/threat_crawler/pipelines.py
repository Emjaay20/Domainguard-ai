import pymongo
from itemadapter import ItemAdapter
import logging

class MongoPipeline:
    collection_name = 'raw_html_dump'

    def __init__(self, mongo_uri, mongo_db):
        self.mongo_uri = mongo_uri
        self.mongo_db = mongo_db

    @classmethod
    def from_crawler(cls, crawler):
        # Pulls the URI and DB name from settings.py
        return cls(
            mongo_uri=crawler.settings.get('MONGO_URI'),
            mongo_db=crawler.settings.get('MONGO_DATABASE')
        )

    def open_spider(self, spider):
        # Opens connection to Docker MongoDB when spider starts
        self.client = pymongo.MongoClient(self.mongo_uri)
        self.db = self.client[self.mongo_db]

    def close_spider(self, spider):
        self.client.close()

    def process_item(self, item, spider):
        # Dumps the scraped dictionary into the database
        adapter = ItemAdapter(item)
        self.db[self.collection_name].insert_one(adapter.asdict())
        logging.info(f"Successfully inserted {item.get('url')} into MongoDB")
        return item
