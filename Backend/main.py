from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import google.generativeai as genai
from typing import List, Optional
import os



# Initialize FastAPI app and CORS
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'AIzaSyAyNic2Pn7o3oI573GR4EU2wX_-T-gT6xA')
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

class TileResponse(BaseModel):
    name: str
    price: float
    size: str
    url: str
    image_path: str
    category: str

class Message(BaseModel):
    type: str
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Message] = []

class ChatResponse(BaseModel):
    response: str
    suggested_options: Optional[List[str]] = None

class SizeRequest(BaseModel):
    category: str

class TileQuery(BaseModel):
    text: str

# Global DataFrame
df = None

def load_tiles_data():
    """
    Load and return the tiles data. If the global df is already loaded,
    return that instead of reloading from file.
    """
    global df
    if df is not None and not df.empty:
        return df
        
    try:
        df = pd.read_csv('tiles_2_final_data.csv')
        df['Price'] = df['Price'].str.extract(r'₹\s*(\d+)').astype(float)
        df['Category'] = df['Category'].str.lower()
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return pd.DataFrame()

# Initialize data when the application starts
@app.on_event("startup")
async def startup_event():
    global df
    df = load_tiles_data()

def generate_context(query: str) -> str:
    """Generate focused context based on query"""
    global df
    if df is None or df.empty:
        return ""
        
    # Extract key terms from query
    terms = query.lower().split()
    
    relevant_rows = df
    
    # Filter by category if mentioned
    if any(cat in query.lower() for cat in df['Category'].unique()):
        category = next(cat for cat in df['Category'].unique() if cat in query.lower())
        relevant_rows = df[df['Category'] == category]
    
    # Filter by price range if mentioned
    if 'budget' in query.lower() or 'cheap' in query.lower():
        relevant_rows = df[df['Price'] <= 100]
    elif 'premium' in query.lower() or 'expensive' in query.lower():
        relevant_rows = df[df['Price'] > 100]
    
    # Return concise context
    context_items = relevant_rows.head(5).apply(
        lambda x: f"{x['Name']}: ₹{x['Price']:.0f}/sq ft ({x['Size']})", 
        axis=1
    ).tolist()
    
    return '; '.join(context_items)

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat endpoint for tile store assistance"""
    global df
    try:
        # Check if data is loaded
        if df is None or df.empty:
            return ChatResponse(
                response="Sorry, tile database is currently unavailable.",
                suggested_options=None
            )

        # Generate context
        context = generate_context(request.message)

        # Generate prompt
        prompt = f"""
        Context: {context}
        User: {request.message}
        
        Instructions:
        1. You are a tile store expert. Give direct, brief answers in 2-3 sentences max.
        2. Format prices as ₹XX.
        3. If mentioning a tile, include: name, price, size only.
        4. For alternatives, suggest max 2 options.
        5. Add "Prices may vary" only when discussing specific prices.
        """

        # Generate response
        response = model.generate_content(prompt)

        # Generate suggested options
        suggested_options = []
        if "category" in request.message.lower():
            suggested_options = df['Category'].unique().tolist()[:3]
        elif "price" in request.message.lower():
            suggested_options = ["Budget (Below ₹100)", "Premium (Above ₹100)"]

        return ChatResponse(
            response=response.text,
            suggested_options=suggested_options if suggested_options else None
        )

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Sorry, something went wrong. Please try again."
        )

@app.post("/size")
async def get_sizes(request: SizeRequest):
    global df
    try:
        if df is None or df.empty:
            raise HTTPException(status_code=500, detail="Tile database is not loaded")
            
        category = request.category.lower()
        sizes = df[df['Category'] == category]['Size'].unique().tolist()
        sizes = [size for size in sizes if pd.notna(size)]
        return {"sizes": sizes}
    except Exception as e:
        print(f"Error in get_sizes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tiles")
async def get_tiles(category: str, size: str):
    global df
    try:
        if df is None or df.empty:
            raise HTTPException(status_code=500, detail="Tile database is not loaded")
            
        filtered_df = df[
            (df['Category'] == category) &
            (df['Size'] == size)
        ]
        
        if filtered_df.empty:
            raise HTTPException(status_code=404, detail="No tiles found matching the criteria")
            
        # Convert the filtered data to the response format
        tiles = []
        for _, row in filtered_df.iterrows():
            tile = TileResponse(
                name=row['Name'],
                price=row['Price'],
                size=row['Size'],
                url=row['URL'],
                image_path=row['Image Path'],
                category=row['Category']
            )
            tiles.append(tile.dict())
            
        return {"tiles": tiles}
        
    except Exception as e:
        print(f"Error in get_tiles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class TileQuery(BaseModel):
    text: str

@app.post("/name")
async def name_endpoint(query: TileQuery):
    global df
    try:
        if df is None or df.empty:
            raise HTTPException(status_code=500, detail="Tile database is not loaded")
            
        query_lower = query.text.lower()
        df_copy = df.copy()
        df_copy['Name_lower'] = df_copy['Name'].str.lower()
        
        matches = df_copy[df_copy['Name_lower'].str.contains(query_lower, na=False, regex=False)]
        
        if len(matches) > 0:
            tile_info = matches.iloc[0].to_dict()
            tile_info = {k: ('' if pd.isna(v) else v) for k, v in tile_info.items()}
            
            return {
                "status": "success",
                "message": "Tile information found",
                "data": {
                    "name": tile_info['Name'],
                    "url": tile_info['URL'],
                    "size": tile_info['Size'],
                    "price": tile_info['Price'],
                    "image_url": tile_info['Image URL'],
                    "image_path": tile_info['Image Path'],
                    "category": tile_info['Category']
                }
            }
        
        return {
            "status": "not_found",
            "message": "No matching tile found",
            "data": None
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/general")
async def general_endpoint(query: dict):
    try:
        user_text = query.get('text', '')
        if not user_text:
            raise HTTPException(status_code=400, detail="Query text is required")
        
        # Check if query contains tile names
        if any(tile_name.lower() in user_text.lower() for tile_name in df['Name']):
            response = await name_endpoint(query)
        else:
            # Route to chat or other endpoints
            response = await chat_endpoint(query)
        
        return {
            "endpoint_used": "name" if response.get("data") else "chat",
            "response": response,
            "original_query": user_text
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
