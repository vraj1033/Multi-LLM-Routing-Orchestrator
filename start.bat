@echo off
echo Starting Multi-LLM Router...
echo.

echo Starting Backend...
cd backend
start "Backend" cmd /k "python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo Starting Frontend...
cd ..\frontend
start "Frontend" cmd /k "npm install && npm run dev"

echo.
echo Services are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause > nul







