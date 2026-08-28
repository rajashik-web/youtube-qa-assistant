def format_timestamp(seconds: float) -> str:

    total_seconds = int(seconds)

    hours = total_seconds // 3600
    minutes = (
        total_seconds % 3600
    ) // 60
    secs = total_seconds % 60

    if hours > 0:
        return (
            f"{hours:02d}:"
            f"{minutes:02d}:"
            f"{secs:02d}"
        )

    return (
        f"{minutes:02d}:"
        f"{secs:02d}"
    )
    
def create_youtube_timestamp_url(
    video_id: str,
    seconds: float,
) -> str:

    total_seconds = int(seconds)

    return (
        f"https://www.youtube.com/watch"
        f"?v={video_id}"
        f"&t={total_seconds}s"
    )