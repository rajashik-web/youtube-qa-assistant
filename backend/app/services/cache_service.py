import json

from sqlalchemy.orm import Session

from app.models.question_cache import QuestionCache


class CacheService:

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _normalize_question(
        question: str,
    ) -> str:

        return question.strip().lower()

    def get_cached_answer(
        self,
        video_id: str,
        question: str,
    ):

        question = self._normalize_question(
            question
        )

        cache_entry = (
            self.db.query(QuestionCache)
            .filter(
                QuestionCache.video_id == video_id,
                QuestionCache.question == question,
            )
            .first()
        )

        if cache_entry is None:

            return None

        try:

            sources = json.loads(
                cache_entry.sources
            )

        except (
            json.JSONDecodeError,
            TypeError,
        ):

            sources = []

        return {
            "answer": cache_entry.answer,
            "sources": sources,
        }

    def save_answer(
        self,
        video_id: str,
        question: str,
        answer: str,
        sources: list,
    ):

        question = self._normalize_question(
            question
        )

        cache_entry = (
            self.db.query(QuestionCache)
            .filter(
                QuestionCache.video_id == video_id,
                QuestionCache.question == question,
            )
            .first()
        )

        sources_json = json.dumps(
            sources
        )

        if cache_entry is None:

            cache_entry = QuestionCache(
                video_id=video_id,
                question=question,
                answer=answer,
                sources=sources_json,
            )

            self.db.add(
                cache_entry
            )

        else:

            cache_entry.answer = answer
            cache_entry.sources = sources_json

        self.db.commit()

        self.db.refresh(
            cache_entry
        )

    def delete_cached_answer(
        self,
        video_id: str,
        question: str,
    ):

        question = self._normalize_question(
            question
        )

        cache_entry = (
            self.db.query(QuestionCache)
            .filter(
                QuestionCache.video_id == video_id,
                QuestionCache.question == question,
            )
            .first()
        )

        if cache_entry is None:

            return False

        self.db.delete(
            cache_entry
        )

        self.db.commit()

        return True

    def delete_video_cache(
        self,
        video_id: str,
    ):

        deleted_count = (
            self.db.query(QuestionCache)
            .filter(
                QuestionCache.video_id == video_id
            )
            .delete(
                synchronize_session=False
            )
        )

        self.db.commit()

        print(
            f"Deleted {deleted_count} cached answers "
            f"for video: {video_id}"
        )

        return deleted_count