import json
from pathlib import Path
from typing import Dict, Any, Optional

class CatalogQueriesUseCase:
    """
    Retrieves and unlocks educational catalogs (topics, courses, analysis)
    from extracted asset mock data.
    """

    def __init__(self, mock_data_dir: Path):
        self.mock_data_dir = Path(mock_data_dir)

    def get_topics(self) -> Optional[Dict[str, Any]]:
        topics_file = self.mock_data_dir / "conversation_v4_topics.json"
        if not topics_file.exists():
            return None
        with open(topics_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            for cat in data.get("data", {}).get("categories", []):
                cat["attempt_status"] = "available"
                for topic in cat.get("topics", []):
                    if topic.get("attempt_status") == "premium_locked":
                        topic["attempt_status"] = "available"
            return data

    def get_courses(self) -> Optional[Dict[str, Any]]:
        courses_file = self.mock_data_dir / "courses.json"
        if not courses_file.exists():
            return None
        with open(courses_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            for course in data.get("data", {}).get("courses", []):
                course["show_premium_paywall"] = False
                for ch in course.get("chapters", []):
                    if ch.get("attempt_status") == "locked_premium":
                        ch["attempt_status"] = "unlocked_free"
            return data

    def get_default_analysis(self) -> Optional[Dict[str, Any]]:
        analysis_file = self.mock_data_dir / "analysis_v2_analysis.json"
        if not analysis_file.exists():
            return None
        with open(analysis_file, "r", encoding="utf-8") as f:
            return json.load(f)
