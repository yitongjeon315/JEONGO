@AGENTS.md

## Vibe Diagnosis — MCP AI Self-Diagnostics Rules
- MANDATORY: Run `run_diagnostics` at the end of every development task to verify zero regression.
- Create or update corresponding `.diag.js` files in `.vibe-diagnosis/diagnostics/` before/during coding (TDD approach).
- If diagnostics fail, trigger `repair_diagnostic` or `heal_all` for automated self-healing.
