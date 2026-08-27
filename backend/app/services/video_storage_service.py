import sqlite3
from pathlib import Path
from datetime import datetime, timezone


# Project root:
# youtube-qa-assistant/
BASE_DIR = Path(__file__).resolve().parents[3]

DATA_DIR = BASE_DIR / "data"

DATA_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


class VideoStorageService:

    def __init__(self):

        self.db_path = (
            DATA_DIR / "videos.db"
        )
        
        print("VIDEO DATABASE PATH:", self.db_path.resolve())

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
            CREATE TABLE IF NOT EXISTS videos (
                video_id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                segments INTEGER DEFAULT 0,
                chunks INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            )
            """
        )

        connection.commit()

        connection.close()


    def get_video(
        self,
        video_id: str,
    ):

        connection = self._get_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT
                video_id,
                status,
                segments,
                chunks,
                created_at,
                updated_at
            FROM videos
            WHERE video_id = ?
            """,
            (video_id,),
        )

        row = cursor.fetchone()

        connection.close()

        if row is None:
            return None

        return {
            "video_id": row[0],
            "status": row[1],
            "segments": row[2],
            "chunks": row[3],
            "created_at": row[4],
            "updated_at": row[5],
        }


    def create_or_update_video(
        self,
        video_id: str,
        status: str,
        segments: int = 0,
        chunks: int = 0,
    ):

        now = datetime.now(
            timezone.utc
        ).isoformat()

        connection = self._get_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO videos (
                video_id,
                status,
                segments,
                chunks,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?)

            ON CONFLICT(video_id)
            DO UPDATE SET
                status = excluded.status,
                segments = excluded.segments,
                chunks = excluded.chunks,
                updated_at = excluded.updated_at
            """,
            (
                video_id,
                status,
                segments,
                chunks,
                now,
                now,
            ),
        )

        connection.commit()

        connection.close()


    def delete_video(
        self,
        video_id: str,
    ):

        connection = self._get_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            DELETE FROM videos
            WHERE video_id = ?
            """,
            (video_id,),
        )

        connection.commit()

        connection.close()