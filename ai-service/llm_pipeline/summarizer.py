"""
LLM summarization pipeline.

Supports:
- mock      : Fast deterministic summaries (no LLM needed – great for demos)
- ollama    : Uses a locally running Ollama server (e.g. ollama run mistral)
- llamacpp  : Direct llama.cpp Python bindings (requires llama-cpp-python)
"""

import os
import re
from typing import Any
import httpx


class Summarizer:
    def __init__(self):
        self.backend = os.getenv("LLM_BACKEND", "mock")
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "mistral")

    async def summarize(
        self,
        updates: list[dict[str, Any]],
        project: dict[str, Any],
        week_number: int,
    ) -> dict[str, Any]:
        """Route to the configured backend."""
        if self.backend == "ollama":
            return await self._ollama_summarize(updates, project, week_number)
        # llamacpp backend could be added here
        return self._mock_summarize(updates, project, week_number)

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
        moods = [u.get("mood", "good") for u in updates]
        mood_score = {"great": 4, "good": 3, "okay": 2, "struggling": 1}
        avg_mood = (
            sum(mood_score.get(m, 3) for m in moods) / len(moods) if moods else 3
        )

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

    # ------------------------------------------------------------------
    # Ollama backend
    # ------------------------------------------------------------------
    async def _ollama_summarize(
        self,
        updates: list[dict],
        project: dict,
        week_number: int,
    ) -> dict[str, Any]:
        prompt = self._build_prompt(updates, project, week_number)
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.ollama_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.3, "num_predict": 500},
                    },
                )
                response.raise_for_status()
                text = response.json().get("response", "").strip()
                risk_level, risk_factors, recommendations = self._assess_risk(
                    updates, project, week_number,
                    [b for u in updates for b in u.get("blockers", []) if not b.get("resolved")],
                    3,
                )
                return {
                    "summary": text,
                    "riskLevel": risk_level,
                    "riskFactors": risk_factors,
                    "recommendations": recommendations,
                    "model": self.ollama_model,
                }
        except Exception:
            # Fall back to rule-based on any error
            return self._mock_summarize(updates, project, week_number)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _build_prompt(self, updates: list[dict], project: dict, week_number: int) -> str:
        lines = [
            f"You are an academic project management assistant.",
            f"",
            f"Project: {project.get('title', 'Unknown')}",
            f"Week: {week_number}",
            f"",
            f"Below are the weekly progress updates from {len(updates)} team member(s):",
        ]
        for i, u in enumerate(updates, 1):
            name = u.get("student", {}).get("name", f"Student {i}") if isinstance(u.get("student"), dict) else f"Student {i}"
            lines.append(f"\n--- {name} ---")
            lines.append(f"Contribution: {u.get('individualContribution', '')}")
            completed = u.get("completedTasks", [])
            if completed:
                lines.append(f"Completed tasks: {', '.join(t.get('title','') for t in completed)}")
            blockers = [b for b in u.get("blockers", []) if not b.get("resolved")]
            if blockers:
                lines.append(f"Blockers: {'; '.join(b.get('description','') for b in blockers)}")
            lines.append(f"Hours worked: {u.get('hoursWorked', 0)}, Mood: {u.get('mood', 'good')}")

        lines += [
            "",
            "Write a concise (3-4 sentence) project status summary for the professor.",
            "Focus on: what was accomplished, any risks, and overall team health.",
            "Be objective and professional.",
        ]
        return "\n".join(lines)

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
