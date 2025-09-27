# services/timeline_service.py
import PyPDF2
import json
import os
from dotenv import load_dotenv
from typing import IO
import aiohttp

load_dotenv()

# --- MedGemmaClient Class ---
class MedGemmaClient:
    def __init__(self):
        self.api_key = os.getenv("MEDGEMMA_API_KEY")
        self.base_url = os.getenv("MEDGEMMA_BASE_URL")
        self.session = None
        if not self.api_key or not self.base_url:
            raise ValueError("Set MEDGEMMA_API_KEY and MEDGEMMA_BASE_URL environment variables")
    
    async def _get_session(self):
        if not self.session or self.session.closed:
            self.session = aiohttp.ClientSession(headers={'Authorization': f'Bearer {self.api_key}'})
        return self.session
    
    async def generate(self, prompt: str) -> str:
        session = await self._get_session()
        payload = { "input": { "openai_route": "/v1/completions", "openai_input": {
            "model": "alibayram/medgemma:27b", "prompt": prompt, "temperature": 0.1, "max_tokens": 1024
        }}}
        try:
            async with session.post(f"{self.base_url}/runsync", json=payload, timeout=60) as response: # type: ignore
                response.raise_for_status()
                result = await response.json()
                if result.get('status') == 'COMPLETED':
                    text = result['output'][0]['choices'][0]['text'].strip()
                    return text.replace("```json", "").replace("```", "").strip()
                else:
                    raise RuntimeError(f"MedGemma failed: {result}")
        except Exception as e:
            raise RuntimeError(f"MedGemma API error: {e}")

# Initialize a single client instance for the service
medgemma_client = MedGemmaClient()

# --- Core Utility Functions ---

def extract_text_from_pdf(pdf_file_stream: IO[bytes]) -> str:
    """Reads a PDF file stream and returns its text content."""
    try:
        reader = PyPDF2.PdfReader(pdf_file_stream)
        return "\n".join(page.extract_text() for page in reader.pages if page.extract_text())
    except Exception as e:
        print(f"Error reading PDF file: {e}")
        return ""

async def generate_timeline_from_text(protocol_text: str) -> dict:
    """Analyzes text using MedGemma to extract a sequential timeline."""
    prompt = f"""
    You are an expert at analyzing clinical trial protocols. Your task is to read the following text and extract a sequential timeline of the main stages. Return your response ONLY as a valid JSON object where keys are strings like "Stage 1" and values are summary strings.
    Text to Analyze:
    ---
    {protocol_text}
    ---
    """
    try:
        response_text = await medgemma_client.generate(prompt)
        return json.loads(response_text)
    except Exception as e:
        print(f"Error parsing MedGemma response for timeline: {e}")
        return {"error": "Failed to generate a valid timeline from the provided text."}