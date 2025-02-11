from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import google.generativeai as genai
from typing import Dict,List, Optional
import os
from pydantic import BaseModel
from pathlib import Path
from dotenv import load_dotenv
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import requests
from requests.auth import HTTPBasicAuth
import logging
from fastapi.responses import JSONResponse
from fastapi import BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
from requests.auth import HTTPBasicAuth
import json
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler


load_dotenv()


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


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app_config import settings
from cache_handler import RedisCache
from pydantic import BaseModel
import pandas as pd

class StateRequest(BaseModel):
    state: str

class LocationRequest(BaseModel):
    state: str
    city: str

def clean_description(desc1, desc2):
    """Clean and combine tile descriptions"""
    if pd.isna(desc1) or pd.isna(desc2):
        return None
    combined = f"{desc1} {desc2}".strip()
    return combined if combined else None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cache = RedisCache(settings.REDIS_URL)

@app.get("/states")
async def get_states():
    try:
        data = cache.get_data()
        if not data:
            raise HTTPException(status_code=500, detail="Unable to fetch data")
        
        df = pd.DataFrame(data)
        states = sorted([state for state in df['State_Desc'].unique().tolist() if state])
        
        return {"states": states}
    except Exception as e:
        logger.error(f"Error in get_states: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cities")
async def get_cities(request: StateRequest):
    try:
        data = cache.get_data()
        if not data:
            raise HTTPException(status_code=500, detail="Unable to fetch data")
        
        df = pd.DataFrame(data)
        state_data = df[df['State_Desc'] == request.state]
        cities = sorted([city for city in state_data['Sell_to_City'].unique().tolist() if city])
        
        return {
            "cities": cities,
            "count": len(cities)
        }
    except Exception as e:
        logger.error(f"Error in get_cities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fetch-names")
