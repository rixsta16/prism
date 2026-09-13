# Deployment

## Today

GitHub Pages, served from the root of `main` in `rixsta16/prism`.

- Live: https://rixsta16.github.io/prism
- Push to `main` publishes. There is no build, no staging and no rollback
  beyond reverting a commit.

## Local development

No toolchain. Any static server works:

```sh
python3 -m http.server 8000
# or
npx serve .
```

Open http://localhost:8000. `file://` does not work: the app is built from ES
modules, which require an origin.

## Tenant provisioning (target)

```mermaid
flowchart LR
    tpl["Prism template repo<br/>rixsta16/prism"] --> clone["create client repo<br/>from template"]
    clone --> cfg["copy prism.config.example.js<br/>→ prism.config.js"]
    cfg --> fill["fill tenant · locale<br/>branding · dataSource · modules"]
    fill --> deploy["deploy static folder"]
    deploy --> dns["point client subdomain"]
    dns --> live(["live tenant"])

    tag["upstream tag<br/>v0.2 · v0.3 · …"] --> deploy
    drift{{"hand-edited tenant<br/>cannot take updates"}} -.risk.-> deploy
```


Each client gets their own deployment of the same code. The only per-tenant
artefact is `prism.config.js`.

```
1. Create the client repo or hosting target from the Prism template
2. Copy prism.config.example.js → prism.config.js
3. Fill in tenant, locale, branding, dataSource, modules
4. Deploy the static folder
5. Point the client subdomain at it
```

This repo commits a `prism.config.js` holding the demo tenant, because the
public GitHub Pages demo has to boot. A client deployment replaces that file
wholesale; `prism.config.example.js` is the template to copy. Neither contains
a secret by design — any credential lives with the host, never in the bundle,
so a committed config leaks nothing.

Phase 6 turns this into one script. Until then it is a documented manual
sequence, and the risk to watch is drift: a tenant deployment that has been
hand-edited can no longer take an upstream update.

## Hosting requirements

| Requirement | Why |
| --- | --- |
| Static file serving | That is all Prism is |
| HTTPS | Non-negotiable once real data is loaded |
| No rewrite rules needed | Hash routing is chosen precisely to avoid this |
| No external requests | Chart.js is vendored; the page loads nothing third-party |

### Chart.js is vendored

Chart.js 4.5.0 lives in `assets/vendor/chart.umd.js` and is served from the
same origin. It used to load from `cdn.jsdelivr.net`, which meant a CDN outage
blanked both charts and put a third-party script tag on a page showing client
financials. Keep the pin exact when upgrading, and re-vendor rather than
reaching back out to a CDN.

## Release process (target)

- `main` is deployable at all times.
- Feature work happens on branches and merges by pull request.
- Tag releases `v0.2`, `v0.3`, … matching the phases in ROADMAP.md.
- Each tag gets release notes naming what a tenant will visibly notice.
- Tenant deployments pull a tag, never `main`.

## Rollback

Today: revert the commit and push. There is no other mechanism.

Once tenants track tags, rollback is repointing a deployment at the previous
tag — which is the main argument for tagging at all.

## Monitoring

None exists. Minimum viable set before v1.0:

- Uptime check on each tenant URL.
- Client-side error reporting — a boot failure currently produces a blank page
  with a console error nobody reads.
- Sync failure alerting once adapters are live: a dashboard that silently shows
  stale data is worse than one that shows an error.
