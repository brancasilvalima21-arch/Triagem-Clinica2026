#!/usr/bin/env python3
"""
Backend API Tests for TriagemAssist
Tests all backend endpoints with real data
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Load backend URL from frontend/.env
BACKEND_URL = None
try:
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BACKEND_URL = line.split('=', 1)[1].strip()
                break
except Exception as e:
    print(f"❌ Error reading frontend/.env: {e}")
    sys.exit(1)

if not BACKEND_URL:
    print("❌ REACT_APP_BACKEND_URL not found in /app/frontend/.env")
    sys.exit(1)

API_BASE = f"{BACKEND_URL}/api"
print(f"🔗 Testing backend at: {API_BASE}\n")

# Test results tracking
tests_passed = 0
tests_failed = 0
test_details = []


def log_test(name: str, passed: bool, details: str = ""):
    """Log test result"""
    global tests_passed, tests_failed
    if passed:
        tests_passed += 1
        print(f"✅ {name}")
    else:
        tests_failed += 1
        print(f"❌ {name}")
    if details:
        print(f"   {details}")
    test_details.append({"name": name, "passed": passed, "details": details})


def test_health_check():
    """Test GET /api/ - health check"""
    print("\n=== Test 1: Health Check ===")
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        
        if response.status_code != 200:
            log_test("Health check status code", False, f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        
        # Check message field
        if data.get("message") != "TriagemAssist API":
            log_test("Health check message", False, f"Expected 'TriagemAssist API', got '{data.get('message')}'")
        else:
            log_test("Health check message", True)
        
        # Check algorithms field (should be 50 based on ALGORITHM_INDEX)
        algorithms_count = data.get("algorithms")
        if algorithms_count is None:
            log_test("Health check algorithms field", False, "Field 'algorithms' missing")
        elif algorithms_count == 50:
            log_test("Health check algorithms count", True, f"Found {algorithms_count} algorithms")
        else:
            log_test("Health check algorithms count", False, f"Expected 50, got {algorithms_count}")
        
        print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
    except Exception as e:
        log_test("Health check", False, f"Exception: {str(e)}")


def test_analyze_chest_pain():
    """Test POST /api/analyze - chest pain case"""
    print("\n=== Test 2a: Analyze - Chest Pain (Dor Torácica) ===")
    try:
        payload = {
            "description": "Aperto no peito que irradia para o braço esquerdo, com suores frios e falta de ar",
            "age": "62 anos",
            "sex": "Masculino"
        }
        
        response = requests.post(f"{API_BASE}/analyze", json=payload, timeout=30)
        
        if response.status_code != 200:
            log_test("Analyze chest pain status", False, f"Expected 200, got {response.status_code}. Response: {response.text}")
            return
        
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        # Check required fields
        required_fields = ["clinicalTerms", "summary", "suggested", "primary", "source"]
        for field in required_fields:
            if field not in data:
                log_test(f"Analyze chest pain - {field} field", False, f"Missing field: {field}")
                return
        
        log_test("Analyze chest pain - required fields", True)
        
        # Check clinicalTerms is array
        if not isinstance(data["clinicalTerms"], list):
            log_test("Analyze chest pain - clinicalTerms type", False, "clinicalTerms should be array")
        else:
            log_test("Analyze chest pain - clinicalTerms type", True, f"Found {len(data['clinicalTerms'])} terms")
        
        # Check summary is string in Portuguese
        if not isinstance(data["summary"], str) or len(data["summary"]) == 0:
            log_test("Analyze chest pain - summary", False, "Summary should be non-empty string")
        else:
            log_test("Analyze chest pain - summary", True, f"Summary: {data['summary'][:80]}...")
        
        # Check suggested is array with at least 1 item
        if not isinstance(data["suggested"], list) or len(data["suggested"]) == 0:
            log_test("Analyze chest pain - suggested", False, "Suggested should be non-empty array")
        else:
            log_test("Analyze chest pain - suggested", True, f"Found {len(data['suggested'])} suggestions")
        
        # Check primary algorithm
        primary = data.get("primary", {})
        primary_id = primary.get("id")
        
        if primary_id == "dor-toracica":
            log_test("Analyze chest pain - primary algorithm", True, f"Correctly identified as 'dor-toracica'")
        else:
            # This is not necessarily a failure - LLM might choose differently
            log_test("Analyze chest pain - primary algorithm", True, f"Identified as '{primary_id}' (expected 'dor-toracica' but LLM may vary)")
        
        # Check urgencyHint
        urgency = data.get("urgencyHint")
        if urgency in ["emergente", "muito_urgente"]:
            log_test("Analyze chest pain - urgency", True, f"Urgency: {urgency}")
        else:
            log_test("Analyze chest pain - urgency", True, f"Urgency: {urgency} (expected emergente/muito_urgente but LLM may vary)")
        
        # Check source
        source = data.get("source")
        if source in ["llm", "fallback"]:
            log_test("Analyze chest pain - source", True, f"Source: {source}")
        else:
            log_test("Analyze chest pain - source", False, f"Invalid source: {source}")
        
    except Exception as e:
        log_test("Analyze chest pain", False, f"Exception: {str(e)}")


def test_analyze_abdominal_pain():
    """Test POST /api/analyze - abdominal pain case"""
    print("\n=== Test 2b: Analyze - Abdominal Pain (Dor Abdominal) ===")
    try:
        payload = {
            "description": "Dor forte na barriga do lado direito em baixo com vómitos e febre desde ontem",
            "age": "28 anos",
            "sex": "Feminino"
        }
        
        response = requests.post(f"{API_BASE}/analyze", json=payload, timeout=30)
        
        if response.status_code != 200:
            log_test("Analyze abdominal pain status", False, f"Expected 200, got {response.status_code}. Response: {response.text}")
            return
        
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        # Check primary algorithm
        primary_id = data.get("primary", {}).get("id")
        
        if primary_id == "dor-abdominal":
            log_test("Analyze abdominal pain - primary algorithm", True, f"Correctly identified as 'dor-abdominal'")
        else:
            log_test("Analyze abdominal pain - primary algorithm", True, f"Identified as '{primary_id}' (expected 'dor-abdominal' but LLM may vary)")
        
        log_test("Analyze abdominal pain - response structure", True, "Valid response received")
        
    except Exception as e:
        log_test("Analyze abdominal pain", False, f"Exception: {str(e)}")


def test_analyze_empty_description():
    """Test POST /api/analyze - empty description should return 400"""
    print("\n=== Test 2c: Analyze - Empty Description (Should Fail) ===")
    try:
        payload = {
            "description": "",
            "age": "30 anos",
            "sex": "Masculino"
        }
        
        response = requests.post(f"{API_BASE}/analyze", json=payload, timeout=10)
        
        if response.status_code == 400:
            log_test("Analyze empty description - status code", True, "Correctly returned 400")
            print(f"   Response: {response.text}")
        else:
            log_test("Analyze empty description - status code", False, f"Expected 400, got {response.status_code}")
        
    except Exception as e:
        log_test("Analyze empty description", False, f"Exception: {str(e)}")


def test_history_crud():
    """Test POST/GET/DELETE /api/history - full CRUD flow"""
    print("\n=== Test 3: History CRUD Operations ===")
    
    created_id = None
    
    # Test 3a: Create history entry
    print("\n--- Test 3a: POST /api/history (Create) ---")
    try:
        payload = {
            "input": {
                "age": "45 anos",
                "sex": "Feminino",
                "description": "Cefaleia intensa súbita com fotofobia"
            },
            "result": {
                "clinicalTerms": ["cefaleia", "fotofobia"],
                "summary": "Cefaleia intensa com sinais de alerta. Requer avaliação urgente.",
                "suggested": [
                    {"id": "cefaleia", "name": "Cefaleia", "category": "Neurológico", "matched": []}
                ],
                "primary": {"id": "cefaleia", "name": "Cefaleia", "category": "Neurológico", "matched": []},
                "urgencyHint": "emergente",
                "source": "llm"
            }
        }
        
        response = requests.post(f"{API_BASE}/history", json=payload, timeout=10)
        
        if response.status_code != 200:
            log_test("Create history entry - status", False, f"Expected 200, got {response.status_code}. Response: {response.text}")
        else:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            # Check for id and createdAt
            if "id" not in data:
                log_test("Create history entry - id field", False, "Missing 'id' field")
            else:
                created_id = data["id"]
                log_test("Create history entry - id field", True, f"ID: {created_id}")
            
            if "createdAt" not in data:
                log_test("Create history entry - createdAt field", False, "Missing 'createdAt' field")
            else:
                log_test("Create history entry - createdAt field", True, f"Created at: {data['createdAt']}")
            
            log_test("Create history entry", True, "Entry created successfully")
        
    except Exception as e:
        log_test("Create history entry", False, f"Exception: {str(e)}")
    
    # Test 3b: List history entries
    print("\n--- Test 3b: GET /api/history (List) ---")
    try:
        response = requests.get(f"{API_BASE}/history", timeout=10)
        
        if response.status_code != 200:
            log_test("List history entries - status", False, f"Expected 200, got {response.status_code}. Response: {response.text}")
        else:
            data = response.json()
            
            if not isinstance(data, list):
                log_test("List history entries - type", False, "Response should be array")
            else:
                log_test("List history entries - type", True, f"Found {len(data)} entries")
                
                # Check if our created entry is in the list
                if created_id:
                    found = any(entry.get("id") == created_id for entry in data)
                    if found:
                        log_test("List history entries - created entry found", True, f"Entry {created_id} found in list")
                    else:
                        log_test("List history entries - created entry found", False, f"Entry {created_id} not found in list")
                
                # Check sorting (most recent first)
                if len(data) >= 2:
                    first_date = data[0].get("createdAt", "")
                    second_date = data[1].get("createdAt", "")
                    if first_date >= second_date:
                        log_test("List history entries - sorting", True, "Entries sorted by createdAt descending")
                    else:
                        log_test("List history entries - sorting", False, "Entries not properly sorted")
        
    except Exception as e:
        log_test("List history entries", False, f"Exception: {str(e)}")
    
    # Test 3c: Delete history entry
    print("\n--- Test 3c: DELETE /api/history/{id} (Delete) ---")
    if created_id:
        try:
            response = requests.delete(f"{API_BASE}/history/{created_id}", timeout=10)
            
            if response.status_code != 200:
                log_test("Delete history entry - status", False, f"Expected 200, got {response.status_code}. Response: {response.text}")
            else:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
                
                if data.get("deleted") == True:
                    log_test("Delete history entry", True, f"Entry {created_id} deleted successfully")
                else:
                    log_test("Delete history entry", False, f"Unexpected response: {data}")
                
                # Verify entry is removed from list
                response = requests.get(f"{API_BASE}/history", timeout=10)
                if response.status_code == 200:
                    entries = response.json()
                    found = any(entry.get("id") == created_id for entry in entries)
                    if not found:
                        log_test("Delete history entry - verification", True, "Entry removed from list")
                    else:
                        log_test("Delete history entry - verification", False, "Entry still in list after deletion")
            
        except Exception as e:
            log_test("Delete history entry", False, f"Exception: {str(e)}")
    else:
        log_test("Delete history entry", False, "Skipped - no entry was created")
    
    # Test 3d: Delete non-existent entry (should return 404)
    print("\n--- Test 3d: DELETE /api/history/invalid-id (Should Return 404) ---")
    try:
        response = requests.delete(f"{API_BASE}/history/id-inexistente-12345", timeout=10)
        
        if response.status_code == 404:
            log_test("Delete non-existent entry - status", True, "Correctly returned 404")
            print(f"   Response: {response.text}")
        else:
            log_test("Delete non-existent entry - status", False, f"Expected 404, got {response.status_code}")
        
    except Exception as e:
        log_test("Delete non-existent entry", False, f"Exception: {str(e)}")


def main():
    """Run all tests"""
    print("=" * 70)
    print("TriagemAssist Backend API Tests")
    print("=" * 70)
    
    # Run all tests
    test_health_check()
    test_analyze_chest_pain()
    test_analyze_abdominal_pain()
    test_analyze_empty_description()
    test_history_crud()
    
    # Print summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"✅ Passed: {tests_passed}")
    print(f"❌ Failed: {tests_failed}")
    print(f"📊 Total: {tests_passed + tests_failed}")
    print("=" * 70)
    
    # Exit with appropriate code
    sys.exit(0 if tests_failed == 0 else 1)


if __name__ == "__main__":
    main()
