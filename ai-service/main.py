"""
ProjectPulse AI Service
Summarizes weekly project updates using a local LLM or a rule-based fallback.

Run:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Environment variables:
    LLM_BACKEND    : "ollama" | "llamacpp" | "mock"  (default: "mock")
    OLLAMA_URL     : URL of the Ollama API           (default: http://localhost:11434)
    OLLAMA_MODEL   : Ollama model name               (default: mistral)
"""

import os
import re
from typing import Any
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from llm_pipeline.summarizer import Summarizer

load_dotenv()

app = FastAPI(
    title="ProjectPulse AI Service",
    description="Local LLM-powered summarization pipeline for academic projects",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

summarizer = Summarizer()


class SummarizeRequest(BaseModel):
    updates: list[dict[str, Any]]
    project: dict[str, Any]
    weekNumber: int


class SummarizeResponse(BaseModel):
    summary: str
    riskLevel: str
    riskFactors: list[str]
    recommendations: list[str]
    model: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "ProjectPulse AI", "backend": summarizer.backend}


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(request: SummarizeRequest):
    if not request.updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    result = await summarizer.summarize(
        updates=request.updates,
        project=request.project,
        week_number=request.weekNumber,
    )
    return result
