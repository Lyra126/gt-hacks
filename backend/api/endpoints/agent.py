# api/endpoints/agent.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
# This will import the fully configured agent from our service file
from services.deep_agent_service import agent

router = APIRouter()

class AgentRequest(BaseModel):
    content: str

@router.post("/agent/invoke/{thread_id}")
async def invoke_agent_endpoint(thread_id: str, request: AgentRequest):
    """
    Invokes the agent for a specific conversation thread, maintaining history via Redis.
    """
    try:
        config = {"configurable": {"thread_id": thread_id}}
        input_data = {"messages": [{"role": "user", "content": request.content}]}
        
        # Asynchronously invoke the agent from the service layer
        result = await agent.ainvoke(input_data, config=config) # type: ignore
        
        final_answer = result['messages'][-1].content
        return {"response": final_answer}
        
    except Exception as e:
        # Log the full error for debugging
        print(f"Agent invocation error: {e}")
        raise HTTPException(status_code=500, detail="An error occurred in the agent.")