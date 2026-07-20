#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Clone do TriagemAssist (assistente de triagem médica em PT) com 50 algoritmos, análise LLM dos sintomas e histórico persistente em MongoDB."

backend:
  - task: "POST /api/analyze - Análise LLM de sintomas"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Endpoint usa emergentintegrations com openai/gpt-4.1-mini."
      - working: true
        agent: "testing"
        comment: "20/20 testes passaram anteriormente."
      - working: "NA"
        agent: "main"
        comment: "REFACTOR (code review fixes): llm_analyze dividido em _build_analyze_prompt/_build_analyze_result/_parse_json_response; keyword_fallback dividido em _score_algorithm/_build_suggestion/_empty_fallback. Comportamento externo idêntico. Retestar regressão."
      - working: true
        agent: "testing"
        comment: "✅ REGRESSION PASSED - Refactored code maintains full backward compatibility. Test results: (1) Chest pain correctly identified as 'dor-toracica' with LLM source, (2) Empty description correctly returns 400 error, (3) Nonsense text handled gracefully by LLM returning 'inespecifico' (LLM smart enough to process without fallback). Minor: Expected fallback for nonsense text but LLM handled it correctly with source='llm' - this is actually better behavior. All core functionality working correctly."

  - task: "POST /api/translate - Tradutor Clínico → Linguagem Leiga"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Novo endpoint POST /api/translate — recebe {clinical_question, tone} e devolve {plain, alternatives[], explained_terms[]}. Usa gpt-4.1-mini. Refatorado para partilhar _parse_json_response. Testar: (1) pergunta clínica tone=leigo deve reformular claramente; (2) empty clinical_question → 400; (3) verificar que explained_terms tem term/explanation."
      - working: true
        agent: "testing"
        comment: "✅ NEW ENDPOINT FULLY FUNCTIONAL - All 4 test cases passed: (1) tone='leigo' correctly translates clinical terms to plain language with proper explained_terms structure (e.g., 'letargia' → 'estado de muita sonolência'), (2) tone='idoso' reformulates questions appropriately for elderly patients, (3) Empty clinical_question correctly returns 400 error, (4) Default tone (no parameter) correctly defaults to 'leigo'. Response structure validated: plain (string), alternatives (array ≤3), explained_terms (array with term/explanation objects). LLM integration working perfectly."

  - task: "POST/GET/DELETE /api/history - CRUD histórico MongoDB"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "3 endpoints: criar (POST), listar (GET, ordenado desc por createdAt, top 100), apagar (DELETE por id). MongoDB coleção 'triagens'."
      - working: true
        agent: "testing"
        comment: "✅ PASSED - All CRUD operations working: (1) POST creates entries with UUID and ISO timestamp, (2) GET lists entries sorted by createdAt descending, (3) DELETE removes entries successfully and verified removal, (4) DELETE with invalid ID correctly returns 404. MongoDB integration working correctly."

frontend:
  - task: "Frontend UI + Integração backend"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/NovaTriagem.jsx, Historico.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Frontend migrado de mock/localStorage para axios ao backend. Desenho já confirmado pelo utilizador."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 3
  run_ui: false

test_plan:
  current_focus:
    - "POST /api/analyze - Análise LLM (regressão após refactor)"
    - "POST /api/translate - Tradutor Clínico (novo)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Backend implementado com análise LLM (gpt-4.1-mini via emergentintegrations + Emergent LLM Key) e CRUD histórico em MongoDB. Por favor testar: (1) POST /api/analyze com descrições em PT como 'aperto no peito com irradiação para o braço esquerdo' — deve retornar algorithm_id 'dor-toracica' e urgencyHint alto; (2) fluxo completo do histórico: criar entry, listar, apagar; (3) fallback: se LLM falhar (não conseguiremos forçar mas verificar estrutura). Nota: descrição vazia deve dar 400."
  - agent: "testing"
    message: "✅ Backend testing COMPLETE - All 20 tests passed! (1) Health check returns correct message and 50 algorithms, (2) POST /api/analyze working with LLM integration (Emergent LLM + gpt-4.1-mini) - correctly identifies symptoms and returns Portuguese responses with proper urgency hints, (3) All MongoDB CRUD operations working correctly with proper error handling. No critical issues found. Backend is fully functional and ready for production."
  - agent: "testing"
    message: "✅ REGRESSION TESTING COMPLETE (23/24 passed) - Backend refactor successful with NO regressions: (1) /api/analyze maintains full backward compatibility after internal refactoring (_build_analyze_prompt, _build_analyze_result, _parse_json_response, _score_algorithm, _build_suggestion, _empty_fallback), (2) NEW /api/translate endpoint fully functional with all tone variations (leigo, idoso, default), (3) History CRUD operations continue working correctly. Minor note: Nonsense text test expected fallback but LLM handled it gracefully with source='llm' - this is actually better behavior showing robust LLM processing. All critical functionality verified and working."
