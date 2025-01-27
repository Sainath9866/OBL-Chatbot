from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import google.generativeai as genai
from typing import List, Optional
import os
from pydantic import BaseModel
from pathlib import Path
from dotenv import load_dotenv
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

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
    Enhanced search function with more flexible matching and broader results
    """
    # Combine relevant text fields for searching
    df['search_text'] = (
        df['description'].apply(clean_text) + ' ' +
        df['name'].apply(clean_text) + ' ' +
        df['material'].apply(clean_text) + ' ' +
        df['applications'].apply(clean_text)
    )
    
    query = clean_text(query)
    
    # Create a TF-IDF vectorizer
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf_matrix = vectorizer.fit_transform(df['search_text'].values.astype('U'))
        query_vec = vectorizer.transform([query])
        
        # Calculate similarity scores
        similarity_scores = cosine_similarity(query_vec, tfidf_matrix)[0]
        
        # Create initial mask for filtering with lower threshold
        mask = similarity_scores > 0.05  # Lowered threshold for more results
        
        # Specific feature filtering
        if any(term in query for term in ['anti-skid', 'antiskid', 'slip resistant', 'anti slip']):
            mask &= df['search_text'].str.contains('slip-resistant|anti-skid|skid-resistant|anti slip', regex=True, case=False)
        
        # Price-based filtering
        if 'below' in query or 'under' in query:
            price_match = re.search(r'(\d+)', query)
            if price_match:
                price_limit = float(price_match.group(1))
                mask &= df['price'] <= price_limit
        
        # Application-based filtering
        if 'corridor' in query or 'hallway' in query:
            mask &= df['applications'].str.contains('corridor|hallway', case=False, na=False)
        
        # Get matching tiles
        matching_indices = np.where(mask)[0]
        if len(matching_indices) > 0:
            # Sort by similarity, but return more results
            matching_indices = matching_indices[np.argsort(similarity_scores[matching_indices])[::-1]]
            top_matches = df.iloc[matching_indices[:100]].to_dict('records')  # Increased to 10 results
        else:
            # Fallback: if no matches, do a broader search
            if 'below' in query and price_match:
                # If price-based search fails, show all cheap tiles
                top_matches = df[df['price'] <= price_limit].sort_values('price').head(50).to_dict('records')
            elif 'corridor' in query:
                # If corridor search fails, show tiles suitable for corridors
                top_matches = df[df['applications'].str.contains('corridor|hallway', case=False, na=False)].head(50).to_dict('records')
            else:
                top_matches = []
            
        return top_matches
    except Exception as e:
        print(f"Search error: {str(e)}")
        return []

def format_answer(tiles: List[dict]) -> str:
    """
    Format the answer based on the found tiles
    """
    if not tiles:
        return "I couldn't find any tiles matching your requirements. Could you please try with different criteria?"
    
    answer = "Based on your requirements, here are the most relevant tiles I found:\n\n"
    
    for i, tile in enumerate(tiles, 1):
        answer += f"{i}. **{tile['name']}** - {tile['material']} tile"
        if tile['design_types']:
            answer += f" with {tile['design_types']} design"
        answer += f", {tile['finish']}, {tile['size']} size"
        if tile['price'] > 0:
            answer += f", priced at {tile['price']} {tile['price_unit']}"
        answer += ".\n"
        
        # Add description if available
        if tile['description']:
            desc = tile['description'][:200]
            answer += f"   Key features: {desc}...\n"
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
