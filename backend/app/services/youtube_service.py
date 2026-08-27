from urllib.parse import urlparse, parse_qs
from youtube_transcript_api import YouTubeTranscriptApi

class TranscriptFetchError(Exception):
    """Raised when a YouTube transcript cannot be fetched."""
    pass


def extract_video_id(url: str) -> str:
    parsed_url = urlparse(url)

    hostname = parsed_url.hostname

    if hostname == "youtu.be":
        return parsed_url.path.lstrip("/")

    if hostname in (
        "www.youtube.com",
        "youtube.com",
        "m.youtube.com",
    ):
        # Normal YouTube URL
        if parsed_url.path == "/watch":
            query_params = parse_qs(parsed_url.query)
            video_id = query_params.get("v")

            if video_id:
                return video_id[0]

        # YouTube Shorts URL
        if parsed_url.path.startswith("/shorts/"):
            parts = parsed_url.path.split("/")

            if len(parts) >= 3:
                return parts[2]

    raise ValueError("Invalid or unsupported YouTube URL")

def fetch_transcript(video_id: str):
    try:
        api = YouTubeTranscriptApi()

        transcript = api.fetch(video_id)

        return transcript

    except Exception as error:
        raise TranscriptFetchError(
            f"Could not fetch transcript: {error}"
        )
        
def format_transcript(transcript):
    segments = []

    for item in transcript:
        segments.append(
            {
                "text": item.text.replace("\n", " ").strip(),
                "start": item.start,
                "duration": item.duration,
            }
        )

    return segments