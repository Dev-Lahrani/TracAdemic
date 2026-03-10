"""
ProjectPulse AI Service
Summarizes weekly project updates using Ollama (local LLM) by default,
with a rule-based fallback when Ollama is unavailable.

Run:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Environment variables:
    LLM_BACKEND    : "ollama" | "mock"  (default: "ollama")
    OLLAMA_URL     : URL of the Ollama API           (default: http://localhost:11434)
    OLLAMA_MODEL   : Ollama model name               (default: mistral)
"""

import logging
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from llm_pipeline.summarizer import Summarizer

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("projectpulse.ai")

app = FastAPI(
    title="ProjectPulse AI Service",
    description="Ollama-powered summarization pipeline for academic projects",
    version="2.0.0",
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


class ContributionRequest(BaseModel):
    updates: list[dict[str, Any]]
    project: dict[str, Any]
    weekNumber: int


class ContributionResponse(BaseModel):
    analysis: str
    members: list[str]
    balanced: bool
    model: str


@app.get("/health")
async def health():
    ollama_status = await summarizer.check_ollama_health()
    return {
        "status": "ok",
        "service": "ProjectPulse AI",
        "backend": summarizer.backend,
        "ollama": ollama_status,
    }


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


@app.post("/analyze-contributions", response_model=ContributionResponse)
async def analyze_contributions(request: ContributionRequest):
    if not request.updates:
        raise HTTPException(status_code=400, detail="No updates provided")

    result = await summarizer.analyze_contributions(
        updates=request.updates,
        project=request.project,
        week_number=request.weekNumber,
    )
    return result
