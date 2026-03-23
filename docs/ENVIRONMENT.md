# Environment Contract

Project: Онлайн-калькулятор графиков функций 2D/3D
Project mode: `product`
Default execution strategy: `host`

## Why this file exists

This project must be reproducible across multiple Symphony issue workspaces and
multiple future agents.

Issue workspaces are disposable. Reusable environment decisions, heavy
downloads, toolchains, datasets, and build outputs must not live only inside a
single `HEL-*` workspace.

## Decision rule

- Default to `docker` for research/native-build tasks when any of these are
  true:
  - the task compiles native code or depends on `apt`/system packages
  - the build or test run is expensive enough that repeated host bootstrap
    would waste time or tokens
  - the result must be reproducible across future agents or hosts
- Use `host` only when:
  - the stack is lightweight and already stable on the host
  - the host bootstrap can be captured in a small repo-local script
  - containerizing the task adds more complexity than reproducibility value
- The decision must be recorded before repeated retries begin.

## Current contract

- Strategy: `host`
- Status: `draft until the first environment issue resolves`
- Shared cache root: `~/srv/research-cache/2d-3d`
- Stable subdirectories:
  - downloads: `~/srv/research-cache/2d-3d/downloads`
  - datasets: `~/srv/research-cache/2d-3d/datasets`
  - toolchains: `~/srv/research-cache/2d-3d/toolchains`
  - builds: `~/srv/research-cache/2d-3d/builds`
  - artifacts: `~/srv/research-cache/2d-3d/artifacts`
  - logs: `~/srv/research-cache/2d-3d/logs`
  - docker state/volumes: `~/srv/research-cache/2d-3d/docker`

## Reuse rules

- Never leave the only copy of a useful baseline inside a disposable issue
  workspace.
- Commit repo-local wrappers, manifests, patches, lockfiles, and runbooks.
- If using `docker`, commit the Dockerfile and repo-local entry script; mount
  the shared cache root into the container.
- If using `host`, commit `scripts/bootstrap_host_deps.sh` (or equivalent)
  before allowing repeated build retries.
- Every follow-up issue must say which environment baseline or cache paths it
  expects to reuse.
