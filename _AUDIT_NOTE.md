# Audit Apply Note — AICannabisCultivationCompliance

Source: `_AUDIT/reports/batch_01.md` § 13.

## Audit findings vs. reality
The audit reported "0 AI endpoints" but `routes/aiNew.js` exposes 8 AI endpoints:
- `/regulatory-tracker`, `/harvest-timing-optimizer`, `/energy-optimizer`, `/pest-detection`, `/seed-supplier-audit`, `/license-renewal`, `/microbial-analyzer`, `/supply-chain-audit`

So the "Missing AI Layer" claim is incorrect. The other gaps (notifications, reporting, integrations) remain valid.

## Implemented in this pass (MECHANICAL)

| # | Item | File | Endpoints |
|---|------|------|-----------|
| 1 | Webhook subscription stub | `backend/src/routes/webhooks.js` (new, ESM) + `backend/src/server.js` | `GET/POST/DELETE /api/webhooks`, `POST /api/webhooks/:id/test`, `GET /api/webhooks/_/events` |

ESM module matching the project's `"type": "module"` convention. Allowed events: plant.harvested/pest_detected/lifecycle_stage_changed, lab_test.completed/failed, compliance.violation, environmental.alert, inventory.low, license.expiring, waste.recorded. Lazy table; payload-only test (no outbound HTTP). ESM `node --check` passes.

## Backlog (not implemented)

| Item | Tag | Why deferred |
|------|-----|---------------|
| Email/SMS/push notifications | NEEDS-CREDS | SMTP / Twilio / FCM |
| Reporting / export | TOO-RISKY | Templates + UI |
| Outbound webhook delivery | TOO-RISKY | Background job infra |
| State Track-and-Trace integrations (METRC, BioTrack) | NEEDS-CREDS | State regulator API contracts |
| Multi-agent orchestration | NEEDS-PRODUCT-DECISION | Agent topology |

## Apply pass 3 (frontend)

Verified — FE already wired. No changes.

- 8 AI pages registered under `/ai/*` in `App.jsx` (RegulatoryTracker, HarvestTimingOptimizer, EnergyOptimizer, PestDetection, SeedSupplierAudit, LicenseRenewal, MicrobialAnalyzer, SupplyChainAudit) + `Webhooks.jsx` at `/webhooks`.
- Sidebar exposes all of the above.
- JWT Bearer via shared `frontend/src/api.js` axios instance (`localStorage.getItem('token')`).
- AI errors surfaced through `react-toastify`; structured AI output rendered with `AIJsonRenderer`.
- Backend route file `routes/webhooks.js` is mounted in `backend/src/server.js`.

## Apply pass 4 (mechanical backlog)

No mechanical items remain. The backlog is composed of:
- Email/SMS/push notifications — NEEDS-CREDS (SMTP / Twilio / FCM).
- Reporting / export — TOO-RISKY (templates + UI).
- Outbound webhook delivery — TOO-RISKY (background job infra).
- METRC / BioTrack integrations — NEEDS-CREDS (state regulator API contracts).
- Multi-agent orchestration — NEEDS-PRODUCT-DECISION.

No code changes in this pass.
