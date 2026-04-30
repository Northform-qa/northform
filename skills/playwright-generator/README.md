# skills/playwright-generator

Internal Claude Skill for generating Playwright tests. Used by Northform QA to author tests faster and more consistently. Clients do not access this skill.

## Output Standards

All generated tests must conform to:

- **Language:** TypeScript
- **Pattern:** Page Object Model (POM)
- **Selectors:** Accessible roles and labels (`getByRole`, `getByLabel`) over CSS/XPath
- **Structure:** `test.describe` grouping, `test.step` for logical sub-steps
- **Quality:** Production-ready — not scaffolding or pseudocode
- **Comments:** Where the *why* is non-obvious (selectors, workarounds, constraints)

## Skill Structure (planned)

```
playwright-generator/
├── prompt.md         System prompt and generation instructions
├── examples/         Reference test examples for few-shot context
└── README.md
```
