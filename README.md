# Multi-LLM Routing Orchestrator

A local-first, zero-cost API Multi-LLM Routing Orchestrator with intelligent prompt routing, local Ollama models, and free API integrations.

## Features

- 🧠 **Intelligent Routing**: Automatically routes prompts to the best model based on task classification
- 🆓 **Zero Cost**: Uses only free APIs (Groq, Hugging Face) and local Ollama models
- 🏠 **Local First**: Ollama models run locally for privacy and reliability
- 📊 **Usage Dashboard**: Track requests, latency, and success rates
- 🌓 **Theme Toggle**: Light/Dark mode with persistent preferences
- 🔍 **Recent Searches**: Persistent search history with instant access
- ⚡ **Fast Fallback**: Automatic fallback to local models if APIs fail
- 🏷️ **Smart Chat Titles**: Auto-generates meaningful chat titles like ChatGPT

## Tech Stack

### Backend
- **FastAPI** (async) with Python 3.9+
- **SQLAlchemy** (async) + **Alembic** for database migrations
- **PostgreSQL** for data persistence
- **JWT** authentication with bcrypt password hashing
- **httpx** for external API calls

### Frontend
- **React 18** + **Vite** with TypeScript
- **Tailwind CSS** + **shadcn/ui** components
- **Zustand** for state management
- **React Query** for API calls
- **Framer Motion** for animations

### LLM Providers
- **Ollama Local Models**: llama3.1:8b, mistral:7b, gemma:2b
- **Groq API**: llama3-8b-8192, mixtral-8x7b-32768 (free tier)
- **Hugging Face**: tiiuae/falcon-7b-instruct, microsoft/Phi-3-mini (free tier)

## Quick Start

### Prerequisites

1. **Python 3.9+** and **Node.js 18+**
2. **PostgreSQL** database (or use the provided Neon database)
3. **Ollama** installed locally

### Option 1: Quick Start (Windows)

1. **Install Ollama Models**
   ```bash
   # Install Ollama first: https://ollama.ai/
   ollama pull llama3.1:8b
   ollama pull mistral:7b
   ollama pull gemma:2b
   ```

2. **Run the Application**
   ```bash
   # Double-click start.bat or run in command prompt
   start.bat
   ```

### Option 2: Manual Setup

#### 1. Install Ollama Models
```bash
# Install Ollama first: https://ollama.ai/
ollama pull llama3.1:8b
ollama pull mistral:7b
ollama pull gemma:2b
```

#### 2. Setup Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
# On Windows: venv\Scripts\activate
# On Unix/Mac: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from env.example)
cp env.example .env

# Edit .env with your settings (API keys are pre-configured)
# DATABASE_URL is already set to a free Neon database

# Setup database
alembic upgrade head

# Run backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

#### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Option 3: Unix/Linux/Mac

```bash
# Make script executable
chmod +x start.sh

# Run the application
./start.sh
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/llm_router

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Keys (Free Tiers)
GROQ_API_KEY=your-groq-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### LLM Generation
- `POST /llm/generate` - Generate response with intelligent routing
- `POST /llm/generate-title` - Generate smart chat titles based on conversation
- `GET /llm/models` - List available models

### Recent Searches
- `GET /searches/recent` - Get user's recent searches
- `POST /searches` - Save new search

### Metrics
- `GET /metrics/summary` - Get usage summary
- `GET /metrics/series` - Get time-series data

## Routing Logic

The system automatically classifies prompts and routes them to optimal models:

- **Reasoning** → Groq mixtral-8x7b (fast & free)
- **Coding** → Groq llama3-8b
- **Creative** → Hugging Face Phi-3-mini
- **Summarization** → Ollama mistral:7b
- **Casual/QnA** → Ollama llama3.1:8b

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── core/          # Config & security
│   │   ├── models/        # Database models
│   │   ├── providers/     # LLM provider implementations
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities
│   ├── alembic/           # Database migrations
│   ├── requirements.txt    # Python dependencies
│   └── main.py           # FastAPI app entry point
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── stores/        # Zustand stores
│   │   └── types/         # TypeScript types
│   ├── package.json       # Node dependencies
│   └── vite.config.ts     # Vite configuration
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
