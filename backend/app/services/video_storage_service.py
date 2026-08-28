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

        print(
            "VIDEO DATABASE PATH:",
            self.db_path.resolve(),
        )

        self._create_table()

        # Add new columns to existing database
        self._migrate_database()


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
                title TEXT,
                thumbnail_url TEXT,
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


    def _migrate_database(self):
        """
        Add missing columns for existing databases.
        """

        connection = self._get_connection()

        cursor = connection.cursor()

        cursor.execute(
            "PRAGMA table_info(videos)"
        )

        existing_columns = {
            row[1]
            for row in cursor.fetchall()
        }

        if "title" not in existing_columns:

            cursor.execute(
                """
                ALTER TABLE videos
                ADD COLUMN title TEXT
                """
            )

            print(
                "Added title column."
            )


        if "thumbnail_url" not in existing_columns:

            cursor.execute(
                """
                ALTER TABLE videos
                ADD COLUMN thumbnail_url TEXT
                """
            )

            print(
                "Added thumbnail_url column."
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
                title,
                thumbnail_url,
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
            "title": row[1],
            "thumbnail_url": row[2],
            "status": row[3],
            "segments": row[4],
            "chunks": row[5],
            "created_at": row[6],
            "updated_at": row[7],
        }


    def create_or_update_video(
        self,
        video_id: str,
        status: str,
        segments: int = 0,
        chunks: int = 0,
        title: str | None = None,
        thumbnail_url: str | None = None,
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
                title,
                thumbnail_url,
                status,
                segments,
                chunks,
                created_at,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)

            ON CONFLICT(video_id)
            DO UPDATE SET
                title = COALESCE(
                    excluded.title,
                    videos.title
                ),
                thumbnail_url = COALESCE(
                    excluded.thumbnail_url,
                    videos.thumbnail_url
                ),
                status = excluded.status,
                segments = excluded.segments,
                chunks = excluded.chunks,
                updated_at = excluded.updated_at
            """,
            (
                video_id,
                title,
                thumbnail_url,
                status,
                segments,
                chunks,
                now,
                now,
            ),
        )

        connection.commit()

        connection.close()
        
    def update_video_metadata(
    self,
    video_id: str,
    title: str | None,
    thumbnail_url: str | None,
    ):

        now = datetime.now(
            timezone.utc
        ).isoformat()

        connection = self._get_connection()

        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE videos
            SET
                title = ?,
                thumbnail_url = ?,
                updated_at = ?
            WHERE video_id = ?
            """,
            (
                title,
                thumbnail_url,
                now,
                video_id,
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


    def get_all_videos(
        self,
        limit: int = 10,
        offset: int = 0,
        status: str | None = None,
    ):

        connection = self._get_connection()

        cursor = connection.cursor()

        query = """
            SELECT
                video_id,
                title,
                thumbnail_url,
                status,
                segments,
                chunks,
                created_at,
                updated_at
            FROM videos
        """

        parameters = []

        if status:

            query += """
                WHERE status = ?
            """

            parameters.append(status)


        query += """
            ORDER BY updated_at DESC
            LIMIT ?
            OFFSET ?
        """

        parameters.extend(
            [
                limit,
                offset,
            ]
        )

        cursor.execute(
            query,
            parameters,
        )

        rows = cursor.fetchall()

        connection.close()

        videos = []

        for row in rows:

            videos.append(
                {
                    "video_id": row[0],
                    "title": row[1],
                    "thumbnail_url": row[2],
                    "status": row[3],
                    "segments": row[4],
                    "chunks": row[5],
                    "created_at": row[6],
                    "updated_at": row[7],
                }
            )

        return videos


    def get_video_count(
        self,
        status: str | None = None,
    ) -> int:

        connection = self._get_connection()

        cursor = connection.cursor()

        if status:

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM videos
                WHERE status = ?
                """,
                (status,),
            )

        else:

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM videos
                """
            )

        count = cursor.fetchone()[0]

        connection.close()

        return count