---
name: interactive-plan-review
description: "Handles iterative user review on implementation plans and dedicated Q&A mode. Enforces updating implementation plan first before code execution, and purely explaining when user starts prompt with 'hỏi:'."
---

# Interactive Plan Review & Q&A Workflow

## 1. Implementation Plan Review & Revision Gate
When the user comments, critiques, or asks for modifications on an implementation plan:
1. **Analyze User Feedback**: Identify which components, steps, or verification items need changes.
2. **Update \implementation_plan.md\**: Modify the artifact with the updated design, architecture, or task breakdowns.
3. **Present For Re-Review**: Set \RequestFeedback: true\ in \ArtifactMetadata\.
4. **Hard Gate**: STOP and do NOT write or execute any code until the user clicks **Proceed** or explicitly confirms approval.

## 2. "hỏi:..." Q&A and Explanation Mode
When the user's prompt starts with \hỏi:\, \Hỏi:\, \hoi:\, or \Hoi:\:
1. **Detect Intent**: The user is asking for explanations, architectural comparisons, technical reasoning, or answers to questions.
2. **Do Not Generate Code**: Do not create or modify code files, run mutating scripts, or begin development.
3. **Structured Explanation**:
   - Answer the core question directly in the first 1-2 sentences.
   - Break down the explanation with clear headings, bullet points, or trade-off comparisons.
   - Use diagrams (Mermaid) if helpful for visualization.
