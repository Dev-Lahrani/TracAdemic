"""
Unit tests for the AI summarizer.
Run with: python -m pytest test_summarizer.py -v
"""

import asyncio
import os
import pytest
from unittest.mock import patch, AsyncMock
from llm_pipeline.summarizer import Summarizer


@pytest.fixture
def mock_summarizer():
    """Summarizer explicitly configured to use the mock backend."""
    with patch.dict(os.environ, {"LLM_BACKEND": "mock"}):
        return Summarizer()


@pytest.fixture
def ollama_summarizer():
    """Summarizer configured to use ollama (default)."""
    with patch.dict(os.environ, {"LLM_BACKEND": "ollama"}):
        return Summarizer()


@pytest.fixture
def sample_project():
    return {
        "title": "AI Research Project",
        "startDate": "2026-01-01",
        "endDate": "2026-04-30",
        "milestones": [
            {"title": "Literature Review", "dueDate": "2026-02-01", "completed": True},
            {"title": "Implementation", "dueDate": "2026-03-15", "completed": False},
        ],
    }


@pytest.fixture
def sample_updates():
    return [
        {
            "student": {"name": "Alice"},
            "weekNumber": 3,
            "completedTasks": [{"title": "Implement data pipeline"}, {"title": "Write unit tests"}],
            "blockers": [],
            "individualContribution": "Built the data ingestion module and wrote 15 unit tests.",
            "hoursWorked": 20,
            "contributionPercentage": 40,
            "mood": "good",
        },
        {
            "student": {"name": "Bob"},
            "weekNumber": 3,
            "completedTasks": [{"title": "Design UI mockups"}],
            "blockers": [{"description": "Cannot access the API", "severity": "high", "resolved": False}],
            "individualContribution": "Designed wireframes for the dashboard. Blocked on API access.",
            "hoursWorked": 12,
            "contributionPercentage": 25,
            "mood": "okay",
        },
        {
            "student": {"name": "Carol"},
            "weekNumber": 3,
            "completedTasks": [{"title": "Write documentation"}],
            "blockers": [],
            "individualContribution": "Updated the project README and wrote technical docs.",
            "hoursWorked": 10,
            "contributionPercentage": 35,
            "mood": "great",
        },
    ]


class TestMockSummarizer:
    def test_generates_summary(self, mock_summarizer, sample_updates, sample_project):
        result = mock_summarizer._mock_summarize(sample_updates, sample_project, 3)
        assert "summary" in result
        assert len(result["summary"]) > 50
        assert "Week 3" in result["summary"] or "week 3" in result["summary"].lower()

    def test_mentions_update_count(self, mock_summarizer, sample_updates, sample_project):
        result = mock_summarizer._mock_summarize(sample_updates, sample_project, 3)
        assert "3" in result["summary"]

    def test_risk_level_returned(self, mock_summarizer, sample_updates, sample_project):
        result = mock_summarizer._mock_summarize(sample_updates, sample_project, 3)
        assert result["riskLevel"] in {"low", "medium", "high", "critical"}

    def test_risk_factors_list(self, mock_summarizer, sample_updates, sample_project):
        result = mock_summarizer._mock_summarize(sample_updates, sample_project, 3)
        assert isinstance(result["riskFactors"], list)
        assert len(result["riskFactors"]) > 0

    def test_recommendations_list(self, mock_summarizer, sample_updates, sample_project):
        result = mock_summarizer._mock_summarize(sample_updates, sample_project, 3)
        assert isinstance(result["recommendations"], list)
        assert len(result["recommendations"]) > 0

    def test_high_risk_with_many_blockers(self, mock_summarizer, sample_project):
        updates_with_blockers = [
            {
                "student": {"name": f"Student {i}"},
                "completedTasks": [],
                "blockers": [
                    {"description": f"Blocker {j}", "severity": "high", "resolved": False}
                    for j in range(3)
                ],
                "individualContribution": "Struggled this week.",
                "hoursWorked": 5,
                "mood": "struggling",
            }
            for i in range(3)
        ]
        result = mock_summarizer._mock_summarize(updates_with_blockers, sample_project, 3)
        assert result["riskLevel"] in {"high", "critical"}

    def test_low_risk_with_no_blockers(self, mock_summarizer, sample_project):
        clean_updates = [
            {
                "student": {"name": "Alice"},
                "completedTasks": [{"title": "Task 1"}, {"title": "Task 2"}],
                "blockers": [],
                "individualContribution": "Everything going great.",
                "hoursWorked": 20,
                "mood": "great",
            }
        ]
        result = mock_summarizer._mock_summarize(clean_updates, sample_project, 1)
        assert result["riskLevel"] in {"low", "medium"}

    def test_empty_updates(self, mock_summarizer, sample_project):
        result = mock_summarizer._mock_summarize([], sample_project, 3)
        assert "summary" in result
        assert result["riskLevel"] in {"medium", "high", "critical"}

    def test_model_field_present(self, mock_summarizer, sample_updates, sample_project):
        result = mock_summarizer._mock_summarize(sample_updates, sample_project, 3)
        assert "model" in result
        assert isinstance(result["model"], str)


