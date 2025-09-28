# api/endpoints/agent.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
# This will import the fully configured agent from our service file
from services.deep_agent_service import agent
import asyncio

router = APIRouter()

class AgentRequest(BaseModel):
    content: str

# @router.post("/agent/invoke/{thread_id}")
# async def invoke_agent_endpoint(thread_id: str, request: AgentRequest):
#     """
#     Invokes the agent for a specific conversation thread, maintaining history via Redis.
#     """
#     try:
#         # config = {"configurable": {"thread_id": thread_id}}
#         config = {}
#         input_data = {"messages": [{"role": "user", "content": request.content}]}
        
#         # Asynchronously invoke the agent from the service layer
#         result = await agent.ainvoke(input_data, config=config) # type: ignore
        
#         final_answer = result['messages'][-1].content
#         return {"response": final_answer}
        
#     except Exception as e:
#         # Log the full error for debugging
#         print(f"Agent invocation error: {e}")
#         raise HTTPException(status_code=500, detail="An error occurred in the agent.")

@router.post("/agent/invoke/{thread_id}")
async def invoke_agent_endpoint(thread_id: str, request: AgentRequest):
    """
    Invokes the agent for a specific conversation thread.
    """
    print(f"🚀 AGENT ENDPOINT HIT - thread_id: {thread_id}")
    print(f"📝 Request content: {request.content}")
    
    try:
        print("🔧 Starting agent invocation...")
        config = {"configurable": {"thread_id": thread_id}}
        enhanced_content = f"Patient ID: {thread_id}\nUser question: {request.content}"
        input_data = {"messages": [{"role": "user", "content": enhanced_content}]}

        print("⏰ Calling agent.ainvoke with 45s timeout...")
        result = await asyncio.wait_for(
            agent.ainvoke(input_data, config=config), # type: ignore
            timeout=45.0
        )
        
        print("✅ Agent invocation completed successfully")
        final_answer = result['messages'][-1].content
        print(f"📤 Returning response: {final_answer[:100]}...")
        return {"response": final_answer}
        
    except asyncio.TimeoutError:
        print(f"⏰ TIMEOUT: Agent took longer than 20s for: {request.content}")
        return {"response": "I'm taking longer than expected. Please try a simpler question."}
    except Exception as e:
        print(f"❌ AGENT ERROR: {e}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        return {"response": "I'm having technical difficulties. Please try again."}