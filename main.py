from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from model_utils import text_gen_model
from nlp_utils import preprocess_text, analyze_generated_text
from fastapi.middleware.cors import CORSMiddleware

# Initialize the FastAPI application
app = FastAPI(
    title="Automated Text Generation System",
    description="An AI system utilizing pre-trained GPT models to generate intelligent text.",
    version="1.0.0"
)

# Add CORS middleware to allow the frontend to interact with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request and response schemas
class GenerateRequest(BaseModel):
    prompt: str
    content_type: str = "paragraph"
    tone: str = "neutral"
    max_length: int = 200
    temperature: float = 0.7

class GenerateResponse(BaseModel):
    generated_text: str

@app.post("/generate", response_model=GenerateResponse)
async def generate_text(request: GenerateRequest):
    if not request.prompt or len(request.prompt.strip()) == 0:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    try:
        # Preprocess prompt using SpaCy
        clean_prompt = preprocess_text(request.prompt)

        # Formulate full prompt
        full_prompt = f"Write a {request.content_type} in a {request.tone} tone based on the following: {clean_prompt}\n\n"

        def stream_generator():
            try:
                # Yield stream directly to the browser chunk by chunk
                for chunk in text_gen_model.generate_stream(
                    prompt=full_prompt,
                    max_length=request.max_length,
                    temperature=request.temperature
                ):
                    if chunk:
                        yield chunk
            except Exception as ev:
                yield str(ev)

        # Return real-time streaming response
        return StreamingResponse(stream_generator(), media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def home():
    return {"message": "Welcome to the Automated AI Text Generation API! Navigate to /docs for the interactive Swagger UI."}
