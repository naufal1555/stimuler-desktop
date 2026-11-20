from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from api.container import container

router = APIRouter(prefix="/api/settings", tags=["settings"])

class SaveApiKeyRequest(BaseModel):
    api_key: str

@router.post("/apikey")
def save_api_key(req: SaveApiKeyRequest):
    try:
        container.settings_uc.save_api_key(req.api_key)
        return {"status": "success", "message": "API key saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/apikey")
def get_api_key_status():
    return container.settings_uc.get_api_key_status()
