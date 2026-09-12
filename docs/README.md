# Prism Documentation

Design and engineering documentation for **Prism**, the modular business
intelligence dashboard by Wohlf Solutions.

| Document | What it covers |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System shape, file layout, runtime model, planned build path |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Tokens, type scale, components, layout rules, accessibility |
| [DATA-MODEL.md](DATA-MODEL.md) | Entities, metric definitions, the tenant config contract |
| [MODULES.md](MODULES.md) | The add-on module system: contract, lifecycle, catalogue |
| [PAGES.md](PAGES.md) | Every screen in the product, its state, and what it must contain |
| [ROADMAP.md](ROADMAP.md) | What is built, what is not, phased plan to v1.0 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Hosting, tenant provisioning, release process |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Conventions, branch/PR rules, review checklist |

## Status at a glance

Prism is at **v0.1 — scaffold**. A single `index.html` renders the Overview
screen with placeholder data. No routing, no data layer, no authentication,
no persistence, no modules. See [ROADMAP.md](ROADMAP.md) for the gap
analysis and the plan that closes it.
