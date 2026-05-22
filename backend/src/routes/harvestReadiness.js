import express from 'express';

const router = express.Router();

router.post('/score', (req, res) => {
  const body = req.body || {};
  const daysToTarget = Number(body.days_to_target || 0);
  const coaPass = body.coa_status === 'pass';
  const openTasks = Number(body.open_compliance_tasks || 0);
  const quarantine = Boolean(body.quarantine_hold);
  const moisture = Number(body.moisture_pct || 12);
  const score = Math.max(0, Math.min(100,
    75 + (coaPass ? 15 : -20) - openTasks * 8 - (quarantine ? 35 : 0) - Math.abs(moisture - 12) * 3 - Math.max(0, daysToTarget) * 0.5
  ));
  res.json({
    batch_id: body.batch_id || 'batch',
    readiness_score: Math.round(score),
    readiness_band: score >= 80 ? 'ready' : score >= 55 ? 'conditional' : 'hold',
    blockers: [
      !coaPass ? 'COA is not passed.' : null,
      openTasks > 0 ? `${openTasks} compliance task(s) still open.` : null,
      quarantine ? 'Batch is on quarantine hold.' : null,
      Math.abs(moisture - 12) > 2 ? 'Moisture is outside release preference.' : null,
    ].filter(Boolean),
    actions: score >= 80 ? ['Prepare METRC transfer package.', 'Schedule final package label review.'] : ['Resolve blockers before harvest release.', 'Re-score after QA update.'],
    generated_at: new Date().toISOString(),
  });
});

export default router;
