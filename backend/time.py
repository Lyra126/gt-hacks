# timeline_parser.py
import PyPDF2
import json
import os
from dotenv import load_dotenv
from typing import IO
import aiohttp

# --- 1. SETUP & INITIALIZATION ---
load_dotenv()

# --- COPIED MedGemmaClient ---
class MedGemmaClient:
    def __init__(self):
        self.api_key = os.getenv("MEDGEMMA_API_KEY")
        self.base_url = os.getenv("MEDGEMMA_BASE_URL")
        self.session = None
        
        if not self.api_key:
            raise ValueError("Set MEDGEMMA_API_KEY environment variable")
        if not self.base_url:
            raise ValueError("Set MEDGEMMA_BASE_URL environment variable")
    
    async def _get_session(self):
        if not self.session or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=60)
            self.session = aiohttp.ClientSession(
                timeout=timeout,
                headers={'Authorization': f'Bearer {self.api_key}'}
            )
        return self.session
    
    async def generate(self, prompt: str) -> str:
        try:
            session = await self._get_session()
            
            payload = {
                "input": {
                    "openai_route": "/v1/completions",
                    "openai_input": {
                        "model": "alibayram/medgemma:27b",
                        "prompt": prompt,
                        "temperature": 0.1,
                        "max_tokens": 1024, # Increased for potentially long timelines
                        "top_p": 0.9
                    }
                }
            }
            
            async with session.post(f"{self.base_url}/runsync", json=payload) as response:
                response.raise_for_status()
                result = await response.json()
                
                if result.get('status') == 'COMPLETED':
                    output = result.get('output', [])
                    if output and len(output) > 0:
                        choices = output[0].get('choices', [])
                        if choices and len(choices) > 0:
                            # The model often returns the JSON inside a markdown block
                            text = choices[0].get('text', '').strip()
                            return text.replace("```json", "").replace("```", "").strip()
                    return ''
                else:
                    raise RuntimeError(f"MedGemma failed: {result}")
        except Exception as e:
            if "TimeoutError" in str(type(e)):
                raise RuntimeError(f"MedGemma API timeout (60s) - service may be unavailable: {e}")
            elif hasattr(e, 'status'):
                raise RuntimeError(f"MedGemma HTTP {e.status} error: {e}") # type: ignore
            else:
                raise RuntimeError(f"MedGemma connection error: {e}")
    
    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()
            self.session = None

# Initialize the new client
medgemma_client = MedGemmaClient()

# --- 2. CORE FUNCTIONS ---

def extract_text_from_pdf(pdf_file_stream: IO[bytes]) -> str:
    """Reads a PDF file stream and returns all of its text content as a single string."""
    try:
        full_text = ""
        reader = PyPDF2.PdfReader(pdf_file_stream)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + "\n"
        return full_text
    except Exception as e:
        print(f"Error reading PDF file: {e}")
        return ""

async def generate_timeline_from_text(protocol_text: str) -> dict:
    """
    Analyzes text using MedGemma to extract a sequential timeline of events or stages.
    This function is now ASYNCHRONOUS.
    """
    prompt = f"""
    You are an expert at analyzing clinical trial protocols.
    Your task is to read the following text and extract a sequential timeline of the main stages.
    Return your response ONLY as a valid JSON object. The keys should be strings like "Stage 1", "Stage 2", etc., and the values should be summary strings.
    
    Text to Analyze:
    ---
    {protocol_text}
    ---
    """
    try:
        # Use the MedGemma client to generate the response
        response_text = await medgemma_client.generate(prompt)
        return json.loads(response_text)
    except (json.JSONDecodeError, Exception) as e:
        print(f"Error parsing MedGemma response for timeline: {e}")
        return {"error": "Failed to generate a valid timeline from the provided text."}
