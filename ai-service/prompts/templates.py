"""
Prompt templates for the ProjectPulse AI pipeline.
"""

WEEKLY_SUMMARY_PROMPT = """You are an academic project management assistant.

Project: {project_title}
Week: {week_number}

Below are the weekly progress updates from {n_students} team member(s):

{updates_text}

Write a concise (3-4 sentence) project status summary for the professor.
Focus on: what was accomplished, any risks, and overall team health.
Be objective and professional.

Summary:"""

RISK_ANALYSIS_PROMPT = """You are an academic project risk analyst.

Project: {project_title}
Week: {week_number} of {total_weeks}
Updates received: {update_count} / {total_students}
Active blockers: {blocker_count}
Team mood: {mood_summary}

Based on the above, identify the top risk factors for this project.
List at most 3 concise risk factors (one per line), then suggest one recommendation.

Risk Factors:"""

CONTRIBUTION_ANALYSIS_PROMPT = """You are analyzing student contributions to a group project.

Project: {project_title}
Week: {week_number}

Contributions reported:
{contributions}

Summarize whether the workload appears balanced and if any student seems under- or over-contributing.
Keep your analysis to 2-3 sentences.

Analysis:"""
