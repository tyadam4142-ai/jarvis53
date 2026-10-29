# JARVIS 53 — Competitor Research (researched 2026-10, sources cited)

Method: official repositories, docs and changelogs were reviewed; facts below are restricted to
what those sources state. Judgement calls are marked **[recommendation]**. No proprietary code,
branding, or interface designs were copied.

## 1. OpenJarvis — https://github.com/open-jarvis/OpenJarvis · https://open-jarvis.github.io/OpenJarvis/
- **What it is:** Stanford SAIL / Hazy Research open-source "personal AI on personal devices"
  (Apache-2.0, ~12k stars). Local-first: models run on your hardware (Ollama/llama.cpp engines);
  `jarvis init` auto-detects hardware, `jarvis doctor` verifies setup.
- **Architecture:** five primitives for personal AI (agents, tools, memory, learning, routing);
  FastAPI server extras; a Tauri desktop shell (`desktop/src-tauri`) ships Windows ARM64 builds;
  config-driven engine/tool selection; agent orchestrators (native ReAct, deep-research,
  mini-SWE-agent…) with a `loop_guard`.
- **Desktop/OS support:** macOS, Linux, Windows (Tauri installer with MSVC/Python prerequisite checks).
- **Tool/file/code execution:** python tool registry + sandboxed runners; heavy focus on memory
  and evaluation.
- **Strengths:** local privacy, hardware-aware routing, strong research grounding.
- **Weaknesses for J53:** requires Python/uv toolchain on customer machines; local-model quality
  depends on customer hardware; no commercial licensing/subscription layer.
- **Adopted for J53:** `doctor`-style diagnostics concept (already partially present), bounded
  agent loop with guard, Tauri/Electron decision framework, "memory that persists" emphasis.
- **Not adopted:** local-model-first routing (J53's customers use hosted keys; policy stays
  "cloud AI, explicit config only").

## 2. Claude Code — https://docs.anthropic.com/en/docs/claude-code
- **What it is:** terminal-first coding agent; explores repos, edits multiple files, runs commands
  and tests, iterates on failures.
- **Workflow:** plan → edit → verify loop; permission modes (default ask / plan mode / accept-edits /
  bypass with guardrails); allow/deny permission rules (`Bash(npm test:*)` style prefix rules);
  sandboxed bash (macOS Seatbelt / Linux bubbles); CLAUDE.md project instructions; hooks.
- **Desktop/OS:** macOS, Linux, Windows; VS Code/JetBrains extensions; web+desktop companions.
- **Strengths:** the recovery loop — it reads real command output and fixes errors within a task
  budget; permission-rule model is simple and auditable.
- **Weaknesses for J53:** developer tool, not a consumer desktop assistant; no OS automation suite;
  subscription-priced cloud model only.
- **Adopted for J53:** the confirm/allow model (risk tiers map to permission modes), bounded
  iterate-until-green loop, reading REAL tool output before the next step (BUG-001/002 fix),
  "never trust the model's claim — trust the exit code".

## 3. Open Interpreter — https://www.openinterpreter.com/ · docs/desktop/install
- **What it is:** open-source interpreter that lets LLMs run Python/JS/Shell locally with per-run
  approval; "New Computer Update" added `interpreter --os` (OS-control mode with vision) and the
  LMC message protocol; a desktop app distribution exists.
- **Architecture:** `interpreter.computer.run("python", code)` — language runners decoupled from
  the agent core; streaming responses; LiteLLM for model backends; local model support.
- **Strengths:** real code execution with human approval; multi-language runners; OS-mode computer
  control.
- **Weaknesses for J53:** Python-centric (customer machines need Python); approval UX is
  terminal-grade, not consumer-grade; no licensing/access-control layer.
- **Adopted for J53:** `dev.run_command` approval-gated executor with timeout/output caps; the
  "prepare, show, approve, run, report" pattern; separate runner module so execution is testable.

