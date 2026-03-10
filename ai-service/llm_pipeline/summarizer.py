"""
LLM summarization pipeline.

Supports:
- ollama    : Uses a locally running Ollama server (default – e.g. ollama run mistral)
- mock      : Fast deterministic summaries (no LLM needed – fallback / testing)
"""

import json
import logging
import os
import re
from typing import Any

import httpx

from prompts.templates import (
    CONTRIBUTION_ANALYSIS_PROMPT,
    RISK_ANALYSIS_PROMPT,
    WEEKLY_SUMMARY_PROMPT,
)

logger = logging.getLogger("projectpulse.ai")

# Number of retry attempts for Ollama calls
_MAX_RETRIES = 2
_RETRY_DELAY_SECS = 1.0


class Summarizer:
    def __init__(self):
        self.backend = os.getenv("LLM_BACKEND", "ollama")
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "mistral")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def summarize(
        self,
        updates: list[dict[str, Any]],
        project: dict[str, Any],
        week_number: int,
    ) -> dict[str, Any]:
        """Route to the configured backend."""
        if self.backend == "ollama":
            return await self._ollama_summarize(updates, project, week_number)
        return self._mock_summarize(updates, project, week_number)

    async def analyze_contributions(
        self,
        updates: list[dict[str, Any]],
        project: dict[str, Any],
        week_number: int,
    ) -> dict[str, Any]:
        """Analyze contribution balance using the configured backend."""
        if self.backend == "ollama":
            return await self._ollama_contribution_analysis(updates, project, week_number)
        return self._mock_contribution_analysis(updates, project, week_number)

    async def check_ollama_health(self) -> dict[str, Any]:
        """Check whether the Ollama server is reachable."""
        if self.backend != "ollama":
            return {"reachable": False, "reason": f"backend is '{self.backend}', not ollama"}
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(f"{self.ollama_url}/api/tags")
                resp.raise_for_status()
                models = [m.get("name", "") for m in resp.json().get("models", [])]
                return {"reachable": True, "models": models}
        except Exception as exc:
            return {"reachable": False, "reason": str(exc)}

    # ------------------------------------------------------------------
    # Mock (rule-based) summariser – always available, no LLM required
    # ------------------------------------------------------------------
    def _mock_summarize(
        self,
        updates: list[dict],
        project: dict,
        week_number: int,
    ) -> dict[str, Any]:
        n = len(updates)
        total_hours = sum(u.get("hoursWorked", 0) for u in updates)
        avg_hours = round(total_hours / n, 1) if n else 0
        completed_tasks = sum(len(u.get("completedTasks", [])) for u in updates)
        all_blockers = [
            b for u in updates for b in u.get("blockers", []) if not b.get("resolved")
        ]
        avg_mood = self._calc_avg_mood(updates)

        summary = (
            f"Week {week_number} summary for '{project.get('title', 'this project')}':\n"
            f"{n} team member(s) submitted updates this week, "
            f"collectively completing {completed_tasks} tasks "
            f"and averaging {avg_hours} hours of work per person. "
        )
        if all_blockers:
            summary += (
                f"The team reported {len(all_blockers)} active blocker(s) that may need attention. "
            )
        else:
            summary += "No active blockers were reported — the team is working smoothly. "

        if avg_mood >= 3.5:
            summary += "Team morale is high."
        elif avg_mood >= 2.5:
            summary += "Team morale is good."
        elif avg_mood >= 1.5:
            summary += "Some team members appear to be struggling; consider a check-in."
        else:
            summary += "Multiple team members are struggling; immediate intervention recommended."

        risk_level, risk_factors, recommendations = self._assess_risk(
            updates, project, week_number, all_blockers, avg_mood
        )

        return {
            "summary": summary,
            "riskLevel": risk_level,
            "riskFactors": risk_factors,
            "recommendations": recommendations,
            "model": "rule-based-v1",
        }

    def _mock_contribution_analysis(
        self,
        updates: list[dict],
        project: dict,
        week_number: int,
    ) -> dict[str, Any]:
        """Rule-based contribution balance analysis."""
        members: dict[str, dict] = {}
        for u in updates:
            student = u.get("student", {})
            name = student.get("name", "Unknown") if isinstance(student, dict) else "Unknown"
            sid = str(student.get("_id", name)) if isinstance(student, dict) else name
            if sid not in members:
                members[sid] = {"name": name, "hours": 0, "tasks": 0, "pct": []}
            members[sid]["hours"] += u.get("hoursWorked", 0)
            members[sid]["tasks"] += len(u.get("completedTasks", []))
            members[sid]["pct"].append(u.get("contributionPercentage", 0))

        analysis_parts = []
        for sid, m in members.items():
            avg_pct = sum(m["pct"]) / len(m["pct"]) if m["pct"] else 0
            analysis_parts.append(f"{m['name']}: {avg_pct:.0f}% avg contribution, {m['hours']}h total, {m['tasks']} tasks")

        overall_avg = sum(sum(m["pct"]) / len(m["pct"]) for m in members.values()) / len(members) if members else 0
        imbalanced = [m["name"] for m in members.values() if (sum(m["pct"]) / len(m["pct"]) if m["pct"] else 0) < overall_avg * 0.5]

        summary = f"Contribution analysis for {len(members)} member(s). "
        summary += f"Team average: {overall_avg:.1f}%. "
        if imbalanced:
            summary += f"{len(imbalanced)} member(s) contributing below half the average: {', '.join(imbalanced)}."
        else:
            summary += "Contributions appear balanced across the team."

        return {
            "analysis": summary,
            "members": analysis_parts,
            "balanced": len(imbalanced) == 0,
            "model": "rule-based-v1",
        }

    # ------------------------------------------------------------------
    # Ollama backend
    # ------------------------------------------------------------------
    async def _ollama_summarize(
        self,
        updates: list[dict],
        project: dict,
        week_number: int,
    ) -> dict[str, Any]:
        updates_text = self._format_updates_text(updates)
        prompt = WEEKLY_SUMMARY_PROMPT.format(
            project_title=project.get("title", "Unknown"),
            week_number=week_number,
            n_students=len(updates),
            updates_text=updates_text,
        )

        all_blockers = [
            b for u in updates for b in u.get("blockers", []) if not b.get("resolved")
        ]
        avg_mood = self._calc_avg_mood(updates)

        text = await self._call_ollama(prompt)
        if text is None:
            logger.warning("Ollama unreachable – falling back to rule-based summariser")
            return self._mock_summarize(updates, project, week_number)

        risk_level, risk_factors, recommendations = self._assess_risk(
            updates, project, week_number, all_blockers, avg_mood,
        )

        return {
            "summary": text,
            "riskLevel": risk_level,
            "riskFactors": risk_factors,
            "recommendations": recommendations,
            "model": self.ollama_model,
        }

    async def _ollama_contribution_analysis(
        self,
        updates: list[dict],
        project: dict,
        week_number: int,
    ) -> dict[str, Any]:
        contributions = self._format_contributions_text(updates)
        prompt = CONTRIBUTION_ANALYSIS_PROMPT.format(
            project_title=project.get("title", "Unknown"),
            week_number=week_number,
            contributions=contributions,
        )

        text = await self._call_ollama(prompt)
        if text is None:
            logger.warning("Ollama unreachable – falling back to rule-based contribution analysis")
            return self._mock_contribution_analysis(updates, project, week_number)

        mock_result = self._mock_contribution_analysis(updates, project, week_number)
        return {
            "analysis": text,
            "members": mock_result["members"],
            "balanced": mock_result["balanced"],
            "model": self.ollama_model,
        }

    async def _call_ollama(self, prompt: str, max_tokens: int = 500) -> str | None:
        """Call Ollama with retry logic. Returns None on failure."""
        import asyncio

        for attempt in range(_MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        f"{self.ollama_url}/api/generate",
                        json={
                            "model": self.ollama_model,
                            "prompt": prompt,
                            "stream": False,
                            "options": {"temperature": 0.3, "num_predict": max_tokens},
                        },
                    )
                    response.raise_for_status()
                    return response.json().get("response", "").strip()
            except Exception as exc:
                logger.warning(
                    "Ollama call failed (attempt %d/%d): %s",
                    attempt + 1,
                    _MAX_RETRIES + 1,
                    exc,
                )
                if attempt < _MAX_RETRIES:
                    await asyncio.sleep(_RETRY_DELAY_SECS * (attempt + 1))
        return None

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _calc_avg_mood(updates: list[dict]) -> float:
        """Calculate average mood score from updates."""
        mood_score = {"great": 4, "good": 3, "okay": 2, "struggling": 1}
        moods = [u.get("mood", "good") for u in updates]
        return (
            sum(mood_score.get(m, 3) for m in moods) / len(moods) if moods else 3
        )

    @staticmethod
    def _format_updates_text(updates: list[dict]) -> str:
        """Build human-readable text block for all student updates."""
        lines = []
        for i, u in enumerate(updates, 1):
            name = u.get("student", {}).get("name", f"Student {i}") if isinstance(u.get("student"), dict) else f"Student {i}"
            lines.append(f"--- {name} ---")
            lines.append(f"Contribution: {u.get('individualContribution', '')}")
            completed = u.get("completedTasks", [])
            if completed:
                lines.append(f"Completed tasks: {', '.join(t.get('title', '') for t in completed)}")
            blockers = [b for b in u.get("blockers", []) if not b.get("resolved")]
            if blockers:
                lines.append(f"Blockers: {'; '.join(b.get('description', '') for b in blockers)}")
            lines.append(f"Hours worked: {u.get('hoursWorked', 0)}, Mood: {u.get('mood', 'good')}")
            lines.append("")
        return "\n".join(lines)

    @staticmethod
    def _format_contributions_text(updates: list[dict]) -> str:
        """Build contribution text for the contribution analysis prompt."""
        lines = []
        for i, u in enumerate(updates, 1):
            name = u.get("student", {}).get("name", f"Student {i}") if isinstance(u.get("student"), dict) else f"Student {i}"
            pct = u.get("contributionPercentage", 0)
            hours = u.get("hoursWorked", 0)
            tasks = len(u.get("completedTasks", []))
            lines.append(f"- {name}: {pct}% contribution, {hours}h worked, {tasks} task(s) completed")
        return "\n".join(lines)

    def _build_prompt(self, updates: list[dict], project: dict, week_number: int) -> str:
        """Build prompt using templates (kept for backward compatibility)."""
        updates_text = self._format_updates_text(updates)
        return WEEKLY_SUMMARY_PROMPT.format(
            project_title=project.get("title", "Unknown"),
            week_number=week_number,
            n_students=len(updates),
            updates_text=updates_text,
        )

    def _assess_risk(
        self,
        updates: list[dict],
        project: dict,
        week_number: int,
        active_blockers: list[dict],
        avg_mood: float,
    ) -> tuple[str, list[str], list[str]]:
        from datetime import datetime, timezone

        risk_factors = []
        recommendations = []
        risk_score = 0

        if not updates:
            risk_factors.append("No updates submitted this week")
            risk_score += 3

        if len(active_blockers) >= 3:
            risk_factors.append(f"{len(active_blockers)} unresolved blockers")
            risk_score += 2
        elif active_blockers:
            risk_factors.append(f"{len(active_blockers)} active blocker(s)")
            risk_score += 1

        if avg_mood <= 1.5:
            risk_factors.append("Multiple team members are struggling")
            risk_score += 2
        elif avg_mood <= 2.5:
            risk_factors.append("Some team members feel challenged")
            risk_score += 1

        start = project.get("startDate", "")
        end = project.get("endDate", "")
        if start and end:
            try:
                start_dt = datetime.fromisoformat(str(start)[:10])
                end_dt = datetime.fromisoformat(str(end)[:10])
                total_days = (end_dt - start_dt).days
                elapsed = (datetime.now(timezone.utc).replace(tzinfo=None) - start_dt).days
                if total_days > 0 and elapsed / total_days > 0.75:
                    incomplete = [m for m in project.get("milestones", []) if not m.get("completed")]
                    if incomplete:
                        risk_factors.append(
                            f"{len(incomplete)} milestone(s) pending with >75% timeline elapsed"
                        )
                        risk_score += 2
            except (ValueError, TypeError):
                pass

        if risk_score >= 5:
            risk_level = "critical"
        elif risk_score >= 3:
            risk_level = "high"
        elif risk_score >= 1:
            risk_level = "medium"
        else:
            risk_level = "low"
            risk_factors.append("Project appears on track")

        if risk_score >= 3:
            recommendations.append("Schedule an immediate team check-in")
        if active_blockers:
            recommendations.append("Prioritise resolving active blockers")
        if avg_mood <= 2.5:
            recommendations.append("Reach out to team members who are struggling")
        if not recommendations:
            recommendations.append("Continue monitoring – team is on track")

        return risk_level, risk_factors, recommendations
