"""
Chat endpoint – Mistral LLM powered grievance assistant.
Provides navigation help, grievance-status guidance, and friendly
off-topic deflection.
"""

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/chat", tags=["Chat"])

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_MODEL = "mistral-small-latest"

# ── System prompt ────────────────────────────────────────────────
SYSTEM_PROMPT = """\
You are **GrievanceAI Assistant**, a friendly and helpful chatbot embedded in the \
AI-Powered Public Grievance Redressal portal (CPGRAMS-style).

### What you can help with
- Explain how the portal works (filing, tracking, resolution process).
- Guide users to the correct page:
  • **Lodge a Grievance** → /lodge-grievance
  • **Track Complaint Status** → /track-status
  • **Citizen Dashboard** → /dashboard
  • **Help / FAQ** → /help
  • **Admin Panel** (for officials) → /admin
- Answer questions about grievance categories, departments, timelines, \
  priority levels, and AI classification.
- Guide users on how to check their complaint status using their registration number.

### Navigation rules
When you suggest a page, always include the path in this exact markdown format \
so the frontend can render it as a clickable link:
  [Page Name](/path)
For example: "You can file a new grievance on the [Lodge Grievance](/lodge-grievance) page."

### Off-topic / unnecessary questions
If the user asks something unrelated to the grievance portal (e.g. jokes, weather, \
personal opinions, coding help, general knowledge), respond politely and briefly:
"I appreciate your curiosity! 😊 However, I'm specifically designed to help you \
with public grievance matters on this portal. Is there anything related to \
filing, tracking, or resolving a grievance I can assist you with?"

### Tone
- Warm, professional, and concise.
- Use emojis sparingly (1-2 per message max).
- Keep answers short (2-4 sentences) unless the user asks for detail.
- Always end with a helpful follow-up question or suggestion.
"""


# ── Request / Response models ───────────────────────────────────
class ChatMessageIn(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessageIn]


class ChatResponse(BaseModel):
    reply: str
    quick_replies: list[str] = []


# ── Quick-reply generator ───────────────────────────────────────
def _generate_quick_replies(assistant_reply: str) -> list[str]:
    """Return contextual quick-reply suggestions based on the response."""
    reply_lower = assistant_reply.lower()

    # Check what the reply is about and suggest relevant follow-ups
    if "lodge" in reply_lower or "file" in reply_lower or "grievance" in reply_lower:
        return [
            "How do I track my complaint?",
            "What categories are available?",
            "What evidence can I upload?",
        ]
    if "track" in reply_lower or "status" in reply_lower:
        return [
            "How do I file a grievance?",
            "What do the statuses mean?",
            "How long does resolution take?",
        ]
    if "dashboard" in reply_lower:
        return [
            "How do I track a specific complaint?",
            "How do I file a new grievance?",
            "What departments handle complaints?",
        ]
    if "department" in reply_lower or "categor" in reply_lower:
        return [
            "How do I file a grievance?",
            "How does AI classification work?",
            "Track my complaint",
        ]
    # Default suggestions
    return [
        "How do I file a grievance?",
        "Track my complaint",
        "What departments are available?",
        "Contact support",
    ]


# ── Endpoint ────────────────────────────────────────────────────
@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest):
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        print("CRITICAL ERROR: Chatbot attempted to run but MISTRAL_API_KEY is null!")
        raise HTTPException(status_code=500, detail="Mistral API key not configured on server")

    # Build messages with system prompt
    api_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in req.messages:
        api_messages.append({"role": msg.role, "content": msg.content})

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                MISTRAL_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": MISTRAL_MODEL,
                    "messages": api_messages,
                    "temperature": 0.7,
                    "max_tokens": 512,
                },
            )

        if resp.status_code != 200:
            error_detail = resp.text[:200]
            raise HTTPException(
                status_code=502,
                detail=f"Mistral API error ({resp.status_code}): {error_detail}",
            )

        data = resp.json()
        reply = data["choices"][0]["message"]["content"]
        quick_replies = _generate_quick_replies(reply)

        return ChatResponse(reply=reply, quick_replies=quick_replies)

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI service timed out. Please try again.")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Could not reach AI service: {str(e)}")
