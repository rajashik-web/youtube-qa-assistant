from pathlib import Path
import json

import faiss
import numpy as np


class FAISSVectorStore:

    def __init__(self, dimension: int):
        self.index = faiss.IndexFlatIP(dimension)
        self.chunks = []

    def add_documents(
        self,
        embeddings: np.ndarray,
        chunks: list[dict],
    ):
        embeddings = np.asarray(
            embeddings,
            dtype=np.float32,
        )

        self.index.add(embeddings)
        self.chunks.extend(chunks)

    def search(
        self,
        query_embedding: np.ndarray,
        top_k: int = 3,
    ):
        query_embedding = np.asarray(
            query_embedding,
            dtype=np.float32,
        )

        scores, indices = self.index.search(
            query_embedding,
            top_k,
        )

        results = []

        for score, index in zip(
            scores[0],
            indices[0],
        ):
            if index != -1:
                results.append(
                    {
                        "chunk": self.chunks[index],
                        "score": float(score),
                    }
                )

        return results

    def save(
        self,
        index_path: str,
        chunks_path: str,
    ):
        # Create parent directories
        Path(index_path).parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        Path(chunks_path).parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        # Save FAISS index
        faiss.write_index(
            self.index,
            index_path,
        )

        # Save chunk metadata
        with open(
            chunks_path,
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                self.chunks,
                file,
                ensure_ascii=False,
                indent=2,
            )

    @classmethod
    def load(
        cls,
        index_path: str,
        chunks_path: str,
    ):
        # Load FAISS index
        index = faiss.read_index(
            index_path
        )

        # Load chunk metadata
        with open(
            chunks_path,
            "r",
            encoding="utf-8",
        ) as file:
            chunks = json.load(file)

        # Get embedding dimension
        dimension = index.d

        # Create object
        vector_store = cls(
            dimension=dimension
        )

        # Replace empty index
        vector_store.index = index
        vector_store.chunks = chunks

        return vector_store