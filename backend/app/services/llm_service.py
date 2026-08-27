import os

from dotenv import load_dotenv
from groq import Groq


load_dotenv()


class LLMService:

    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")

        if not api_key:
            raise ValueError(
                "GROQ_API_KEY is not set in the .env file"
            )

        self.client = Groq(
            api_key=api_key
        )

    def answer_question(
        self,
        question: str,
        context: str,
    ) -> str:

        prompt = f"""
You are a YouTube Video Question Answering Assistant.

Answer the user's question using ONLY the transcript
context provided below.

Rules:
1. Do not use outside knowledge.
2. If the answer is not present in the context, say:
   "I could not find the answer in the video transcript."
3. Give a clear and concise answer.

TRANSCRIPT CONTEXT:
{context}

USER QUESTION:
{question}
"""

        response = self.client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You answer questions only from "
                        "the provided transcript context."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.2,
        )

        return response.choices[0].message.content