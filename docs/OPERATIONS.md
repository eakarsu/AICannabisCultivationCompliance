# Regulated cultivation lifecycle

`/api/cultivation-lifecycle` provides tenant/facility-scoped plant-lot identity, constrained stage transitions, lab chain-of-custody release, inventory/waste reconciliation, approved transfers, dual-witness destruction, recall state, append-only events, and idempotent integration jobs. Provider queues never report a regulatory submission as complete until a credentialed worker records success.

Startup is non-destructive. Bootstrap, SQL migration, and guarded non-production demo seeding are separate commands. METRC/BioTrack enrollment, state-specific rule interpretation, calibrated sensor ingestion, accredited labs, POS reconciliation, licensed inventory, and regulator acceptance remain external gates. This software does not itself confer compliance.
