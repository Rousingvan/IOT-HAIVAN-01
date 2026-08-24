# Superpowers Core Methodology & User Interaction Rules (Global)

You MUST always follow these engineering and interaction rules across all projects and conversations.

## 1. Plan Review Iteration Gate (CRITICAL)
- **Review Before Coding**: Whenever the user provides feedback, critiques, or changes on an \implementation_plan.md\, you MUST modify and update the \implementation_plan.md\ artifact first.
- **Never Jump to Code**: Do NOT begin coding, editing project source files, or executing implementation steps until the user explicitly clicks "Proceed" or explicitly approves the revised plan.
- **Always Request Feedback**: Set \RequestFeedback: true\ in the artifact metadata so the user can review and approve.

## 2. "hỏi:..." Prompt Mode (Q&A / Explanation Mode)
- **Pure Explanation**: Whenever the user's prompt begins with \hỏi:\, \Hỏi:\, \hoi:\, or \Hoi:\, treat the request strictly as an inquiry/question.
- **No Implementation**: Provide clear, direct, and insightful explanations, analysis, and conceptual answers. Do NOT write code files or run modifying commands.

## 3. Core Superpowers Methodology
- **Brainstorm First**: Socratic method to explore intent and present options before implementation.
- **Test-Driven Development**: Strict Red-Green-Refactor cycle.
- **Systematic Debugging**: Minimal reproduction and root-cause tracing with tests.
- **Verification Before Completion**: Run and verify test commands before declaring tasks done.

## 4. Prompt Slash Command Mappings
| Prompt Command | Skill | Action |
| :--- | :--- | :--- |
| \/brainstorm\, \/brainstorming\ | \rainstorming\ | Refine requirements, present design in chat, await user approval before any coding. |
| \/write-plan\, \/plan\ | \writing-plans\ | Produce structured implementation plan with TDD checkpoints. |
| \/execute-plan\ | \executing-plans\ | Execute approved plan task by task with review gates. |
| \/tdd\, \/test-driven-development\ | \	est-driven-development\ | Execute Red -> Green -> Refactor cycle. |
| \/debug\, \/systematic-debugging\ | \systematic-debugging\ | Root cause investigation and minimal reproduction. |
| \/subagent-development\, \/subagents\ | \subagent-driven-development\ | Dispatch subagents with spec and review loops. |
| \/parallel-agents\ | \dispatching-parallel-agents\ | Run parallel workers on independent modules. |
| \/request-review\, \/code-review\ | \equesting-code-review\ | Conduct structured code review. |
| \/receive-review\ | \eceiving-code-review\ | Process code review feedback with verification. |
| \/verify\, \/verification\ | \erification-before-completion\ | Verify changes and test results before completion. |
| \/worktree\ | \using-git-worktrees\ | Manage isolated git worktree environment. |
| \/finish-branch\ | \inishing-a-development-branch\ | Clean up and merge branch changes. |
| \/write-skill\ | \writing-skills\ | Author new agentic skills following best practices. |
| \/superpowers\ | \using-superpowers\ | Execute full end-to-end superpowers process. |
