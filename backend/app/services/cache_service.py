import sqlite3
import json
from pathlib import Path
from datetime import datetime, timezone


BASE_DIR = Path(__file__).resolve().parents[3]

DATA_DIR = BASE_DIR / "data"

DATA_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


class CacheService:

    def __init__(self):

        self.db_path = (
            DATA_DIR / "cache.db"
        )

        self._create_table()


    def _get_connection(self):

        return sqlite3.connect(
            self.db_path
        )


    def _create_table(self):

        connection = self._get_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS question_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                video_id TEXT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                sources TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(video_id, question)
            )
            """
        )

        connection.commit()

        connection.close()
        
    def get_cached_answer(
    self,
    video_id: str,
    question: str,
    ):

        connection = self._get_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                answer,
                sources
            FROM question_cache
            WHERE video_id = ?
            AND question = ?
            """,
            (
                video_id,
                question,
            ),
        )

        row = cursor.fetchone()

        connection.close()

        if row is None:
            return None

        return {
            "answer": row[0],
            "sources": json.loads(
                row[1]
            ),
        }


    def save_answer(
        self,
        video_id: str,
        question: str,
        answer: str,
        sources: list,
    ):

        now = datetime.now(
            timezone.utc
        ).isoformat()

        connection = self._get_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT OR REPLACE INTO question_cache (
                video_id,
                question,
                answer,
                sources,
                created_at
            )
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                video_id,
                question,
                answer,
                json.dumps(sources),
                now,
            ),
        )

        connection.commit()

        connection.close()
        
    def delete_cached_answer(
        self,
        video_id: str,
        question: str,
    ):

        connection = self._get_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM question_cache
            WHERE video_id = ?
            AND question = ?
            """,
            (
                video_id,
                question,
            ),
        )

        connection.commit()

        connection.close()
        
    def delete_video_cache(
    self,
    video_id: str,
    ):

        connection = self._get_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM question_cache
            WHERE video_id = ?
            """,
            (video_id,),
        )

        connection.commit()

        connection.close()

        print(
            f"Deleted cached answers for video: "
            f"{video_id}"
        )