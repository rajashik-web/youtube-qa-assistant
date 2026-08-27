from urllib.parse import urlparse, parse_qs

from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
)

import time


class TranscriptFetchError(Exception):
    """Raised when a YouTube transcript cannot be fetched."""
    pass


def extract_video_id(url: str) -> str:
    parsed_url = urlparse(url)
    hostname = parsed_url.hostname

    if hostname == "youtu.be":
        video_id = parsed_url.path.lstrip("/").split("/")[0]

        if video_id:
            return video_id

    if hostname in (
        "www.youtube.com",
        "youtube.com",
        "m.youtube.com",
    ):
        if parsed_url.path == "/watch":
            query_params = parse_qs(parsed_url.query)
            video_id = query_params.get("v")

            if video_id:
                return video_id[0]

        if parsed_url.path.startswith("/shorts/"):
            parts = parsed_url.path.split("/")

            if len(parts) >= 3 and parts[2]:
                return parts[2]

    raise ValueError("Invalid or unsupported YouTube URL")


def fetch_transcript(
    video_id: str,
    retries: int = 3,
):
    last_error = None

    for attempt in range(retries):

        try:
            transcript = (
                YouTubeTranscriptApi()
                .fetch(video_id)
            )

            return transcript

        except TranscriptsDisabled:
            raise TranscriptFetchError(
                "Transcript is disabled for this video."
            )

        except NoTranscriptFound:
            raise TranscriptFetchError(
                "No transcript was found for this video."
            )

        except Exception as error:

            last_error = error

            print(
                f"Transcript attempt "
                f"{attempt + 1}/{retries} failed: "
                f"{error}"
            )

            if attempt < retries - 1:
                time.sleep(3)

    raise TranscriptFetchError(
        f"Could not fetch transcript: {last_error}"
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