async def fetch_names(request: LocationRequest):
    try:
        data = cache.get_data()
        if not data:
            raise HTTPException(status_code=500, detail="Unable to fetch data")
        
        df = pd.DataFrame(data)
        filtered_data = df[
            (df['State_Desc'] == request.state) & 
            (df['Sell_to_City'] == request.city)
        ]
        
        if len(filtered_data) == 0:
            return {
                "tiles": [],
                "message": f"No tiles found for state: {request.state} and city: {request.city}"
            }
        
        tile_quantities = {}
        for _, row in filtered_data.iterrows():
            if pd.notna(row['Description']) and pd.notna(row['Description_2']):
                clean_name = clean_description(row['Description'], row['Description_2'])
                if clean_name:
                    quantity = float(row['Qty_Crt']) if pd.notna(row['Qty_Crt']) else 0
                    tile_quantities[clean_name] = tile_quantities.get(clean_name, 0) + quantity
        
        tiles_list = [
            {"name": name, "quantity": round(quantity, 2)}
            for name, quantity in tile_quantities.items()
        ]
        
        tiles_list.sort(key=lambda x: x['quantity'], reverse=True)
        
        return {
            "tiles": tiles_list,
            "total_unique_tiles": len(tiles_list),
            "total_quantity": round(sum(tile['quantity'] for tile in tiles_list), 2)
        }
    except Exception as e:
        logger.error(f"Error in fetch_names: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def calculate_word_overlap(name1: str, name2: str) -> int:
    """Calculate number of common words between two names"""
    # Convert to lowercase and split into words
    words1 = set(name1.lower().split())
    words2 = set(name2.lower().split())
    # Return number of common words
    return len(words1.intersection(words2))



class TileNamesRequest(BaseModel):
    tile_names: List[str]

@app.post("/fetch_sales_data")
async def fetch_sales_data(request: TileNamesRequest):
    """Fetch complete tile data for given tile names with flexible matching"""
    try:
        # Load the data
        df = load_tiles_data()
        if df is None or df.empty:
            logger.error("Tile database is not loaded")
            raise HTTPException(status_code=500, detail="Tile database is not loaded")
        
        logger.info(f"Searching for {len(request.tile_names)} tile names")
        
        # Store matching rows
        matching_rows = []
        
        # For each requested tile name
        for requested_name in request.tile_names:
            # Check each row in the database
            for _, row in df.iterrows():
                db_name = str(row['name'])
                # Calculate word overlap
                common_words = calculate_word_overlap(requested_name, db_name)
                # If more than 3 words match, consider it a match
                if common_words > 3:
                    matching_rows.append(row)
        
        # Convert to DataFrame if we found matches
        filtered_df = pd.DataFrame(matching_rows)
        
        if filtered_df.empty:
            logger.warning("No matching tiles found")
            return JSONResponse(content={
                "tiles": [],
                "message": "No matching tiles found"
            })
        
        # Convert matching rows to response format
        tiles = []
        for _, row in filtered_df.iterrows():
            try:
                tile = {
                    "id": str(row['id']),
                    "name": str(row['name']),
                    "description": str(row['description']),
                    "material": str(row['material']),
                    "finish": str(row['finish']),
                    "size": str(row['size']),
                    "price": float(row['price']) if pd.notna(row['price']) else 0.0,
                    "price_unit": str(row['price_unit']),
                    "design_types": str(row['design_types']),
                    "applications": str(row['applications']),
                    "quantity_per_box": float(row['quantity_per_box']) if pd.notna(row['quantity_per_box']) else None,
                    "area_per_box": float(row['area_per_box']) if pd.notna(row['area_per_box']) else None,
                    "area_unit": str(row['area_unit']),
                    "faces": int(row['faces']) if pd.notna(row['faces']) else None,
                    "origin": str(row['origin']),
                    "laying_patterns": str(row['laying_patterns']),
                    "product_url": str(row['product_url']),
                    "image_url": str(row['image_url']),
                    "image_path": str(row['image_path'])
                }
                tiles.append(tile)
                logger.info(f"Successfully processed tile: {row['name']}")
            
            except Exception as e:
                logger.error(f"Error processing tile {row['name']}: {str(e)}")
                continue
        
        response = {
            "tiles": tiles
        }
        
        logger.info(f"Successfully returning {len(tiles)} tiles")
        return JSONResponse(content=response)
        
    except Exception as e:
        logger.error(f"Error in fetch_sales_data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )
@app.post("/general")
async def general_endpoint(query: dict):
    try:
        user_text = query.get('text', '')
        if not user_text:
            raise HTTPException(status_code=400, detail="Query text is required")
        
        # Check if query contains tile names
        if any(tile_name.lower() in user_text.lower() for tile_name in df['name']):
            response = await name_endpoint(TileQuery(text=user_text))
        else:
            # Route to chat endpoint
            response = await chat_endpoint(ChatRequest(message=user_text))
        
        return {
            "endpoint_used": "name" if isinstance(response, dict) and response.get("data") else "chat",
            "response": response,
            "original_query": user_text
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TileResponse(BaseModel):
    id: str
    name: str
    description: str
    material: str
    finish: str
    size: str
    price: float
    price_unit: str
    design_types: str
    applications: str
    quantity_per_box: Optional[float]
    area_per_box: Optional[float]
    area_unit: str
    faces: Optional[int]
    origin: str
    laying_patterns: str
    product_url: str
    image_url: str
    image_path: str

class Message(BaseModel):
    type: str
    content: str


class SizeRequest(BaseModel):
    category: Optional[str] = None
    material: Optional[str] = None
    design_types: Optional[str] = None
    finish: Optional[str] = None

class TileQuery(BaseModel):
    text: str


# Global DataFrame
df = None

def load_tiles_data():
    """
    Load and return the tiles data with the new CSV structure
    """
    global df
    if df is not None and not df.empty:
        return df
        
    try:
        df = pd.read_csv('tiles_data_fixed.csv')
        # Convert price to float, removing any currency symbols
        df['price'] = pd.to_numeric(df['price'], errors='coerce')
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
    """Generate focused context based on query including descriptions"""
    global df
    if df is None or df.empty:
        return ""
        
    # Extract key terms from query
    terms = query.lower().split()
    
    relevant_rows = df
    
    # Filter by material if mentioned
    if any(mat in query.lower() for mat in df['material'].unique()):
        material = next(mat for mat in df['material'].unique() if mat in query.lower())
        relevant_rows = df[df['material'] == material]
    
    # Filter by price range if mentioned
    if 'budget' in query.lower() or 'cheap' in query.lower():
        relevant_rows = df[df['price'] <= 100]
    elif 'premium' in query.lower() or 'expensive' in query.lower():
        relevant_rows = df[df['price'] > 100]
    
    # Return context with descriptions
    context_items = relevant_rows.head(5).apply(
        lambda x: f"{x['name']} ({x['material']}): {x['price']} {x['price_unit']} - {x['description'][:100]}...", 
        axis=1
    ).tolist()
    
    return '; '.join(context_items)

class QuestionRequest(BaseModel):
    question: str

class QuestionResponse(BaseModel):
    answer: str
    relevant_tiles: List[dict]

def clean_text(text: str) -> str:
    """Clean and prepare text for searching"""
    if pd.isna(text) or not isinstance(text, str):
        return ""
    return str(text).lower().strip()

def search_tiles(df: pd.DataFrame, query: str) -> List[dict]:
    """
    Two-stage search function:
    Stage 1: Quick filtering based on basic criteria
    Stage 2: Cosine similarity ranking on filtered subset
    """
    query = clean_text(query)
    
    # STAGE 1: Quick Filtering
    # Initialize base mask
    base_mask = pd.Series([True] * len(df), index=df.index)
    
    # Extract key information from query using regex
    patterns = {
        'price': r'(?:below|under|less than)\s*(\d+)',
        'size': r'(\d+)[\sx*×](\d+)',
        'material': r'(?:ceramic|porcelain|marble|granite|vitrified)',
        'application': r'(?:bathroom|kitchen|living|bedroom|outdoor|indoor|wall|floor)',
        'color': r'(?:white|black|grey|gray|beige|brown|blue|green|red)',
        'finish': r'(?:matt|gloss|polished|rustic|textured)'
    }
    
    # Apply first-stage filters
    matches = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, query)
        if match:
            matches[key] = match
            
            if key == 'price':
                price_limit = float(match.group(1))
                base_mask &= df['price'] <= price_limit
            
            elif key == 'size':
                width, height = match.groups()
                size_variants = [f"{width}x{height}", f"{width}×{height}", f"{width} x {height}"]
                base_mask &= df['size'].str.contains('|'.join(size_variants), case=False, na=False, regex=True)
            
            elif key == 'material':
                material = match.group()
                base_mask &= df['material'].str.contains(material, case=False, na=False)
            
            elif key == 'application':
                application = match.group()
                base_mask &= df['applications'].str.contains(application, case=False, na=False)
            
            elif key == 'color':
                color = match.group()
                base_mask &= df['name'].str.contains(color, case=False, na=False)
            
            elif key == 'finish':
                finish = match.group()
                base_mask &= df['finish'].str.contains(finish, case=False, na=False)
    
    # Get filtered subset
    filtered_df = df[base_mask].copy()
    
    # If filtered set is too small, use original dataset
    if len(filtered_df) < 10:
        filtered_df = df
    
    # STAGE 2: Cosine Similarity Ranking
    # Prepare search text with weighted fields
    filtered_df['search_text'] = (
        (filtered_df['description'].apply(clean_text) + ' ') * 3 +  # Weight description more
        filtered_df['name'].apply(clean_text) + ' ' +
        filtered_df['material'].apply(clean_text) + ' ' +
        filtered_df['applications'].apply(clean_text) + ' ' +
        filtered_df['design_types'].apply(clean_text) + ' ' +
        filtered_df['finish'].apply(clean_text)
    )
    
    try:
        # Create TF-IDF vectorizer with n-grams
        vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 3),  # Include phrases up to 3 words
            max_features=5000
        )
        
        # Calculate TF-IDF and similarity scores
        tfidf_matrix = vectorizer.fit_transform(filtered_df['search_text'].values.astype('U'))
        query_vec = vectorizer.transform([query])
        similarity_scores = cosine_similarity(query_vec, tfidf_matrix)[0]
        
        # Get top matches
        top_indices = np.argsort(similarity_scores)[::-1][:50]  # Get top 50 matches
        matching_tiles = filtered_df.iloc[top_indices].to_dict('records')
        
        # Add similarity scores to results
        for tile in matching_tiles:
            idx = filtered_df.index[filtered_df['id'] == tile['id']].tolist()[0]
            tile['relevance_score'] = float(similarity_scores[idx])
        
        # Filter out low relevance scores
        matching_tiles = [tile for tile in matching_tiles if tile['relevance_score'] > 0.05]
        
        return matching_tiles
        
    except Exception as e:
        print(f"Error in similarity calculation: {str(e)}")
        return filtered_df.head(50).to_dict('records')  # Fallback to filtered results

