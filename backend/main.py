import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.endpoints import router as api_router

app = FastAPI(
    title="CyberSuraksha: Proactive Spatial Interdiction API",
    description="Real-time multi-agency cyber fraud defense engine. Sub-60s interdiction before physical ATM cash-out.",
    version="1.0.0"
)

# Configure CORS for Next.js 15 frontend and multi-agency clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount endpoints under /api
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {
        "system": "CyberSuraksha Command Core",
        "jurisdiction": "Indian Cyber Crime Coordination Centre (I4C) / State LEAs",
        "statutory_mandate": "Section 102 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023",
        "docs_url": "/docs",
        "status": "OPERATIONAL"
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
