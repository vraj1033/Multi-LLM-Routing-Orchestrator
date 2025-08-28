#!/bin/bash

echo "Starting Multi-LLM Router..."
echo

echo "Starting Backend..."
cd backend
gnome-terminal --title="Backend" -- bash -c "python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && uvicorn main:app --reload --host 0.0.0.0 --port 8000; exec bash" &

echo
echo "Starting Frontend..."
cd ../frontend
gnome-terminal --title="Frontend" -- bash -c "npm install && npm run dev; exec bash" &

echo
echo "Services are starting..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8000/docs"
echo
echo "Press Ctrl+C to stop all services..."
wait







