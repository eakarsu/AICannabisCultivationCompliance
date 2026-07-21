import assert from'node:assert/strict';import test from'node:test';import{normalizeLot,validateTransition}from'../src/domain/cultivationLifecycle.js';
const sample={facilityId:'F1',batchId:'B1',tagId:'T1',jurisdiction:'CA',cultivar:'Example',startedAt:'2026-07-18T00:00:00Z'};
test('normalizes regulated lot identity',()=>assert.equal(normalizeLot(sample).tagId,'T1'));
test('blocks release without chain of custody',()=>assert.throws(()=>validateTransition('harvest_hold','tested',{role:'compliance'},{passed:true}),/chain of custody/));
test('blocks transfer without compliance role',()=>assert.throws(()=>validateTransition('packaged','transferred',{role:'operator'},{manifestId:'M',destinationLicense:'L',approvedBy:'A'}),/not authorized/));
test('requires dual witness destruction',()=>assert.throws(()=>validateTransition('tested','destroyed',{role:'compliance'},{wasteManifestId:'W',witnesses:['one']}),/two witnesses/));
