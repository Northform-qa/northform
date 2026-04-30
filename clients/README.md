# clients/

Per-client test workspaces. Each subdirectory is a self-contained engagement — isolated from other clients and structured for clean handoff.

## Directory Convention

```
clients/
└── client-[slug]/
    ├── playwright/           UI/E2E tests (Playwright + TypeScript, POM)
    ├── integration/          Integration test environments (Docker Compose)
    ├── .github/workflows/    Client-specific GitHub Actions
    └── README.md             Client context, stack notes, handoff instructions
```

## Principles

- One directory per client, named `client-[slug]`
- No shared dependencies between client directories
- Everything a client needs to run their tests must live in their directory
- Clients own their test code — handoff is a `cp` and a README away
