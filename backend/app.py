"""
Stimuler Desktop Backend Entrypoint Facade.
Delegates to main.py under Hexagonal / Clean Architecture.
"""
from main import app, PORT

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=PORT, reload=False)
