import json
import logging
import redis
import pandas as pd
import requests
from requests.auth import HTTPBasicAuth
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from app_config import settings
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RedisCache:
    def __init__(self, redis_url):
        self.redis_client = redis.from_url(redis_url)
        self.scheduler = BackgroundScheduler()
        self.scheduler.add_job(self.update_cache, 'interval', hours=24)
        self.scheduler.start()
        
        # Configure retry strategy
        self.session = requests.Session()
        retries = Retry(
            total=3,  # number of retries
            backoff_factor=0.5,  # wait 0.5, 1, 2 seconds between retries
            status_forcelist=[500, 502, 503, 504],
            allowed_methods={"GET"}
        )
        adapter = HTTPAdapter(max_retries=retries)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
    def get_api_url(self):
        past_date = (datetime.now() - timedelta(days=25)).strftime('%Y-%m-%d')
        return f"{settings.API_BASE_URL}?$filter=Posting_Date gt {past_date}"
    
    def fetch_from_api(self):
        try:
            api_url = self.get_api_url()
            logger.info(f"Fetching data from API: {api_url}")
            
            headers = {
                'User-Agent': 'PostmanRuntime/7.32.3',
                'Accept': 'application/json',  # Explicitly request JSON
                'Accept-Encoding': 'gzip, deflate',  # Removed 'br' to simplify
                'Connection': 'keep-alive'
            }
            
            # Reduced timeout values
            response = self.session.get(
                api_url,
                auth=HTTPBasicAuth(settings.API_USERNAME, settings.API_PASSWORD),
                headers=headers,
                verify=False,
                timeout=(10, 30)  # (connect timeout, read timeout)
            )
            
            # Log response details
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    response_text = response.text
                    if not response_text.strip():
                        logger.error("Empty response received from API")
                        return None
                        
                    data = response.json()
                    return data.get('value', [])
                except json.JSONDecodeError as je:
                    logger.error(f"JSON decode error: {str(je)}")
                    logger.error(f"Raw response content: {response_text[:500]}")
                    return None
            else:
                logger.error(f"API error status {response.status_code}: {response.text[:500]}")
                return None
                    
        except requests.exceptions.ConnectTimeout:
            logger.error("Connection timeout while connecting to API")
            return None
        except requests.exceptions.ReadTimeout:
            logger.error("Read timeout while fetching data from API")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return None

    def update_cache(self):
        try:
            logger.info("Starting cache update")
            data = self.fetch_from_api()
            
            if data:
                cache_data = {
                    'data': data,
                    'last_updated': datetime.now().isoformat()
                }
                self.redis_client.setex(
                    'sales_data',
                    settings.CACHE_TTL,
                    json.dumps(cache_data)
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