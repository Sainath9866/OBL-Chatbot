import os

class Settings:
    def __init__(self):
        # Get Redis URL from environment variables, fallback to localhost
        self.REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
        
        # Debugging: Print Redis URL in logs (Remove this after testing)
        print(f"Using Redis URL: {self.REDIS_URL}")

        self.API_USERNAME = "orientbell"
        self.API_PASSWORD = "Orient@2025"
        self.API_BASE_URL = "http://103.68.24.11:1048/BC220/ODataV4/Company('Orient%20Bell%20Limited')/SalesData"
        self.CACHE_TTL = 24 * 60 * 60  # 24 hours in seconds

settings = Settings()
