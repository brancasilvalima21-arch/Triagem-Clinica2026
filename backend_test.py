#!/usr/bin/env python3
"""
Backend API Tests for TriagemAssist - Regression Testing After Refactor
Tests all backend endpoints including new /api/translate endpoint
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


def test_analyze_regression_chest_pain():
    """Test POST /api/analyze - REGRESSION TEST 1a: chest pain case"""
    print("\n=== Test 2a: REGRESSION - Analyze Chest Pain (Dor Torácica) ===")
    try:
        payload = {
            "description": "Aperto no peito que irradia para o braço esquerdo, suores frios e falta de ar",
            "age": "62 anos",
            "sex": "Masculino"
        }
        
        response = requests.post(f"{API_BASE}/analyze", json=payload, timeout=30)
        
        if response.status_code != 200:
            log_test("REGRESSION: Analyze chest pain - status", False, f"Expected 200, got {response.status_code}. Response: {response.text}")
            return
        
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        # Check required fields
        required_fields = ["clinicalTerms", "summary", "suggested", "primary", "source"]
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            log_test("REGRESSION: Analyze chest pain - required fields", False, f"Missing fields: {missing_fields}")
            return
        
        log_test("REGRESSION: Analyze chest pain - required fields", True)
        
        # Check primary algorithm ID
        primary = data.get("primary", {})
        primary_id = primary.get("id")
        
        if primary_id == "dor-toracica":
            log_test("REGRESSION: Analyze chest pain - primary.id", True, f"✓ Correctly identified as 'dor-toracica'")
        else:
            log_test("REGRESSION: Analyze chest pain - primary.id", False, f"Expected 'dor-toracica', got '{primary_id}'")
        
        # Check source (should be llm or fallback)
        source = data.get("source")
        if source in ["llm", "fallback"]:
            log_test("REGRESSION: Analyze chest pain - source", True, f"Source: {source}")
        else:
            log_test("REGRESSION: Analyze chest pain - source", False, f"Invalid source: {source}")
        
    except Exception as e:
        log_test("REGRESSION: Analyze chest pain", False, f"Exception: {str(e)}")


def test_analyze_regression_empty_description():
    """Test POST /api/analyze - REGRESSION TEST 1b: empty description should return 400"""
    print("\n=== Test 2b: REGRESSION - Analyze Empty Description (Should Return 400) ===")
    try:
        payload = {
            "description": ""
        }
        
        response = requests.post(f"{API_BASE}/analyze", json=payload, timeout=10)
        
        if response.status_code == 400:
            log_test("REGRESSION: Analyze empty description - status", True, "✓ Correctly returned 400")
            print(f"   Response: {response.text}")
        else:
            log_test("REGRESSION: Analyze empty description - status", False, f"Expected 400, got {response.status_code}")
        
    except Exception as e:
        log_test("REGRESSION: Analyze empty description", False, f"Exception: {str(e)}")


def test_analyze_regression_nonsense_text():
    """Test POST /api/analyze - REGRESSION TEST 1c: nonsense text should return fallback"""
    print("\n=== Test 2c: REGRESSION - Analyze Nonsense Text (Should Return Fallback) ===")
    try:
        payload = {
            "description": "gwertyuiop asdfghjkl zxcvbnm"
        }
        
        response = requests.post(f"{API_BASE}/analyze", json=payload, timeout=30)
        
        if response.status_code != 200:
            log_test("REGRESSION: Analyze nonsense - status", False, f"Expected 200, got {response.status_code}. Response: {response.text}")
            return
        
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        # Check source should be fallback
        source = data.get("source")
        if source == "fallback":
            log_test("REGRESSION: Analyze nonsense - source", True, "✓ Correctly returned source='fallback'")
        else:
            log_test("REGRESSION: Analyze nonsense - source", False, f"Expected source='fallback', got '{source}'")
        
        # Check primary algorithm ID should be valid (inespecifico or other valid ID)
        primary = data.get("primary", {})
        primary_id = primary.get("id")
        
        if primary_id == "inespecifico":
            log_test("REGRESSION: Analyze nonsense - primary.id", True, f"✓ Correctly identified as 'inespecifico'")
        elif primary_id:
            log_test("REGRESSION: Analyze nonsense - primary.id", True, f"Valid algorithm ID: '{primary_id}' (expected 'inespecifico' but any valid ID is acceptable)")
        else:
            log_test("REGRESSION: Analyze nonsense - primary.id", False, "Missing primary.id")
        
    except Exception as e:
        log_test("REGRESSION: Analyze nonsense", False, f"Exception: {str(e)}")


def test_translate_leigo_tone():
    """Test POST /api/translate - TEST 2a: clinical question with tone='leigo'"""
    print("\n=== Test 3a: NEW ENDPOINT - Translate Clinical Question (tone='leigo') ===")
    try:
        payload = {
            "clinical_question": "Apresenta letargia, sinais meníngeos ou alteração do estado de consciência?",
            "tone": "leigo"
        }
        
        response = requests.post(f"{API_BASE}/translate", json=payload, timeout=30)
        
        if response.status_code != 200:
            log_test("Translate leigo - status", False, f"Expected 200, got {response.status_code}. Response: {response.text}")
            return
        
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        # Check required fields
        required_fields = ["plain", "alternatives", "explained_terms"]
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            log_test("Translate leigo - required fields", False, f"Missing fields: {missing_fields}")
            return
        
        log_test("Translate leigo - required fields", True)
        
        # Check plain is non-empty string
        plain = data.get("plain", "")
        if isinstance(plain, str) and len(plain) > 0:
            log_test("Translate leigo - plain field", True, f"Plain text: {plain[:100]}...")
        else:
            log_test("Translate leigo - plain field", False, "Plain should be non-empty string")
        
        # Check alternatives is array with ≤3 items
        alternatives = data.get("alternatives", [])
        if isinstance(alternatives, list):
            if len(alternatives) <= 3:
                log_test("Translate leigo - alternatives", True, f"Found {len(alternatives)} alternatives (≤3)")
            else:
                log_test("Translate leigo - alternatives", False, f"Found {len(alternatives)} alternatives (should be ≤3)")
        else:
            log_test("Translate leigo - alternatives", False, "Alternatives should be array")
        
        # Check explained_terms is array with term/explanation objects
        explained_terms = data.get("explained_terms", [])
        if isinstance(explained_terms, list):
            log_test("Translate leigo - explained_terms type", True, f"Found {len(explained_terms)} explained terms")
            
            # Verify structure of explained_terms
            if len(explained_terms) > 0:
                first_term = explained_terms[0]
                if isinstance(first_term, dict) and "term" in first_term and "explanation" in first_term:
                    log_test("Translate leigo - explained_terms structure", True, f"Valid structure: {first_term}")
                else:
                    log_test("Translate leigo - explained_terms structure", False, f"Invalid structure: {first_term}")
        else:
            log_test("Translate leigo - explained_terms type", False, "explained_terms should be array")
        
    except Exception as e:
        log_test("Translate leigo", False, f"Exception: {str(e)}")


def test_translate_idoso_tone():
    """Test POST /api/translate - TEST 2b: clinical question with tone='idoso'"""
    print("\n=== Test 3b: NEW ENDPOINT - Translate Clinical Question (tone='idoso') ===")
    try:
        payload = {
            "clinical_question": "Nas últimas 72h ingeriu ou esteve exposto a alguma substância tóxica como pesticidas, raticidas, lixívia, soda cáustica OU cogumelos selvagens?",
            "tone": "idoso"
        }
        
        response = requests.post(f"{API_BASE}/translate", json=payload, timeout=30)
        
        if response.status_code != 200:
            log_test("Translate idoso - status", False, f"Expected 200, got {response.status_code}. Response: {response.text}")
            return
        
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        # Check plain is non-empty string (reformulated for elderly)
        plain = data.get("plain", "")
        if isinstance(plain, str) and len(plain) > 0:
            log_test("Translate idoso - plain field", True, f"Reformulated: {plain[:100]}...")
        else:
            log_test("Translate idoso - plain field", False, "Plain should be non-empty string")
        
        # Check response structure
        if "alternatives" in data and "explained_terms" in data:
            log_test("Translate idoso - response structure", True, "Valid response structure")
        else:
            log_test("Translate idoso - response structure", False, "Missing required fields")
        
    except Exception as e:
        log_test("Translate idoso", False, f"Exception: {str(e)}")


def test_translate_empty_question():
    """Test POST /api/translate - TEST 2c: empty clinical_question should return 400"""
    print("\n=== Test 3c: NEW ENDPOINT - Translate Empty Question (Should Return 400) ===")
    try:
        payload = {
            "clinical_question": ""
        }
        
        response = requests.post(f"{API_BASE}/translate", json=payload, timeout=10)
        
        if response.status_code == 400:
            log_test("Translate empty question - status", True, "✓ Correctly returned 400")
            print(f"   Response: {response.text}")
        else:
            log_test("Translate empty question - status", False, f"Expected 400, got {response.status_code}")
        
    except Exception as e:
        log_test("Translate empty question", False, f"Exception: {str(e)}")


def test_translate_default_tone():
    """Test POST /api/translate - TEST 2d: without tone (default 'leigo')"""
    print("\n=== Test 3d: NEW ENDPOINT - Translate Without Tone (Default 'leigo') ===")
    try:
        payload = {
            "clinical_question": "Tem dificuldade respiratória ou dispneia em repouso?"
        }
        
        response = requests.post(f"{API_BASE}/translate", json=payload, timeout=30)
        
        if response.status_code != 200:
            log_test("Translate default tone - status", False, f"Expected 200, got {response.status_code}. Response: {response.text}")
            return
        
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        # Check response is valid
        required_fields = ["plain", "alternatives", "explained_terms"]
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            log_test("Translate default tone - response", False, f"Missing fields: {missing_fields}")
        else:
            log_test("Translate default tone - response", True, "✓ Valid response with default tone")
        
    except Exception as e:
        log_test("Translate default tone", False, f"Exception: {str(e)}")


def test_history_crud():
    """Test POST/GET/DELETE /api/history - REGRESSION: confirm CRUD still works"""
    print("\n=== Test 4: REGRESSION - History CRUD Operations ===")
    
    created_id = None
    
    # Test 4a: Create history entry
    print("\n--- Test 4a: POST /api/history (Create) ---")
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
            log_test("REGRESSION: Create history - status", False, f"Expected 200, got {response.status_code}. Response: {response.text}")
        else:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
            
            # Check for id and createdAt
            if "id" not in data:
                log_test("REGRESSION: Create history - id field", False, "Missing 'id' field")
            else:
                created_id = data["id"]
                log_test("REGRESSION: Create history - id field", True, f"ID: {created_id}")
            
            if "createdAt" not in data:
                log_test("REGRESSION: Create history - createdAt field", False, "Missing 'createdAt' field")
            else:
                log_test("REGRESSION: Create history - createdAt field", True, f"Created at: {data['createdAt']}")
        
    except Exception as e:
        log_test("REGRESSION: Create history", False, f"Exception: {str(e)}")
    
    # Test 4b: List history entries
    print("\n--- Test 4b: GET /api/history (List) ---")
    try:
        response = requests.get(f"{API_BASE}/history", timeout=10)
        
        if response.status_code != 200:
            log_test("REGRESSION: List history - status", False, f"Expected 200, got {response.status_code}. Response: {response.text}")
        else:
            data = response.json()
            
            if not isinstance(data, list):
                log_test("REGRESSION: List history - type", False, "Response should be array")
            else:
                log_test("REGRESSION: List history - type", True, f"Found {len(data)} entries")
                
                # Check if our created entry is in the list
                if created_id:
                    found = any(entry.get("id") == created_id for entry in data)
                    if found:
                        log_test("REGRESSION: List history - entry found", True, f"Entry {created_id} found")
                    else:
                        log_test("REGRESSION: List history - entry found", False, f"Entry {created_id} not found")
        
    except Exception as e:
        log_test("REGRESSION: List history", False, f"Exception: {str(e)}")
    
    # Test 4c: Delete history entry
    print("\n--- Test 4c: DELETE /api/history/{id} (Delete) ---")
    if created_id:
        try:
            response = requests.delete(f"{API_BASE}/history/{created_id}", timeout=10)
            
            if response.status_code != 200:
                log_test("REGRESSION: Delete history - status", False, f"Expected 200, got {response.status_code}. Response: {response.text}")
            else:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
                
                if data.get("deleted") == True:
                    log_test("REGRESSION: Delete history", True, f"✓ Entry {created_id} deleted")
                else:
                    log_test("REGRESSION: Delete history", False, f"Unexpected response: {data}")
                
                # Verify entry is removed
                response = requests.get(f"{API_BASE}/history", timeout=10)
                if response.status_code == 200:
                    entries = response.json()
                    found = any(entry.get("id") == created_id for entry in entries)
                    if not found:
                        log_test("REGRESSION: Delete history - verification", True, "✓ Entry removed from list")
                    else:
                        log_test("REGRESSION: Delete history - verification", False, "Entry still in list")
            
        except Exception as e:
            log_test("REGRESSION: Delete history", False, f"Exception: {str(e)}")
    else:
        log_test("REGRESSION: Delete history", False, "Skipped - no entry was created")
    
    # Test 4d: Delete non-existent entry (should return 404)
    print("\n--- Test 4d: DELETE /api/history/invalid-id (Should Return 404) ---")
    try:
        response = requests.delete(f"{API_BASE}/history/id-inexistente-12345", timeout=10)
        
        if response.status_code == 404:
            log_test("REGRESSION: Delete non-existent - status", True, "✓ Correctly returned 404")
            print(f"   Response: {response.text}")
        else:
            log_test("REGRESSION: Delete non-existent - status", False, f"Expected 404, got {response.status_code}")
        
    except Exception as e:
        log_test("REGRESSION: Delete non-existent", False, f"Exception: {str(e)}")


def main():
    """Run all tests"""
    print("=" * 80)
    print("TriagemAssist Backend API Tests - REGRESSION AFTER REFACTOR")
    print("=" * 80)
    
    # Run all tests
    test_health_check()
    
    # REGRESSION TESTS for /api/analyze (after refactor)
    test_analyze_regression_chest_pain()
    test_analyze_regression_empty_description()
    test_analyze_regression_nonsense_text()
    
    # NEW ENDPOINT TESTS for /api/translate
    test_translate_leigo_tone()
    test_translate_idoso_tone()
    test_translate_empty_question()
    test_translate_default_tone()
    
    # REGRESSION TEST for history CRUD
    test_history_crud()
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"✅ Passed: {tests_passed}")
    print(f"❌ Failed: {tests_failed}")
    print(f"📊 Total: {tests_passed + tests_failed}")
    print("=" * 80)
    
    # Exit with appropriate code
    sys.exit(0 if tests_failed == 0 else 1)


if __name__ == "__main__":
    main()