class TestContributionAnalysis:
    def test_mock_contribution_analysis(self, mock_summarizer, sample_updates, sample_project):
        result = mock_summarizer._mock_contribution_analysis(sample_updates, sample_project, 3)
        assert "analysis" in result
        assert "members" in result
        assert "balanced" in result
        assert isinstance(result["balanced"], bool)
        assert result["model"] == "rule-based-v1"

    def test_contribution_members_listed(self, mock_summarizer, sample_updates, sample_project):
        result = mock_summarizer._mock_contribution_analysis(sample_updates, sample_project, 3)
        assert len(result["members"]) == 3
        assert any("Alice" in m for m in result["members"])
        assert any("Bob" in m for m in result["members"])
        assert any("Carol" in m for m in result["members"])

    def test_imbalanced_contributions_detected(self, mock_summarizer, sample_project):
        updates = [
            {
                "student": {"name": "Alice"},
                "completedTasks": [{"title": "Task 1"}],
                "blockers": [],
                "individualContribution": "Did most of the work.",
                "hoursWorked": 30,
                "contributionPercentage": 80,
                "mood": "good",
            },
            {
                "student": {"name": "Bob"},
                "completedTasks": [],
                "blockers": [],
                "individualContribution": "Not much.",
                "hoursWorked": 2,
                "contributionPercentage": 5,
                "mood": "okay",
            },
        ]
        result = mock_summarizer._mock_contribution_analysis(updates, sample_project, 3)
        assert result["balanced"] is False
        assert "Bob" in result["analysis"]


class TestDefaultBackend:
    def test_default_backend_is_ollama(self):
        """Default backend should be ollama."""
        with patch.dict(os.environ, {}, clear=True):
            s = Summarizer()
            assert s.backend == "ollama"

    def test_explicit_mock_backend(self):
        with patch.dict(os.environ, {"LLM_BACKEND": "mock"}):
            s = Summarizer()
            assert s.backend == "mock"

    def test_explicit_ollama_backend(self):
        with patch.dict(os.environ, {"LLM_BACKEND": "ollama"}):
            s = Summarizer()
            assert s.backend == "ollama"


class TestAsyncSummarizer:
    def test_summarize_dispatches_to_mock(self, mock_summarizer, sample_updates, sample_project):
        """Summarize() should use mock when backend is explicitly set to 'mock'."""
        assert mock_summarizer.backend == "mock"
        result = asyncio.run(mock_summarizer.summarize(sample_updates, sample_project, 3))
        assert "summary" in result

    def test_summarize_ollama_falls_back(self, ollama_summarizer, sample_updates, sample_project):
        """When Ollama is unreachable, summarize() should fall back to rule-based."""
        assert ollama_summarizer.backend == "ollama"
        result = asyncio.run(ollama_summarizer.summarize(sample_updates, sample_project, 3))
        assert "summary" in result
        assert result["model"] == "rule-based-v1"

    def test_prompt_builder(self, mock_summarizer, sample_updates, sample_project):
        prompt = mock_summarizer._build_prompt(sample_updates, sample_project, 3)
        assert "AI Research Project" in prompt
        assert "Week" in prompt
        assert "Alice" in prompt

    def test_prompt_uses_template(self, mock_summarizer, sample_updates, sample_project):
        """Prompt should be generated from the WEEKLY_SUMMARY_PROMPT template."""
        prompt = mock_summarizer._build_prompt(sample_updates, sample_project, 3)
        assert "academic project management assistant" in prompt
        assert "Summary:" in prompt


class TestHelpers:
    def test_calc_avg_mood_normal(self):
        updates = [{"mood": "great"}, {"mood": "good"}, {"mood": "okay"}]
        assert Summarizer._calc_avg_mood(updates) == 3.0

    def test_calc_avg_mood_empty(self):
        assert Summarizer._calc_avg_mood([]) == 3

    def test_calc_avg_mood_all_struggling(self):
        updates = [{"mood": "struggling"}, {"mood": "struggling"}]
        assert Summarizer._calc_avg_mood(updates) == 1.0

    def test_format_updates_text(self):
        updates = [
            {
                "student": {"name": "Alice"},
                "individualContribution": "Did great work.",
                "completedTasks": [{"title": "Task A"}],
                "blockers": [],
                "hoursWorked": 10,
                "mood": "good",
            }
        ]
        text = Summarizer._format_updates_text(updates)
        assert "Alice" in text
        assert "Task A" in text
        assert "10" in text

    def test_format_contributions_text(self):
        updates = [
            {
                "student": {"name": "Alice"},
                "contributionPercentage": 60,
                "hoursWorked": 20,
                "completedTasks": [{"title": "T1"}, {"title": "T2"}],
            }
        ]
        text = Summarizer._format_contributions_text(updates)
        assert "Alice" in text
        assert "60%" in text
        assert "2 task(s)" in text
