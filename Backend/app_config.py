# app_config.py
import os

class Settings:
    def __init__(self):
        # Check if running on Render
        is_render = os.environ.get('RENDER') == 'true'
        
        if is_render:
            # When deployed on Render - use external Redis URL
            # Format: redis://default:password@red-xxxxx.render.com:6379
            self.REDIS_URL = 'rediss://red-cuk7ri2j1k6c73d4v930:HiA8X7KyTpqRbfRCCuVLNJ1i3x4mWQLj@oregon-redis.render.com:6379'  # Replace with your actual external Redis URL
        else:
            # When running locally
            self.REDIS_URL = 'redis://localhost:6379'
        
        # Other settings remain the same
        self.API_USERNAME = 'orientbell'
        self.API_PASSWORD = 'Orient@2023'
        self.API_BASE_URL = 'http://103.68.24.11:1048/BC220/ODataV4/Company(\'Orient%20Bell%20Limited\')/SalesData'
        self.CACHE_TTL = 24 * 60 * 60  # 24 hours in seconds

settings = Settings()