def format_answer(tiles: List[dict]) -> str:
    """
    Format the answer with relevance scores
    """
    if not tiles:
        return "I couldn't find any tiles matching your requirements. Could you please try with different criteria?"
    
    answer = f"Found {len(tiles)} relevant tiles. Here are the best matches:\n\n"
    
    for i, tile in enumerate(tiles, 1):
        relevance = round(tile.get('relevance_score', 0) * 100, 1)
        answer += f"{i}. **{tile['name']}** (Match: {relevance}%)\n"
        
        if tile['description']:
            desc = tile['description'][:200]
            answer += f"   Description: {desc}...\n"
        
        answer += f"   Material: {tile['material']}\n"
        answer += f"   Size: {tile['size']}\n"
        
        if tile['price'] > 0:
            answer += f"   Price: {tile['price']} {tile['price_unit']}\n"
        
        if tile['applications']:
            answer += f"   Recommended for: {tile['applications']}\n"
        
        answer += "\n"
    
    return answer

import google.generativeai as genai

# Configure Gemini API
genai.configure(api_key='YOUR_GEMINI_API_KEY')

def handle_query(df: pd.DataFrame, query: str) -> QuestionResponse:
    """
    Intelligently handle queries by:
    1. Checking if query is tile-related
    2. Using tile search if relevant
    3. Using Gemini for general knowledge queries
    """
    # List of tile-related keywords
    tile_keywords = [
        'tile', 'tiles', 'flooring', 'ceramic', 'porcelain', 
        'design', 'material', 'price', 'size', 'finish'
    ]
    
    # Check if query is tile-related
    is_tile_related = any(keyword in query.lower() for keyword in tile_keywords)
    
    if is_tile_related:
        # Existing tile search logic
        relevant_tiles = search_tiles(df, query)
        answer = format_answer(relevant_tiles)
        
        return QuestionResponse(
            answer=answer,
            relevant_tiles=relevant_tiles
        )
    else:
        # Use Gemini for non-tile queries
        try:
            model = genai.GenerativeModel('gemini-pro')
            gemini_response = model.generate_content(
                f"Please provide a brief, contextual response to redirect the query. The question is: {query}. "
                "If it's not related to tiles, suggest asking about tiles."
            )
            
            answer = gemini_response.text or "I'm designed to help with tile-related queries. Would you like to ask about tiles?"
            
            return QuestionResponse(
                answer=answer,
                relevant_tiles=[]
            )
        except Exception as e:
            # Fallback response
            return QuestionResponse(
                answer="I'm primarily designed to help with tile-related queries. Could you ask me something about tiles?",
                relevant_tiles=[]
            )

