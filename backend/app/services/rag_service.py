from backend.app.services.youtube_service import (
    extract_video_id,
    fetch_transcript,
    format_transcript,
)

from backend.app.services.video_storage_service import (
    VideoStorageService,
)

from backend.app.services.chunking_service import (
    create_chunks,
)

from backend.app.services.embedding_service import (
    EmbeddingService,
)

from backend.app.services.qdrant_service import (
    QdrantVectorStore,
)

from backend.app.services.llm_service import (
    LLMService,
)


class RAGService:

    def __init__(self):
        self.embedding_service = EmbeddingService()

        self.vector_store = QdrantVectorStore()

        self.llm_service = LLMService()
        
        self.video_storage = VideoStorageService()

        # Ensure collection exists
        self.vector_store.create_collection(
            vector_size=384
        )


    def process_video(
    self,
    url: str,
    ):

        # --------------------------------
        # 1. Extract video ID
        # --------------------------------

        video_id = extract_video_id(url)


        # --------------------------------
        # 2. Check metadata
        # --------------------------------

        existing_video = (
            self.video_storage.get_video(
                video_id
            )
        )

        if (
            existing_video
            and existing_video["status"] == "processed"
        ):
            return {
                "video_id": video_id,
                "segments": existing_video["segments"],
                "chunks": existing_video["chunks"],
                "status": "already_processed",
            }


        # --------------------------------
        # 3. Mark as processing
        # --------------------------------

        self.video_storage.create_or_update_video(
            video_id=video_id,
            status="processing",
        )


        try:

            # --------------------------------
            # 4. Fetch transcript
            # --------------------------------

            transcript = fetch_transcript(
                video_id
            )

            segments = format_transcript(
                transcript
            )


            # --------------------------------
            # 5. Create chunks
            # --------------------------------

            chunks = create_chunks(
                segments,
                max_words=180,
            )

            chunk_texts = [
                chunk["text"]
                for chunk in chunks
            ]


            # --------------------------------
            # 6. Create embeddings
            # --------------------------------

            embeddings = (
                self.embedding_service.embed_documents(
                    chunk_texts
                )
            )


            # --------------------------------
            # 7. Add video metadata
            # --------------------------------

            for chunk in chunks:

                chunk["video_id"] = video_id


            # --------------------------------
            # 8. Remove old partial vectors
            # --------------------------------

            if self.vector_store.video_exists(
                video_id
            ):
                self.vector_store.delete_video(
                    video_id
                )


            # --------------------------------
            # 9. Store in Qdrant
            # --------------------------------

            self.vector_store.add_documents(
                embeddings=embeddings,
                chunks=chunks,
            )


            # --------------------------------
            # 10. Mark as processed
            # --------------------------------

            self.video_storage.create_or_update_video(
                video_id=video_id,
                status="processed",
                segments=len(segments),
                chunks=len(chunks),
            )


            return {
                "video_id": video_id,
                "segments": len(segments),
                "chunks": len(chunks),
                "status": "processed",
            }


        except Exception:

            # --------------------------------
            # Clean partial Qdrant data
            # --------------------------------

            if self.vector_store.video_exists(
                video_id
            ):
                self.vector_store.delete_video(
                    video_id
                )


            # --------------------------------
            # Mark as failed
            # --------------------------------

            self.video_storage.create_or_update_video(
                video_id=video_id,
                status="failed",
            )

            raise


    def ask_question(
    self,
    video_id: str,
    question: str,
    top_k: int = 3,
    ):

        # --------------------------------
        # 1. Check video metadata
        # --------------------------------

        video = self.video_storage.get_video(
            video_id
        )

        if video is None:

            raise ValueError(
                "This video has not been processed yet. "
                "Please process the video first."
            )

        if video["status"] == "processing":

            raise ValueError(
                "This video is currently being processed. "
                "Please try again shortly."
            )

        if video["status"] == "failed":

            raise ValueError(
                "Video processing failed. "
                "Please process the video again."
            )

        if video["status"] != "processed":

            raise ValueError(
                f"Video is not ready. "
                f"Current status: {video['status']}"
            )


        # --------------------------------
        # 2. Embed question
        # --------------------------------

        query_embedding = (
            self.embedding_service.embed_query(
                question
            )[0]
        )


        # --------------------------------
        # 3. Search Qdrant
        # --------------------------------

        results = self.vector_store.search(
            query_embedding=query_embedding,
            video_id=video_id,
            top_k=top_k,
        )

        if not results:

            raise ValueError(
                "No relevant information was found "
                "for this question."
            )


        # --------------------------------
        # 4. Build context
        # --------------------------------

        context_parts = []

        for result in results:

            context_parts.append(
                f"""
    [Timestamp: {result["start_time"]:.2f}s
    to {result["end_time"]:.2f}s]

    {result["text"]}
    """
            )

        context = "\n\n".join(
            context_parts
        )


        # --------------------------------
        # 5. Generate answer
        # --------------------------------

        answer = self.llm_service.answer_question(
            question=question,
            context=context,
        )


        # --------------------------------
        # 6. Build sources
        # --------------------------------

        sources = []

        for result in results:

            sources.append(
                {
                    "start_time": result[
                        "start_time"
                    ],
                    "end_time": result[
                        "end_time"
                    ],
                    "score": result["score"],
                }
            )


        return {
            "answer": answer,
            "sources": sources,
        }
        
    def delete_video(
    self,
    video_id: str,
    ):

        # --------------------------------
        # 1. Check SQLite metadata
        # --------------------------------

        video = self.video_storage.get_video(
            video_id
        )

        if video is None:
            raise ValueError(
                "Video not found."
            )


        # --------------------------------
        # 2. Delete vectors from Qdrant
        # --------------------------------

        self.vector_store.delete_video(
            video_id
        )


        # --------------------------------
        # 3. Delete metadata from SQLite
        # --------------------------------

        self.video_storage.delete_video(
            video_id
        )


        return {
            "status": "deleted",
            "video_id": video_id,
        }