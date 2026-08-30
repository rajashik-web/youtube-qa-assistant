from backend.app.services.youtube_service import (
    extract_video_id,
    fetch_video_metadata,
    fetch_transcript,
    format_transcript,
)

from backend.app.services.video_storage_service import (
    VideoStorageService,
)

from backend.app.services.chunking_service import (
    create_chunks,
)

from backend.app.utils.time_utils import (
    format_timestamp,
    create_youtube_timestamp_url,
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

from backend.app.services.cache_service import (
    CacheService,
)

import time

class RAGService:

    MIN_RELEVANCE_SCORE = 0.25

    def __init__(self):
        self.embedding_service = EmbeddingService()

        self.vector_store = QdrantVectorStore()

        self.llm_service = LLMService()

        self.video_storage = VideoStorageService()
        
        self.cache_service = CacheService()

        self.vector_store.create_collection(
            vector_size=384
        )


    def process_video(
    self,
    url: str,
    force_reprocess: bool = False,
):

        # --------------------------------
        # 1. Extract video ID
        # --------------------------------

        video_id = extract_video_id(
            url
        )


        # --------------------------------
        # 2. Check existing video
        # --------------------------------

        existing_video = (
            self.video_storage.get_video(
                video_id
            )
        )


        # --------------------------------
        # 3. Already processed
        # --------------------------------

        if (
    existing_video
    and existing_video["status"] == "processed"
    and not force_reprocess
        ):

            return {
                "video_id": video_id,
                "segments": existing_video["segments"],
                "chunks": existing_video["chunks"],
                "status": "already_processed",
    }


        # --------------------------------
        # 4. Already processing
        # --------------------------------

        if (
            existing_video
            and existing_video["status"] == "processing"
        ):

            return {
                "video_id": video_id,
                "segments": existing_video["segments"],
                "chunks": existing_video["chunks"],
                "status": "already_processing",
            }


        # --------------------------------
        # 5. Fetch video metadata
        # --------------------------------

        metadata = fetch_video_metadata(
            video_id
        )


        # --------------------------------
        # 6. Mark as processing
        # --------------------------------

        self.video_storage.create_or_update_video(
            video_id=video_id,
            title=metadata["title"],
            thumbnail_url=metadata[
                "thumbnail_url"
            ],
            status="processing",
        )


        return {
            "video_id": video_id,
            "segments": 0,
            "chunks": 0,
            "status": "processing",
        }

    def process_video_background(
        self,
        video_id: str,
    ):

        try:

            # --------------------------------
            # Fetch transcript
            # --------------------------------

            transcript = fetch_transcript(
                video_id
            )

            segments = format_transcript(
                transcript
            )

            # --------------------------------
            # Create chunks
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
            # Create embeddings
            # --------------------------------

            embeddings = (
                self.embedding_service.embed_documents(
                    chunk_texts
                )
            )

            # --------------------------------
            # Add video ID
            # --------------------------------

            for chunk in chunks:

                chunk["video_id"] = video_id

            # --------------------------------
            # Remove old vectors
            # --------------------------------

            if self.vector_store.video_exists(
                video_id
            ):

                self.vector_store.delete_video(
                    video_id
                )


            # --------------------------------
            # Clear old cached answers
            # --------------------------------

            self.cache_service.delete_video_cache(
                video_id
            )
            # --------------------------------
            # Store vectors
            # --------------------------------

            self.vector_store.add_documents(
                embeddings=embeddings,
                chunks=chunks,
            )

            # --------------------------------
            # Mark processed
            # --------------------------------

            self.video_storage.create_or_update_video(
                video_id=video_id,
                status="processed",
                segments=len(segments),
                chunks=len(chunks),
            )

            print(
                f"Video processed successfully: "
                f"{video_id}"
            )

        except Exception as error:

            print(
                f"Video processing failed: "
                f"{error}"
            )

            # Clean partial vectors
            if self.vector_store.video_exists(
                video_id
            ):

                self.vector_store.delete_video(
                    video_id
                )

            # Mark failed
            self.video_storage.create_or_update_video(
                video_id=video_id,
                status="failed",
            )

    def ask_question(
    self,
    video_id: str,
    question: str,
    top_k: int = 10,
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
        # 2. Check answer cache
        # --------------------------------

        cached_answer = (
            self.cache_service.get_cached_answer(
                video_id=video_id,
                question=question,
            )
        )

        not_found_message = (
            "I could not find the answer "
            "in the video transcript."
        )


        if cached_answer:

            if (
                cached_answer["answer"].strip()
                == not_found_message
            ):

                # Remove old bad cache entry
                self.cache_service.delete_cached_answer(
                    video_id=video_id,
                    question=question,
                )

                print(
                    "Removed old not-found cache entry."
                )

            else:

                print("Answer returned from cache!")

                return cached_answer


        # --------------------------------
        # Start total timer
        # --------------------------------

        total_start = time.perf_counter()


        # --------------------------------
        # 3. Embed question
        # --------------------------------

        embedding_start = time.perf_counter()

        query_embedding = (
            self.embedding_service.embed_query(
                question
            )[0]
        )

        embedding_time = (
            time.perf_counter()
            - embedding_start
        )


        # --------------------------------
        # 4. Search Qdrant
        # --------------------------------

        search_start = time.perf_counter()

        results = self.vector_store.search(
            query_embedding=query_embedding,
            video_id=video_id,
            top_k=top_k,
        )
        print("\n--- RETRIEVED CONTEXT ---")

        for index, result in enumerate(results, start=1):
            print(f"\nRESULT {index}")
            print(f"Score: {result['score']:.4f}")
            print(f"Text: {result['text'][:500]}")

        print("\n-------------------------\n")
        
        

        search_time = (
            time.perf_counter()
            - search_start
        )


        # --------------------------------
        # 5. Filter weak retrieval results
        # --------------------------------

        relevant_results = [
            result
            for result in results
            if result["score"]
            >= self.MIN_RELEVANCE_SCORE
        ]
        
        answer_results = relevant_results[:5]
        

        if not answer_results:

            total_time = (
                time.perf_counter()
                - total_start
            )

            print("\n--- RAG PERFORMANCE ---")

            print(
                f"Embedding: {embedding_time:.3f}s"
            )

            print(
                f"Qdrant:    {search_time:.3f}s"
            )

            print("LLM:       0.000s")

            print(
                f"Total:     {total_time:.3f}s"
            )

            print("-----------------------\n")

            return {
                "answer": (
                    "I could not find enough relevant "
                    "information in this video to answer "
                    "that question."
                ),
                "sources": [],
            }


        # --------------------------------
        # 6. Build context
        # --------------------------------

        context_parts = []

        for result in answer_results:

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
        # 7. Generate answer
        # --------------------------------

        llm_start = time.perf_counter()

        answer = self.llm_service.answer_question(
            question=question,
            context=context,
        )
        
        llm_time = (
                    time.perf_counter()
                    - llm_start
                )
        
        
        # --------------------------------
        # Check if LLM found an answer
        # --------------------------------

        not_found_message = (
            "I could not find the answer "
            "in the video transcript."
        )
        if answer.strip() == not_found_message:

            total_time = (
                time.perf_counter()
                - total_start
            )

            print("\n--- RAG PERFORMANCE ---")
            print(
                f"Embedding: {embedding_time:.3f}s"
            )
            print(
                f"Qdrant:    {search_time:.3f}s"
            )
            print(
                f"LLM:       {llm_time:.3f}s"
            )
            print(
                f"Total:     {total_time:.3f}s"
            )
            print("-----------------------\n")

            return {
                "answer": not_found_message,
                "sources": [],
            }



        # --------------------------------
        # 8. Build sources
        # --------------------------------

        sources = []

        # Show only the best 3 sources to the user
        source_results = answer_results[:3]

        for result in source_results:

            sources.append(
                {
                    "start_time": (
                        result["start_time"]
                    ),

                    "end_time": (
                        result["end_time"]
                    ),

                    "start_time_formatted": (
                        format_timestamp(
                            result["start_time"]
                        )
                    ),

                    "end_time_formatted": (
                        format_timestamp(
                            result["end_time"]
                        )
                    ),

                    "url": (
                        create_youtube_timestamp_url(
                            video_id=video_id,
                            seconds=result[
                                "start_time"
                            ],
                        )
                    ),

                    "score": result["score"],
                }
            )


        # --------------------------------
        # 9. Save answer to cache
        # --------------------------------

        self.cache_service.save_answer(
            video_id=video_id,
            question=question,
            answer=answer,
            sources=sources,
        )


        # --------------------------------
        # 10. Print performance
        # --------------------------------

        total_time = (
            time.perf_counter()
            - total_start
        )

        print("\n--- RAG PERFORMANCE ---")

        print(
            f"Embedding: {embedding_time:.3f}s"
        )

        print(
            f"Qdrant:    {search_time:.3f}s"
        )

        print(
            f"LLM:       {llm_time:.3f}s"
        )

        print(
            f"Total:     {total_time:.3f}s"
        )

        print("-----------------------\n")


        # --------------------------------
        # 11. Return response
        # --------------------------------

        return {
            "answer": answer,
            "sources": sources,
        }
        
    def get_all_videos(
    self,
    limit: int = 10,
    offset: int = 0,
    status: str | None = None,
    ):

        videos = self.video_storage.get_all_videos(
            limit=limit,
            offset=offset,
            status=status,
        )

        total = self.video_storage.get_video_count(
            status=status
        )

        return {
            "videos": videos,
            "total": total,
        }
        
    def update_video_metadata(
    self,
    video_id: str,
    ):

        # --------------------------------
        # 1. Check video exists
        # --------------------------------

        video = self.video_storage.get_video(
            video_id
        )

        if video is None:

            raise ValueError(
                "Video not found."
            )


        # --------------------------------
        # 2. Fetch YouTube metadata
        # --------------------------------

        metadata = fetch_video_metadata(
            video_id
        )


        # --------------------------------
        # 3. Update SQLite metadata
        # --------------------------------

        self.video_storage.update_video_metadata(
            video_id=video_id,
            title=metadata["title"],
            thumbnail_url=metadata[
                "thumbnail_url"
            ],
        )


        return {
            "video_id": video_id,
            "title": metadata["title"],
            "thumbnail_url": metadata[
                "thumbnail_url"
            ],
            "status": "metadata_updated",
        }
        
    def delete_video(
    self,
    video_id: str,
    ):

        # --------------------------------
        # 1. Check video metadata
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
        # 3. Delete cached answers
        # --------------------------------

        self.cache_service.delete_video_cache(
            video_id
        )


        # --------------------------------
        # 4. Delete metadata from SQLite
        # --------------------------------

        self.video_storage.delete_video(
            video_id
        )


        return {
            "status": "deleted",
            "video_id": video_id,
        }
        
        