@app.post("/chat", response_model=QuestionResponse)
async def chat_endpoint(request: QuestionRequest):
    try:
        return handle_query(df, request.question)
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
       
@app.post("/size")
async def get_sizes(request: SizeRequest):
    global df
    try:
        if df is None or df.empty:
            raise HTTPException(status_code=500, detail="Tile database is not loaded")
            
        filtered_df = df.copy()
        
        # Debug prints
        print("\n=== Debug Information ===")
        print(f"Request parameters: {request}")
        print(f"Initial dataframe shape: {filtered_df.shape}")
        
        # Apply filters based on provided parameters
        if request.category:
            # Normalize category
            search_term = request.category.replace('-', ' ').replace('+', ' ').lower().strip()
            print(f"\nSearching for category/application: '{search_term}'")
            
            # Filter based on applications field
            applications_mask = filtered_df['applications'].fillna('').str.lower().apply(
                lambda x: any(term in x for term in search_term.split())
            )
            filtered_df = filtered_df[applications_mask]
            print(f"After category filter - found {len(filtered_df)} matches")
            
        if request.material:
            filtered_df = filtered_df[
                filtered_df['material'].fillna('').str.lower() == request.material.lower()
            ]
            
        if request.design_types:
            filtered_df = filtered_df[
                filtered_df['design_types'].fillna('').str.lower() == request.design_types.lower()
            ]
            
        if request.finish:
            filtered_df = filtered_df[
                filtered_df['finish'].fillna('').str.lower() == request.finish.lower()
            ]
            
        # Get unique sizes and remove any NaN values
        sizes = filtered_df['size'].unique().tolist()
        sizes = [str(size) for size in sizes if pd.notna(size)]
        
        print(f"\nFound {len(sizes)} unique sizes")
        print("Sizes:", sizes)
        
        return {"sizes": sizes}
        
    except Exception as e:
        print(f"Error in get_sizes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tiles")
