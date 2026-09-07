from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.video import Video


class VideoStorageService:

    def __init__(self, db: Session):
        self.db = db


    def get_video(
        self,
        video_id: str,
        user_id: int,
    ):
        video = (
            self.db.query(Video)
            .filter(
                Video.video_id == video_id,
                Video.user_id == user_id,
            )
            .first()
        )

        if video is None:
            return None

        return self._to_dict(video)


    def create_or_update_video(
        self,
        video_id: str,
        user_id: int,
        status: str,
        segments: int = 0,
        chunks: int = 0,
        title: str | None = None,
        thumbnail_url: str | None = None,
    ):

        video = (
            self.db.query(Video)
            .filter(
                Video.video_id == video_id,
                Video.user_id == user_id,
            )
            .first()
        )

        if video is None:

            video = Video(
                video_id=video_id,
                user_id=user_id,
                title=title,
                thumbnail_url=thumbnail_url,
                status=status,
                segments=segments,
                chunks=chunks,
            )

            self.db.add(video)

        else:

            if title is not None:
                video.title = title

            if thumbnail_url is not None:
                video.thumbnail_url = thumbnail_url

            video.status = status
            video.segments = segments
            video.chunks = chunks
            video.updated_at = datetime.now(timezone.utc)

        self.db.commit()

        self.db.refresh(video)

        return self._to_dict(video)


    def update_video_metadata(
        self,
        video_id: str,
        user_id: int,
        title: str | None,
        thumbnail_url: str | None,
    ):

        video = (
            self.db.query(Video)
            .filter(
                Video.video_id == video_id,
                Video.user_id == user_id,
            )
            .first()
        )

        if video is None:
            return None

        video.title = title
        video.thumbnail_url = thumbnail_url
        video.updated_at = datetime.now(timezone.utc)

        self.db.commit()

        self.db.refresh(video)

        return self._to_dict(video)


    def delete_video(
        self,
        video_id: str,
        user_id: int,
    ):

        video = (
            self.db.query(Video)
            .filter(
                Video.video_id == video_id,
                Video.user_id == user_id,
            )
            .first()
        )

        if video is None:
            return False

        self.db.delete(video)

        self.db.commit()

        return True


    def get_all_videos(
        self,
        user_id: int,
        limit: int = 10,
        offset: int = 0,
        status: str | None = None,
    ):

        query = (
            self.db.query(Video)
            .filter(
                Video.user_id == user_id,
            )
        )

        if status:
            query = query.filter(
                Video.status == status
            )

        videos = (
            query
            .order_by(Video.updated_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

        return [
            self._to_dict(video)
            for video in videos
        ]


    def get_video_count(
        self,
        user_id: int,
        status: str | None = None,
    ) -> int:

        query = (
            self.db.query(
                func.count(Video.id)
            )
            .filter(
                Video.user_id == user_id,
            )
        )

        if status:
            query = query.filter(
                Video.status == status
            )

        return query.scalar() or 0


    @staticmethod
    def _to_dict(
        video: Video,
    ):

        return {
            "video_id": video.video_id,
            "title": video.title,
            "thumbnail_url": video.thumbnail_url,
            "status": video.status,
            "segments": video.segments,
            "chunks": video.chunks,
            "created_at": video.created_at,
            "updated_at": video.updated_at,
        }