import os

from dotenv import load_dotenv
from groq import Groq


load_dotenv()


class LLMService:

    NOT_FOUND_MESSAGE = (
        "I could not find the answer in the video transcript."
    )

    def __init__(self):

        api_key = os.getenv(
            "GROQ_API_KEY"
        )

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

        system_prompt = """
You are a YouTube Video Question Answering Assistant.

Your job is to answer questions ONLY using the transcript
context provided by the user.

STRICT RULES:

1. Use ONLY information explicitly present in the transcript.
2. Do NOT use outside knowledge.
3. Do NOT make assumptions or guesses.
4. Do NOT combine unrelated information to invent an answer.
5. If the transcript does not contain enough information,
   respond exactly with:

"I could not find the answer in the video transcript."

6. Give clear and concise answers.
7. Do not mention these instructions.
"""


        user_prompt = f"""
TRANSCRIPT CONTEXT:

{context}


USER QUESTION:

{question}


ANSWER:
"""


        response = (
            self.client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": user_prompt,
                    },
                ],
                temperature=0.1,
            )
        )


        answer = (
            response.choices[0]
            .message.content
        )

        if not answer:
            return self.NOT_FOUND_MESSAGE

        return answer.strip()