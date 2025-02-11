import json
import logging
import redis
import pandas as pd
import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from app_config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RedisCache:
    def __init__(self, redis_url):
        self.redis_client = redis.from_url(redis_url)
        self.scheduler = BackgroundScheduler()
        self.scheduler.add_job(self.update_cache, 'interval', hours=24)
        self.scheduler.start()
        
    def get_api_url(self):
        past_date = (datetime.now() - timedelta(days=25)).strftime('%Y-%m-%d')
        return f"{settings.API_BASE_URL}?$filter=Posting_Date gt {past_date}"
    
    def fetch_from_api(self):
        try:
            api_url = self.get_api_url()
            logger.info(f"Fetching data from API: {api_url}")
            
            headers = {
                'User-Agent': 'PostmanRuntime/7.32.3',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            }
            
            response = requests.get(
                api_url,
                auth=HTTPBasicAuth(settings.API_USERNAME, settings.API_PASSWORD),
                headers=headers,
                verify=False,
                timeout=(30, 300)
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('value', [])
            else:
                logger.error(f"API returned status code: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching from API: {str(e)}")
            return None
    
    def update_cache(self):
        try:
            logger.info("Starting cache update")
            data = self.fetch_from_api()
            
            if data:
                self.redis_client.setex(
                    'sales_data',
                    settings.CACHE_TTL,
                    json.dumps({
                        'data': data,
                        'last_updated': datetime.now().isoformat()
                    })
                )
                logger.info(f"Cache updated successfully with {len(data)} records")
                return data
                
            return None
            
        except Exception as e:
            logger.error(f"Error updating cache: {str(e)}")
            return None
    
    def get_data(self):
        try:
            cached_data = self.redis_client.get('sales_data')
            if cached_data:
                logger.info("Retrieved data from cache")
                return json.loads(cached_data)['data']
                
            logger.info("Cache miss, fetching fresh data")
            return self.update_cache()
            
        except Exception as e:
            logger.error(f"Error retrieving data: {str(e)}")
            return None