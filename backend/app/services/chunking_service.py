def create_chunks(
    segments,
    max_words=250,
):
    chunks = []

    current_texts = []
    current_word_count = 0
    chunk_start_time = None
    chunk_end_time = None

    for segment in segments:

        text = segment["text"]
        word_count = len(text.split())

        # Start a new chunk if adding this segment
        # would exceed max_words
        if (
            current_word_count + word_count > max_words
            and current_texts
        ):

            chunks.append(
                {
                    "text": " ".join(current_texts),
                    "start_time": chunk_start_time,
                    "end_time": chunk_end_time,
                }
            )

            # Reset for next chunk
            current_texts = []
            current_word_count = 0
            chunk_start_time = None
            chunk_end_time = None

        # Start time of the chunk
        if chunk_start_time is None:
            chunk_start_time = segment["start"]

        current_texts.append(text)

        current_word_count += word_count

        # Calculate segment end time
        chunk_end_time = (
            segment["start"]
            + segment["duration"]
        )

    # Add the final chunk
    if current_texts:
        chunks.append(
            {
                "text": " ".join(current_texts),
                "start_time": chunk_start_time,
                "end_time": chunk_end_time,
            }
        )

    return chunks