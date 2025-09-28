#!/usr/bin/env python3
"""
Debug script to test AI Chat functionality and identify timeout issues
"""

import asyncio
import time
import json
import os
from typing import Optional
import traceback
from dotenv import load_dotenv

load_dotenv()

# Test configurations
TEST_PATIENT_ID = "test-patient"
TEST_MESSAGE = "Show me my recent lab results"
TIMEOUT_SECONDS = 30

class DebugTester:
    def __init__(self):
        self.results = {}
        
    def log_test(self, test_name: str, success: bool, duration: float, error: Optional[str] = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name} ({duration:.2f}s)")
        if error:
            print(f"    Error: {error}")
        
        self.results[test_name] = {
            "success": success,
            "duration": duration,
            "error": error
        }
    
    async def test_firebase_connection(self):
        """Test basic Firebase connectivity"""
        test_name = "Firebase Connection"
        start_time = time.time()
        
        try:
            from firebase_config import realtime_db
            
            # Simple read test
            ref = realtime_db.reference('/')
            data = ref.get()
            
            duration = time.time() - start_time
            self.log_test(test_name, True, duration)
            return True
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(test_name, False, duration, str(e))
            return False
    
    async def test_redis_connection(self):
        """Test Redis connectivity"""
        test_name = "Redis Connection"
        start_time = time.time()
        
        try:
            from langgraph.checkpoint.redis import RedisSaver
            
            # Try to create Redis connection
            checkpointer = RedisSaver.from_conn_string("redis://localhost:6379")
            
            duration = time.time() - start_time
            self.log_test(test_name, True, duration)
            return True
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(test_name, False, duration, str(e))
            return False
    
    async def test_openai_connection(self):
        """Test OpenAI API connectivity"""
        test_name = "OpenAI API Connection"
        start_time = time.time()
        
        try:
            from langchain_openai import ChatOpenAI
            
            # Test with a simple prompt
            llm = ChatOpenAI(model="gpt-3.5-turbo", timeout=10)  # Use standard model for testing
            response = await llm.ainvoke("Say 'Hello'")
            
            duration = time.time() - start_time
            self.log_test(test_name, True, duration)
            return True
            
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(test_name, False, duration, str(e))
            return False
    
    async def test_individual_tools(self):
        """Test each tool function individually"""
        try:
            from services.deep_agent_service import (
                get_patient_profile, 
                get_patient_emr, 
                get_trial_info
            )
            
            # Test get_patient_profile
            test_name = "Tool: get_patient_profile"
            start_time = time.time()
            try:
                result = await get_patient_profile.ainvoke({"patient_id": TEST_PATIENT_ID})
                duration = time.time() - start_time
                self.log_test(test_name, True, duration)
                print(f"    Result: {result[:100]}...")
            except Exception as e:
                duration = time.time() - start_time
                self.log_test(test_name, False, duration, str(e))
            
            # Test get_patient_emr
            test_name = "Tool: get_patient_emr"
            start_time = time.time()
            try:
                result = await get_patient_emr.ainvoke({"patient_id": TEST_PATIENT_ID})
                duration = time.time() - start_time
                self.log_test(test_name, True, duration)
                print(f"    Result: {result[:100]}...")
            except Exception as e:
                duration = time.time() - start_time
                self.log_test(test_name, False, duration, str(e))
            
            # Test get_trial_info
            test_name = "Tool: get_trial_info"
            start_time = time.time()
            try:
                result = await get_trial_info.ainvoke({"trial_id": "test-trial"})
                duration = time.time() - start_time
                self.log_test(test_name, True, duration)
                print(f"    Result: {result[:100]}...")
            except Exception as e:
                duration = time.time() - start_time
                self.log_test(test_name, False, duration, str(e))
                
        except ImportError as e:
            self.log_test("Tool Import", False, 0, str(e))
    
    async def test_agent_creation(self):
        """Test agent creation without invocation"""
        test_name = "Agent Creation"
        start_time = time.time()
        
        try:
            from services.deep_agent_service import agent
            
            # Just check if agent exists and has basic properties
            if hasattr(agent, 'invoke') and hasattr(agent, 'ainvoke'):
                duration = time.time() - start_time
                self.log_test(test_name, True, duration)
                return True
            else:
                duration = time.time() - start_time
                self.log_test(test_name, False, duration, "Agent missing invoke methods")
                return False
                
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(test_name, False, duration, str(e))
            return False
    
    async def test_agent_invocation_simple(self):
        """Test agent with simple message and timeout"""
        test_name = "Agent Simple Invocation"
        start_time = time.time()
        
        try:
            from services.deep_agent_service import agent
            
            config = {"configurable": {"thread_id": "debug-test"}}
            input_data = {"messages": [{"role": "user", "content": "Hello"}]}
            
            # Use asyncio.wait_for to enforce timeout
            result = await asyncio.wait_for(
                agent.ainvoke(input_data, config=config), # type: ignore
                timeout=TIMEOUT_SECONDS
            )
            
            duration = time.time() - start_time
            final_answer = result['messages'][-1].content
            self.log_test(test_name, True, duration)
            print(f"    Response: {final_answer[:100]}...")
            return True
            
        except asyncio.TimeoutError:
            duration = time.time() - start_time
            self.log_test(test_name, False, duration, f"Timeout after {TIMEOUT_SECONDS}s")
            return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(test_name, False, duration, str(e))
            return False
    
    async def test_agent_invocation_complex(self):
        """Test agent with the actual message from your app"""
        test_name = "Agent Complex Invocation"
        start_time = time.time()
        
        try:
            from services.deep_agent_service import agent
            
            config = {"configurable": {"thread_id": TEST_PATIENT_ID}}
            input_data = {"messages": [{"role": "user", "content": TEST_MESSAGE}]}
            
            # Use asyncio.wait_for to enforce timeout
            result = await asyncio.wait_for(
                agent.ainvoke(input_data, config=config), # type: ignore
                timeout=TIMEOUT_SECONDS
            )
            
            duration = time.time() - start_time
            final_answer = result['messages'][-1].content
            self.log_test(test_name, True, duration)
            print(f"    Response: {final_answer[:100]}...")
            return True
            
        except asyncio.TimeoutError:
            duration = time.time() - start_time
            self.log_test(test_name, False, duration, f"Timeout after {TIMEOUT_SECONDS}s")
            return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(test_name, False, duration, str(e))
            return False
    
    async def test_medgemma_connection(self):
        """Test MedGemma API if configured"""
        test_name = "MedGemma API Connection"
        start_time = time.time()
        
        try:
            from services.timeline_service import medgemma_client
            
            # Simple test prompt
            result = await asyncio.wait_for(
                medgemma_client.generate("Say hello"),
                timeout=30
            )
            
            duration = time.time() - start_time
            self.log_test(test_name, True, duration)
            print(f"    Response: {result[:50]}...")
            return True
            
        except asyncio.TimeoutError:
            duration = time.time() - start_time
            self.log_test(test_name, False, duration, "Timeout after 15s")
            return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(test_name, False, duration, str(e))
            return False
    
    async def test_gemini_connection(self):
        """Test Google Gemini API if configured"""
        test_name = "Google Gemini API Connection"
        start_time = time.time()
        
        try:
            from services.extraction_service import parse_emr_with_gemini
            
            # Simple test
            result = await asyncio.wait_for(
                parse_emr_with_gemini("Patient age: 30, gender: male"),
                timeout=15
            )
            
            duration = time.time() - start_time
            if "error" not in result:
                self.log_test(test_name, True, duration)
                print(f"    Result: {json.dumps(result, indent=2)}")
            else:
                self.log_test(test_name, False, duration, result["error"])
            return True
            
        except asyncio.TimeoutError:
            duration = time.time() - start_time
            self.log_test(test_name, False, duration, "Timeout after 15s")
            return False
        except Exception as e:
            duration = time.time() - start_time
            self.log_test(test_name, False, duration, str(e))
            return False
    
    def print_environment_info(self):
        """Print environment information"""
        print("\n🔍 ENVIRONMENT INFO:")
        print(f"OPENAI_API_KEY: {'✅ Set' if os.getenv('OPENAI_API_KEY') else '❌ Not set'}")
        print(f"GOOGLE_API_KEY: {'✅ Set' if os.getenv('GOOGLE_API_KEY') else '❌ Not set'}")
        print(f"MEDGEMMA_API_KEY: {'✅ Set' if os.getenv('MEDGEMMA_API_KEY') else '❌ Not set'}")
        print(f"MEDGEMMA_BASE_URL: {'✅ Set' if os.getenv('MEDGEMMA_BASE_URL') else '❌ Not set'}")
        print(f"NEXT_PUBLIC_FIREBASE_DATABASE_URL: {'✅ Set' if os.getenv('NEXT_PUBLIC_FIREBASE_DATABASE_URL') else '❌ Not set'}")
    
    def print_summary(self):
        """Print test summary"""
        print("\n📊 TEST SUMMARY:")
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results.values() if r["success"])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        
        # Show slowest tests
        slow_tests = [(name, r["duration"]) for name, r in self.results.items() 
                     if r["success"] and r["duration"] > 5]
        if slow_tests:
            print("\n⚠️  SLOW TESTS (>5s):")
            for name, duration in sorted(slow_tests, key=lambda x: x[1], reverse=True):
                print(f"  {name}: {duration:.2f}s")
        
        # Show failed tests
        failed_tests = [(name, r["error"]) for name, r in self.results.items() 
                       if not r["success"]]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for name, error in failed_tests:
                print(f"  {name}: {error}")

