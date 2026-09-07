def split_text(
    text: str,
    max_words: int = 80,
):
    words = text.split()

    return [
        " ".join(
            words[i:i + max_words]
        )
        for i in range(
            0,
            len(words),
            max_words,
        )
    ]


def create_chunks(
    segments,
    max_words=180,
    overlap_words=30,
):
    """
    Create smaller overlapping chunks for better RAG retrieval.
    """

    prepared_segments = []

    for segment in segments:

        text = segment["text"]
        words = text.split()

        # Skip empty segments
        if not words:
            continue

        # Split very long segments
        if len(words) > max_words:

            pieces = split_text(
                text,
                max_words=max_words,
            )

            total_duration = (
                segment["duration"]
            )

            piece_duration = (
                total_duration / len(pieces)
            )

            for i, piece in enumerate(pieces):

                prepared_segments.append(
                    {
                        "text": piece,
                        "start": (
                            segment["start"]
                            + i * piece_duration
                        ),
                        "duration": piece_duration,
                    }
                )

        else:

            prepared_segments.append(
                segment
            )

    # -----------------------------------
    # Create overlapping chunks
    # -----------------------------------

    chunks = []

    current_words = []
    chunk_start_time = None
    chunk_end_time = None

    for segment in prepared_segments:

        words = segment["text"].split()

        if chunk_start_time is None:
            chunk_start_time = segment["start"]

        current_words.extend(words)

        chunk_end_time = (
            segment["start"]
            + segment["duration"]
        )

        # Create chunk
        if len(current_words) >= max_words:

            chunk_text = " ".join(
                current_words[:max_words]
            )

            chunks.append(
                {
                    "text": chunk_text,
                    "start_time": chunk_start_time,
                    "end_time": chunk_end_time,
                }
            )

            # Keep overlap
            current_words = (
                current_words[
                    max_words - overlap_words:
                ]
            )

            chunk_start_time = (
                segment["start"]
            )

    # Final chunk
    if current_words:

        chunks.append(
            {
                "text": " ".join(current_words),
                "start_time": chunk_start_time,
                "end_time": chunk_end_time,
            }
        )

    return chunks