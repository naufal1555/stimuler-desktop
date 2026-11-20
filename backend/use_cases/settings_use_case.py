import os
from typing import Dict, Any, Optional
from ports.repository_port import IUserRepository

class SettingsUseCase:
    """
    Manages user settings such as Google Gemini API keys.
    """

    def __init__(self, user_repo: IUserRepository):
        self.user_repo = user_repo

    def save_api_key(self, api_key: str, user_id: str = "default_user") -> None:
        key = api_key.strip()
        self.user_repo.save_api_key(key, user_id)
        os.environ["GEMINI_API_KEY"] = key

    def get_api_key_status(self, user_id: str = "default_user") -> Dict[str, Any]:
        env_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if env_key:
            return {"has_key": True, "masked_key": f"{env_key[:4]}...{env_key[-4:]}"}
        user = self.user_repo.get_user(user_id)
        if user and user.gemini_api_key:
            k = user.gemini_api_key
            return {"has_key": True, "masked_key": f"{k[:4]}...{k[-4:]}"}
        return {"has_key": False}
