# app_config.py
import os

class Settings:
    def __init__(self):
        # Check if running on Render
        is_render = os.environ.get('RENDER') == 'true'
        
        # Use different Redis URLs based on environment
        if is_render:
            # When deployed on Render
            self.REDIS_URL = 'redis://red-cuk7ri2j1k6c73d4v930.internal:6379'  # Your Render internal Redis URL
        else:
            # When running locally
            self.REDIS_URL = 'redis://localhost:6379'
        
        # Other settings remain the same
        self.API_USERNAME = 'orientbell'
        self.API_PASSWORD = 'Orient@2023'
        self.API_BASE_URL = 'http://103.68.24.11:1048/BC220/ODataV4/Company(\'Orient%20Bell%20Limited\')/SalesData'
        self.CACHE_TTL = 24 * 60 * 60  # 24 hours in seconds

settings = Settings()