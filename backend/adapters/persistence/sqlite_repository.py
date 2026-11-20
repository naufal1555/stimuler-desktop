import sqlite3
import logging
from pathlib import Path
from typing import Optional, List
from domain.entities import UserProfile, SessionRecord, MistakeRecord
from ports.repository_port import IUserRepository, ISessionRepository, IMistakeRepository

logger = logging.getLogger("stimuler.sqlite_repository")

class SQLiteRepository(IUserRepository, ISessionRepository, IMistakeRepository):
    """
    Unified SQLite repository adapter for Stimuler desktop database persistence.
    """

    def __init__(self, db_path: Path):
        self.db_path = Path(db_path)
        self.init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self) -> None:
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT DEFAULT 'Learner',
            streak_count INTEGER DEFAULT 1,
            last_practice_date TEXT,
            gemini_api_key TEXT,
            engine_mode TEXT DEFAULT 'hybrid'
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            topic_id INTEGER,
            topic_title TEXT,
            overall_score INTEGER,
            ielts_band REAL,
            duration_seconds INTEGER,
            words_spoken INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS mistakes_bank (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            target_item TEXT,
            detail TEXT,
            mastered INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        conn.commit()
        conn.close()

    # User Repository
    def get_user(self, user_id: str = "default_user") -> Optional[UserProfile]:
        conn = self._get_connection()
        c = conn.cursor()
        c.execute("SELECT id, name, streak_count, last_practice_date, gemini_api_key, engine_mode FROM users WHERE id = ?", (user_id,))
        row = c.fetchone()
        conn.close()
        if not row:
            return None
        return UserProfile(
            id=row["id"],
            name=row["name"],
            streak_count=row["streak_count"],
            last_practice_date=row["last_practice_date"],
            gemini_api_key=row["gemini_api_key"],
            engine_mode=row["engine_mode"]
        )

    def save_api_key(self, api_key: str, user_id: str = "default_user") -> None:
        conn = self._get_connection()
        c = conn.cursor()
        c.execute(
            "INSERT INTO users (id, gemini_api_key) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET gemini_api_key = excluded.gemini_api_key",
            (user_id, api_key.strip())
        )
        conn.commit()
        conn.close()

    # Session Repository
    def save_session(self, session: SessionRecord) -> None:
        conn = self._get_connection()
        c = conn.cursor()
        c.execute("""
        INSERT OR REPLACE INTO sessions (id, topic_id, topic_title, overall_score, ielts_band, duration_seconds, words_spoken)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            session.id,
            session.topic_id,
            session.topic_title,
            session.overall_score,
            session.ielts_band,
            session.duration_seconds,
            session.words_spoken
        ))
        conn.commit()
        conn.close()

    def get_recent_sessions(self, limit: int = 10) -> List[SessionRecord]:
        conn = self._get_connection()
        c = conn.cursor()
        c.execute("SELECT id, topic_id, topic_title, overall_score, ielts_band, duration_seconds, words_spoken, created_at FROM sessions ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = c.fetchall()
        conn.close()
        return [
            SessionRecord(
                id=r["id"],
                topic_id=r["topic_id"],
                topic_title=r["topic_title"],
                overall_score=r["overall_score"],
                ielts_band=r["ielts_band"],
                duration_seconds=r["duration_seconds"],
                words_spoken=r["words_spoken"],
                created_at=r["created_at"]
            )
            for r in rows
        ]

    # Mistake Repository
    def add_mistake(self, mistake: MistakeRecord) -> int:
        conn = self._get_connection()
        c = conn.cursor()
        c.execute("""
        INSERT INTO mistakes_bank (type, target_item, detail, mastered)
        VALUES (?, ?, ?, ?)
        """, (
            mistake.type,
            mistake.target_item,
            mistake.detail,
            1 if mistake.mastered else 0
        ))
        mistake_id = c.lastrowid
        conn.commit()
        conn.close()
        return mistake_id

    def get_unmastered_mistakes(self) -> List[MistakeRecord]:
        conn = self._get_connection()
        c = conn.cursor()
        c.execute("SELECT id, type, target_item, detail, mastered, created_at FROM mistakes_bank WHERE mastered = 0 ORDER BY id DESC")
        rows = c.fetchall()
        conn.close()
        return [
            MistakeRecord(
                id=r["id"],
                type=r["type"],
                target_item=r["target_item"],
                detail=r["detail"],
                mastered=bool(r["mastered"]),
                created_at=r["created_at"]
            )
            for r in rows
        ]

    def mark_mastered(self, mistake_id: int) -> None:
        conn = self._get_connection()
        c = conn.cursor()
        c.execute("UPDATE mistakes_bank SET mastered = 1 WHERE id = ?", (mistake_id,))
        conn.commit()
        conn.close()
