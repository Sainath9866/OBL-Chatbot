from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import google.generativeai as genai
from typing import List, Optional
import os
import re

# Pydantic models for request/response
class Message(BaseModel):
    type: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Message] = []

class ChatResponse(BaseModel):
    response: str
    suggested_options: Optional[List[str]] = None

# Initialize FastAPI app
app = FastAPI(
    title="Tile Store Chatbot API",
    description="API for interacting with a tile store chatbot",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'AIzaSyAyNic2Pn7o3oI573GR4EU2wX_-T-gT6xA')
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

def clean_price(price_str):
    """Extract numeric price from price string"""
    try:
        if pd.isna(price_str):
            return None
        # Extract number from strings like "MRP ? 70 /- Sq.ft"
        match = re.search(r'(\d+)', str(price_str))
        if match:
            return float(match.group(1))
        return None
    except:
        return None

def clean_size(size_str):
    """Extract size information from size string"""
    try:
        if pd.isna(size_str) or size_str == 'false ft':
            return None
        # Extract size from strings like "Size 300x450 mm ft"
        match = re.search(r'(\d+x\d+)', str(size_str))
        if match:
            return match.group(1)
        return None
    except:
        return None

def load_tiles_data():
    """Load and process the tiles data"""
    try:
        # Read CSV file
        df = pd.read_csv('All-Tiles.csv')
        
        # Remove empty rows
        df = df.dropna(how='all')
        
        # Rename columns to match the actual CSV structure
        df.columns = ['Category', 'Tile_Name', 'Price', 'Size']
        
        # Clean price and size data
        df['Price_Value'] = df['Price'].apply(clean_price)
        df['Size_Value'] = df['Size'].apply(clean_size)
        
        # Remove rows with invalid prices
        df = df[df['Price_Value'].notna()]
        
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return pd.DataFrame(columns=['Category', 'Tile_Name', 'Price', 'Size', 'Price_Value', 'Size_Value'])

def generate_context(df: pd.DataFrame, query: str) -> str:
    """Generate context for the chatbot based on the query"""
    try:
        context = "Available tile information:\n\n"
        query = query.lower()
        
        if "price" in query or "cost" in query:
            context += "Price ranges by category:\n"
            for category in df['Category'].unique():
                if pd.isna(category):
                    continue
                category_df = df[df['Category'] == category]
                prices = category_df['Price_Value'].dropna()
                if not prices.empty:
                    context += f"{category}: ₹{prices.min():.0f} to ₹{prices.max():.0f} per sq.ft\n"
        
        for category in df['Category'].unique():
            if pd.isna(category):
                continue
            if category.lower() in query.lower():
                tiles = df[df['Category'] == category]
                context += f"\n{category} Options:\n"
                for _, tile in tiles.head().iterrows():
                    if pd.notna(tile['Price_Value']):
                        size_info = f" - {tile['Size_Value']}" if pd.notna(tile['Size_Value']) else ""
                        context += f"- {tile['Tile_Name']}{size_info} - ₹{tile['Price_Value']:.0f}/sq.ft\n"
        
        return context
    except Exception as e:
        print(f"Error generating context: {e}")
        return "Error generating tile information. Please try again."

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat endpoint for tile store assistance"""
    try:
        # Load and validate data
        df = load_tiles_data()
        if df.empty:
            return ChatResponse(
                response="I apologize, but I'm currently unable to access the tile database. Please try again later.",
                suggested_options=None
            )
        
        # Generate context
        context = generate_context(df, request.message)
        
        # Format conversation history
        conversation = "\n".join([
            f"{'Assistant' if msg.type == 'bot' else 'User'}: {msg.content}"
            for msg in request.conversation_history
        ])
        
        # Generate prompt
        prompt = f"""
        Context: {context}
        Previous conversation: {conversation}
        User: {request.message}
        Instructions:
        - Act as a knowledgeable tile store assistant
        - Keep responses concise and focused on tiles
        - Mention that prices are subject to change
        - Suggest similar alternatives when discussing specific tiles
        """
        
        # Generate response
        response = model.generate_content(prompt)
        
        # Generate suggested options
        suggested_options = []
        if any(word in request.message.lower() for word in ["category", "types"]):
            suggested_options = [cat for cat in df['Category'].unique() if pd.notna(cat)]
        elif "price" in request.message.lower():
            suggested_options = ["Budget Tiles (Below ₹100)", "Premium Tiles (Above ₹100)", "View Price List"]
        
        return ChatResponse(
            response=response.text,
            suggested_options=suggested_options if suggested_options else None
        )
    
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your request: {str(e)}"
        )

# Add a test endpoint
@app.get("/test")
async def test_endpoint():
    """Test endpoint to verify API is working"""
    df = load_tiles_data()
    return {
        "status": "API is running",
        "data_loaded": not df.empty,
        "categories": [cat for cat in df['Category'].unique() if pd.notna(cat)]
    }