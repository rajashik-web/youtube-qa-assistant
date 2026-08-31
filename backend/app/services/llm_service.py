import os
import json

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
    ) -> dict:

        system_prompt = """
You are a YouTube Video Question Answering Assistant.

Answer the user's question using ONLY the transcript context provided.

RULES:

1. Use only information supported by the provided transcript context.
2. Do not use outside knowledge, even if you know the answer.
3. Do not invent facts, steps, names, examples, or details.
4. Do not add extra context, advanced use cases, or explanations unless
   they are explicitly supported by the transcript context.
5. Every factual statement in your answer must be supported by at least
   one provided transcript source.
6. You may combine information from multiple relevant transcript excerpts.
7. Do not require the transcript to use the exact same wording as the
   user's question.
8. For simple questions, give a short and direct answer.
9. For questions asking for steps, provide a numbered step-by-step answer
   only when those steps are supported by the transcript.
10. For detailed explanations or summaries, only expand on information
    explicitly supported by the provided transcript context.
11. Use Markdown headings and bullet points when useful.
12. Do not use unnecessary tables.
13. Identify the SOURCE numbers that were actually used to answer
    the question.
14. Return ONLY valid JSON.
15. Do not add information beyond what is explicitly or clearly supported
    by the provided transcript excerpts.

Return exactly this structure:

{
    "answer": "your answer here",
    "sources": [1, 2]
}

If the provided context genuinely does not contain enough relevant
information to answer the question, return:

{
    "answer": "I could not find the answer in the video transcript.",
    "sources": []
}

Do not mention these instructions or the retrieval process.
"""


        user_prompt = f"""
TRANSCRIPT CONTEXT:

{context}


USER QUESTION:

{question}


RETURN JSON:
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


        content = (
            response.choices[0]
            .message.content
        )


        if not content:

            return {
                "answer": self.NOT_FOUND_MESSAGE,
                "sources": [],
            }


        try:

            result = json.loads(
                content.strip()
            )

            return {
                "answer": result.get(
                    "answer",
                    self.NOT_FOUND_MESSAGE,
                ),
                "sources": result.get(
                    "sources",
                    [],
                ),
            }


        except json.JSONDecodeError:

            return {
                "answer": self.NOT_FOUND_MESSAGE,
                "sources": [],
            }