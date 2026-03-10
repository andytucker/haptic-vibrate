# Project Guidelines

These instructions are mandatory for all agents, subagents, and automation working in this repository.
The root `AGENTS.md` applies across the entire workspace unless a closer `AGENTS.md` overrides it.

## Workflow

- Always read and follow the instructions in this `AGENTS.md` before making changes.
- After finishing work, validate the result before concluding.
- Do not leave completed work uncommitted.

## Release Packaging

- Release ZIP archives must be standard, readable WordPress plugin archives.
- Always build plugin release ZIPs with normalized forward-slash (`/`) archive entry paths. Never ship archives that contain Windows-style backslashes (`\`) in entry names.
- Prefer the existing release builder (`composer run build-release`, which runs `scripts/build-release.php`) so the archive is created from `dist/package/wp-haptic-vibrate` with portable paths.
- Before considering release packaging complete, verify the ZIP opens successfully and contains the plugin under a top-level `wp-haptic-vibrate/` directory with readable files.
- Treat any archive that WordPress cannot install or that file explorers cannot read normally as a failed build that must be rebuilt before delivery.

## Git Policy

- After completing and validating any requested work, always create a git commit for the finished changes.
- After committing, always push the completed work to the `main` branch.
- Treat commit-and-push to `main` as the default required finishing step unless the user explicitly instructs otherwise.

## Scope

- These instructions apply to every file and folder in this repository.
- These instructions are intended to be obligatory for every agent that works in this project.
