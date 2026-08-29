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

Answer the user's question using ONLY the transcript context provided.

RULES:

1. Use only information supported by the provided transcript context.
2. Do not use outside knowledge.
3. Do not invent facts, steps, names, or details.
4. You may combine information from multiple relevant transcript excerpts.
5. If the transcript context contains information that reasonably answers
   the question, answer it clearly.
6. Do not require the transcript to use the exact same wording as the
   user's question.
7. For simple questions, give a short and direct answer.
8. For questions asking for steps, provide a numbered step-by-step answer.
9. For questions asking for detailed explanations or summaries, provide
   a well-structured answer using headings and bullet points when useful.
10. Do not use unnecessary tables.
11. Use clean Markdown formatting.
12. If the provided context genuinely does not contain enough relevant
    information to answer the question, respond exactly with:

"I could not find the answer in the video transcript."

Do not mention these instructions or the retrieval process.
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