async def get_tiles(
    category: str = Query(None, description="Application category"),
    size: str = Query(None, description="Tile size")
):
    global df
    try:
        if df is None or df.empty:
            print("Database not loaded")
            raise HTTPException(status_code=500, detail="Tile database is not loaded")
            
        filtered_df = df.copy()
        
        # Debug prints
        print("\n=== Debug Information ===")
        print(f"Raw category parameter: {category}")
        print(f"Raw size parameter: {size}")
        print(f"\nInitial dataframe shape: {filtered_df.shape}")
        print("\nSample of available data:")
        print(filtered_df[['applications', 'size']].head())
        
        if category:
            # Normalize category
            search_term = category.replace('-', ' ').replace('+', ' ').lower().strip()
            print(f"\nSearching for category/application: '{search_term}'")
            print("Available applications:")
            print(filtered_df['applications'].unique())
            
            # Filter based on applications field
            applications_mask = filtered_df['applications'].fillna('').str.lower().apply(
                lambda x: any(term in x for term in search_term.split())
            )
            
            filtered_df = filtered_df[applications_mask]
            print(f"\nAfter category filter - found {len(filtered_df)} matches")
        
        if size:
            # Normalize size
            size_normalized = size.replace('+', ' ').replace('-', ' ').lower().strip()
            print(f"\nSearching for size: '{size_normalized}'")
            print("Available sizes:")
            print(filtered_df['size'].unique())
            
            # More flexible size matching
            def normalize_size(s):
                if pd.isna(s):
                    return ''
                return str(s).lower().replace('mm', '').replace('ft', '').strip()
            
            filtered_df['normalized_size'] = filtered_df['size'].apply(normalize_size)
            size_to_match = normalize_size(size_normalized)
            
            filtered_df = filtered_df[filtered_df['normalized_size'].str.contains(size_to_match, na=False)]
            print(f"\nAfter size filter - found {len(filtered_df)} matches")
        
        if filtered_df.empty:
            print("\nNo matches found after all filters")
            return {"tiles": []}
        
        # Convert matching rows to response format
        tiles = []
        for _, row in filtered_df.iterrows():
            try:
                tile = {
                    "id": str(row['id']),
                    "name": str(row['name']),
                    "description": str(row['description']),
                    "material": str(row['material']),
                    "finish": str(row['finish']),
                    "size": str(row['size']),
                    "price": float(row['price']) if pd.notna(row['price']) else 0.0,
                    "price_unit": str(row['price_unit']),
                    "design_types": str(row['design_types']),
                    "applications": str(row['applications']),
                    "quantity_per_box": float(row['quantity_per_box']) if pd.notna(row['quantity_per_box']) else None,
                    "area_per_box": float(row['area_per_box']) if pd.notna(row['area_per_box']) else None,
                    "area_unit": str(row['area_unit']),
                    "faces": int(row['faces']) if pd.notna(row['faces']) else None,
                    "origin": str(row['origin']),
                    "laying_patterns": str(row['laying_patterns']),
                    "product_url": str(row['product_url']),
                    "image_url": str(row['image_url']),
                    "image_path": str(row['image_path'])
                }
                tiles.append(tile)
            except Exception as e:
                print(f"Error processing row: {e}")
                continue
        
        print(f"\nSuccessfully returning {len(tiles)} tiles")
        return {"tiles": tiles}
        
    except Exception as e:
        print(f"Error in get_tiles: {e}")
        return {"tiles": [], "error": str(e)}

@app.post("/name")
async def name_endpoint(query: TileQuery):
    global df
    try:
        if df is None or df.empty:
            raise HTTPException(status_code=500, detail="Tile database is not loaded")
            
        query_lower = query.text.lower()
        df_copy = df.copy()
        df_copy['name_lower'] = df_copy['name'].str.lower()
        
        matches = df_copy[df_copy['name_lower'].str.contains(query_lower, na=False, regex=False)]
        
        if len(matches) > 0:
            row = matches.iloc[0]
            return {
                "status": "success",
                "message": "Tile information found",
                "data": {
                    "id": str(row['id']),
                    "name": row['name'],
                    "description": row['description'],
                    "material": row['material'],
                    "finish": row['finish'],
                    "size": row['size'],
                    "price": float(row['price']),
                    "price_unit": row['price_unit'],
                    "design_types": row['design_types'],
                    "applications": row['applications'],
                    "quantity_per_box": row['quantity_per_box'],
                    "area_per_box": row['area_per_box'],
                    "area_unit": row['area_unit'],
                    "faces": row['faces'],
                    "origin": row['origin'],
                    "laying_patterns": row['laying_patterns'],
                    "product_url": row['product_url'],
                    "image_url": row['image_url'],
                    "image_path": row['image_path']
                }
            }
        
        return {
            "status": "not_found",
            "message": "No matching tile found",
            "data": None
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    # Get port from environment variable or default to 8000
    port = int(os.environ.get("PORT", 10000))
    
    # Run the app with the specified host and port
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Necessary for Render
        port=port,
        reload=False  # Set to False in production
    )
