from backend.app.services.youtube_service import (
    extract_video_id,
    fetch_transcript,
    format_transcript,
    TranscriptFetchError,
)
from backend.app.services.chunking_service import create_chunks

# "https://www.youtube.com/watch?v=1KNyLwyTkQ0"

url = "https://www.youtube.com/watch?v=wvx8Q1RdZkI"




try:
    video_id = extract_video_id(url)

    print("Video ID:", video_id)

    transcript = fetch_transcript(video_id)

    segments = format_transcript(transcript)
    
    chunks = create_chunks(segments)

    print("\nNumber of chunks:", len(chunks))

    print("\nFirst chunk:")
    print(chunks[0])

    print("\nTranscript fetched successfully!")
    print("Number of segments:", len(segments))

    print("\nFirst 3 formatted segments:")
    
    last_segment = segments[-1]

    end_time = (
        last_segment["start"]
        + last_segment["duration"]
    )

    print("\nLast segment:")
    print(last_segment)

    print("\nVideo transcript end time:", end_time, "seconds")
    print("Approximately:", round(end_time / 60, 2), "minutes")

    for segment in segments[:3]:
        print(segment)

except ValueError as error:
    print("URL Error:", error)

except TranscriptFetchError as error:
    print("Transcript Error:", error)