<!--
  Auto-generated starter Copilot instructions.
  The repository appears empty. This file contains a concise, actionable template
  to help AI coding agents get productive once the project's sources are added.
  Please replace placeholders (e.g. <ENTRY_FILE>, <BUILD_CMD>) with real values.
-->

# Copilot instructions — starter template

Purpose

- Help AI coding agents become productive quickly in this repository.

What I (the agent) should do first

- Look for these files in repository root: `package.json`, `pyproject.toml`, `setup.py`, `Pipfile`, `requirements.txt`, `Makefile`, `Dockerfile`, `README.md`, `.github/workflows/*`.
- If the repo is empty or missing, report that and ask the user to provide the source tree or point to the main package folder.

Big-picture architecture (how to discover it)

- Identify the runtime in order of precedence: `package.json` ⇒ Node/TypeScript/JS, `pyproject.toml`/`requirements.txt` ⇒ Python, `go.mod` ⇒ Go. Use that to select tooling.
- Search for `src/`, `lib/`, `app/`, `server/` to find entry-points. Typical entry files: `src/index.ts`, `src/main.py`, `cmd/*`.
- Look for services and boundaries by scanning for `Dockerfile`, `docker-compose.yml`, `k8s/` or `helm/` folders — these indicate multi-service deployment.

Developer workflows (replace placeholders after reading manifests)

- Build: use the project manifest. Examples:
  - Node: `npm ci && npm run build` (or `pnpm install && pnpm build`)
  - Python: `python -m venv .venv && .venv/bin/pip install -r requirements.txt && <build or run command>`
  - When present, prefer `Makefile` targets (e.g. `make build`, `make test`).
- Tests: look for `test/`, `spec/`, or `__tests__` and a test runner in `package.json` or `pyproject.toml`. Typical commands: `npm test`, `pytest`, `make test`.
- Debugging: find the main entry script and add small reproducible examples when creating or modifying behavior. Prefer unit tests over ad-hoc runs.

Project-specific conventions (what to look for and preserve)

- Branch/commit style: check `CONTRIBUTING.md` or `README.md` for rules. If missing, ask the user.
- Type usage: if `tsconfig.json` or `pyrightconfig.json` exists, follow the repository TypeScript/Python typing levels (strictness flags).
- Code generation: search for `scripts/`, `codegen/`, `openapi/`, `prisma/` — changes may require re-running codegen steps.

Integration points & external deps

- CI: inspect `.github/workflows/*.yml` for build/test steps and required secrets.
- Datastores / services: search for environment variables in `.env.example`, `docker-compose.yml` or config files to find DB, queue, or external API endpoints.
- Secrets: never attempt to access missing secrets; instead, note them and ask the user for safe test values or mocks.

Actionable rules for patches and PRs

- Keep changes minimal and focused. If you change a public API or contract, update relevant docs/tests.
- When adding dependencies, update the lockfile (`package-lock.json`, `poetry.lock`, `Pipfile.lock`) if present, and mention why the dep is needed.

How to give concrete examples in this repo (fill these in once code is present)

- Refer to actual files when describing patterns, e.g. `src/controllers/user.ts` or `app/main.py`.
- Replace `<ENTRY_FILE>` with the discovered runtime entry point and show exact commands.

When you cannot find something

- Ask a focused question: name the missing file or command and propose 2 reasonable defaults the user can confirm.

Contact / feedback

- After applying changes, run tests and linters (if present) and include the commands and results in your PR description.

-- End of starter template. Please provide the repository sources or confirm these placeholders and I will update this file with project-specific examples.
