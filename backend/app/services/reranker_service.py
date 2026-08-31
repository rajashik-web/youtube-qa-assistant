from sentence_transformers import CrossEncoder


class RerankerService:

    def __init__(self):

        print("Loading reranker model...")

        self.model = CrossEncoder(
            "cross-encoder/ms-marco-MiniLM-L-6-v2"
        )

        print("Reranker model loaded successfully.")


    def rerank(
        self,
        question: str,
        results: list,
        top_k: int = 5,
    ) -> list:

        if not results:
            return []


        pairs = [
            (question, result["text"])
            for result in results
        ]


        scores = self.model.predict(
            pairs
        )


        for result, score in zip(
            results,
            scores,
        ):

            result["rerank_score"] = float(
                score
            )


        reranked_results = sorted(
            results,
            key=lambda item: item[
                "rerank_score"
            ],
            reverse=True,
        )


        return reranked_results[:top_k]