# services/timeline_service.py
import PyPDF2
import json
import os
from dotenv import load_dotenv
from typing import IO
import aiohttp
from firebase_config import realtime_db 

load_dotenv()

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
        payload = {
            "input": {
                "openai_route": "/v1/completions",
                "openai_input": {
                    "model": "alibayram/medgemma:27b",
                    "prompt": prompt,
                    "temperature": 0.1,
                    "max_tokens": 1024
                }
            }
        }
        try:
            async with session.post(f"{self.base_url}/runsync", json=payload, timeout=60) as response:  # type: ignore
                response.raise_for_status()
                result = await response.json()
                if result.get('status') == 'COMPLETED':
                    text = result['output'][0]['choices'][0]['text'].strip()
                    return text.replace("```json", "").replace("```", "").strip()
                else:
                    raise RuntimeError(f"MedGemma failed: {result}")
        except Exception as e:
            raise RuntimeError(f"MedGemma API error: {e}")

medgemma_client = MedGemmaClient()


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
    You are an expert at analyzing clinical trial protocols. 
    Task: Read the text and extract a sequential timeline of the main stages.
    Return ONLY valid JSON where keys are "Stage 1", "Stage 2", etc., 
    and values are summary strings.

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


async def save_timeline_to_db(trial_id: str, timeline: dict) -> str:
    """Saves the generated timeline into RTDB under clinicalTrials/{trial_id}/stages."""
    try:
        ref = realtime_db.reference(f'clinicalTrials/{trial_id}/stages')
        ref.set(timeline)
        return f"Timeline saved for trial '{trial_id}'."
    except Exception as e:
        return f"Error saving timeline: {e}"

async def get_timeline_from_db(trial_id: str) -> dict:
    """Fetches the saved timeline from RTDB for a trial."""
    try:
        ref = realtime_db.reference(f'clinicalTrials/{trial_id}/stages')
        timeline = ref.get()
        return timeline if timeline else {"error": f"No timeline found for trial '{trial_id}'."} # type: ignore
    except Exception as e:
        return {"error": f"Error fetching timeline: {e}"}