## 4. OpenAI Codex (current product) — https://github.com/openai/codex · https://developers.openai.com/codex
- **What it is:** Rust CLI + cloud/desktop coding agent. Local sandboxing (macOS Seatbelt,
  Linux namespaces) with approval modes: untrusted → on-failure → on-request → full access;
  config via `config.toml` (`prefix_rule` decisions: prompt/allowed/forbidden); AGENTS.md
  instructions; task history/parallel work in cloud; IDE extension.
- **Strengths:** approval-policy matrix is precise; sandbox-first design; task resumption.
- **Weaknesses for J53:** OpenAI-model-centric; CLI UX; no consumer OS automation.
- **Adopted for J53:** explicit, user-facing approval modes instead of ad-hoc confirms; pinned
  working directory for command execution; resumable task state (already partially present via
  chat history persistence).

## 5. Others scanned
- **OpenHands (all-hands-ai)** — agent server + sandboxed docker runtime, event stream
  architecture. Adopted idea: persist an event/history log per task (J53 keeps chat + usage logs;
  a dedicated task log is roadmap R-4). https://github.com/All-Hands-AI/OpenHands
- **Cline** — VS Code agent, "human-in-the-loop" diffs for every file change, checkpoints/rollback.
  Adopted idea: show diffs / result cards per file op; undo path for edits (files.edit returns
  before/after; Drive keeps history). https://github.com/cline/cline
- **Cursor** — commercial AI IDE; multi-file edits, background agents. Not adoptable (closed
  source, IDE-scale). Taught: file-change review UX matters more than chat polish.
  https://cursor.com
- **Raycast** — launcher-grade UX: global shortcut → floating command surface; extensions; AI
  commands. Adopted idea: global shortcut + compact summon window (Electron overlay mode) instead
  of forcing the full app forward. https://www.raycast.com

## 6. Comparison matrix

| Capability | OpenJarvis | Claude Code | Open Interpreter | Codex | Raycast | **J53 v2.9.0 target** |
|---|---|---|---|---|---|---|
| Native desktop app | Tauri | CLI + desktop | Desktop app | CLI/IDE | Native | **Electron shell** |
| Background task survives window hide | yes | n/a | partial | yes (cloud) | yes | **yes (server child proc + tray)** |
| Global summon shortcut | no | no | no | no | **yes** | **yes (configurable)** |
| Real file create/edit on disk | yes | **yes** | yes | **yes** | ext | **yes (files.*, drive.*)** |
| Runs commands w/ approval | sandboxed | **yes, rules** | **yes** | **yes, modes** | ext | **yes (dev.run_command, confirm gate)** |
| Tool-result feedback loop | **yes** | **yes** | **yes** | **yes** | n/a | **fixed in v2.9.0** |
| Multi-provider model routing | engines | no (Claude) | LiteLLM | no (OpenAI) | partial | **yes (OpenRouter/NVIDIA/Gemini pool)** |
| Licensing / manual approvals | no | no | no | no | no | **yes (manual payment verification)** |
| Local-model capable | **yes** | no | **yes** | no | no | roadmap R-3 |

## 7. Prioritised adoption plan (what v2.9.0 implements)

1. **P0 — desktop process ownership** (Electron; server as supervised child; tray; close-to-tray).
2. **P0 — agent loop with real tool outcomes** (Claude Code/Codex pattern, bounded turns).
3. **P0 — command execution + project inspection + file edit tools** behind the existing risk gate.
4. **P1 — global summon shortcut + notifications** (Raycast pattern).
5. **P1 — UPI-free manual payment workflow** (product requirement; no competitor equivalent).
6. **P2 (roadmap)** — task event log per job, diff-view for edits, local-model engine, overlay
   quick-command window.

Sources: the URLs above (official repos/docs), OpenJarvis paper citation (Saad-Falcon et al.,
2026, Scaling Intelligence blog), Codex CLI `config.toml` documentation in-repo, Claude Code
permissions/sandboxing docs, Open Interpreter changelog ("The New Computer Update").