async def main():
    """Run all debug tests"""
    print("🚀 STARTING AI CHAT DEBUG TESTS")
    print("=" * 50)
    
    tester = DebugTester()
    
    # Print environment info first
    tester.print_environment_info()
    
    print("\n🧪 RUNNING TESTS:")
    print("-" * 30)
    
    # Run tests in order of dependency
    await tester.test_firebase_connection()
    await tester.test_redis_connection()
    await tester.test_openai_connection()
    await tester.test_medgemma_connection()
    await tester.test_gemini_connection()
    await tester.test_individual_tools()
    await tester.test_agent_creation()
    await tester.test_agent_invocation_simple()
    await tester.test_agent_invocation_complex()
    
    # Print summary
    tester.print_summary()
    
    print("\n💡 RECOMMENDATIONS:")
    if not tester.results.get("Firebase Connection", {}).get("success"):
        print("  - Check Firebase configuration and database URL")
    if not tester.results.get("OpenAI API Connection", {}).get("success"):
        print("  - Check OpenAI API key and connectivity")
    if not tester.results.get("Agent Simple Invocation", {}).get("success"):
        print("  - Agent basic functionality is broken")
    if not tester.results.get("Agent Complex Invocation", {}).get("success"):
        print("  - Agent timeouts on complex queries - this is likely your main issue")
    
    # Check for timeout issues specifically
    agent_duration = tester.results.get("Agent Complex Invocation", {}).get("duration", 0)
    if agent_duration > 25:
        print("  - Consider reducing agent complexity or increasing timeout")
        print("  - Check if specific tools are causing delays")

if __name__ == "__main__":
    asyncio.run(main())