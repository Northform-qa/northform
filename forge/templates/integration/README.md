# forge/templates/integration

Base Docker Compose environment templates for integration testing. Stack-agnostic and portable — clients can run these locally without any Northform tooling.

## Contents (planned)

- `docker-compose.yml` — base service definitions
- `docker-compose.override.example.yml` — local override pattern
- `wait-for-services.sh` — health check helper for CI
- `.env.example` — environment variable template

## Usage

Copy into `clients/client-[slug]/integration/` and add client-specific services (databases, APIs, third-party stubs).
