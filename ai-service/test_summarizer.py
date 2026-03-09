"""
Unit tests for the AI summarizer.
Run with: python -m pytest test_summarizer.py -v
"""

import asyncio
import pytest
from llm_pipeline.summarizer import Summarizer


@pytest.fixture
def summarizer():
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
    def test_generates_summary(self, summarizer, sample_updates, sample_project):
        result = summarizer._mock_summarize(sample_updates, sample_project, 3)
        assert "summary" in result
        assert len(result["summary"]) > 50
        assert "Week 3" in result["summary"] or "week 3" in result["summary"].lower()

    def test_mentions_update_count(self, summarizer, sample_updates, sample_project):
        result = summarizer._mock_summarize(sample_updates, sample_project, 3)
        assert "3" in result["summary"]

    def test_risk_level_returned(self, summarizer, sample_updates, sample_project):
        result = summarizer._mock_summarize(sample_updates, sample_project, 3)
        assert result["riskLevel"] in {"low", "medium", "high", "critical"}

    def test_risk_factors_list(self, summarizer, sample_updates, sample_project):
        result = summarizer._mock_summarize(sample_updates, sample_project, 3)
        assert isinstance(result["riskFactors"], list)
        assert len(result["riskFactors"]) > 0

    def test_recommendations_list(self, summarizer, sample_updates, sample_project):
        result = summarizer._mock_summarize(sample_updates, sample_project, 3)
        assert isinstance(result["recommendations"], list)
        assert len(result["recommendations"]) > 0

    def test_high_risk_with_many_blockers(self, summarizer, sample_project):
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
        result = summarizer._mock_summarize(updates_with_blockers, sample_project, 3)
        assert result["riskLevel"] in {"high", "critical"}

    def test_low_risk_with_no_blockers(self, summarizer, sample_project):
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
        result = summarizer._mock_summarize(clean_updates, sample_project, 1)
        assert result["riskLevel"] in {"low", "medium"}

    def test_empty_updates(self, summarizer, sample_project):
        result = summarizer._mock_summarize([], sample_project, 3)
        assert "summary" in result
        assert result["riskLevel"] in {"medium", "high", "critical"}

    def test_model_field_present(self, summarizer, sample_updates, sample_project):
        result = summarizer._mock_summarize(sample_updates, sample_project, 3)
        assert "model" in result
        assert isinstance(result["model"], str)


class TestAsyncSummarizer:
    def test_summarize_dispatches_to_mock(self, summarizer, sample_updates, sample_project):
        """Summarize() should default to mock when backend is 'mock'."""
        assert summarizer.backend == "mock"
        result = asyncio.run(summarizer.summarize(sample_updates, sample_project, 3))
        assert "summary" in result

    def test_prompt_builder(self, summarizer, sample_updates, sample_project):
        prompt = summarizer._build_prompt(sample_updates, sample_project, 3)
        assert "AI Research Project" in prompt
        assert "Week" in prompt
        assert "Alice" in prompt
