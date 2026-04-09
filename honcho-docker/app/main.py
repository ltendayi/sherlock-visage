from fastapi import FastAPI
import datetime
import os

app = FastAPI(title="Honcho Docker App")

@app.get("/")
async def root():
    return {
        "message": "Honcho Docker Application",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "status": "running",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy", 
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "services": {
            "web": "running",
            "worker": "running",
            "scheduler": "running",
            "monitor": "running"
        }
    }

@app.get("/processes")
async def processes():
    import subprocess
    try:
        result = subprocess.run(["honcho", "status"], capture_output=True, text=True, timeout=5)
        processes_list = result.stdout.split("\n") if result.stdout else []
        return {"processes": [p for p in processes_list if p.strip()]}
    except Exception as e:
        return {"error": str(e), "processes": []}
