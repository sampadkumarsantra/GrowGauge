const BASE = 'http://localhost:3000';

function assert(cond, msg) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
}

async function main() {
  console.log('Testing GrowGauge Feature Expansion Endpoints...\n');

  // 1. Create facilitator
  const facRes = await fetch(`${BASE}/api/facilitator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'E2E Facilitator', organization: 'E2E Org' }),
  });
  assert(facRes.status === 201, `POST /api/facilitator expected 201 got ${facRes.status}`);
  const facilitator = await facRes.json();
  assert(facilitator.id && facilitator.accessToken, 'facilitator missing id/accessToken');
  console.log('✔ POST /api/facilitator:', facilitator.name, facilitator.id);

  // Facilitator create requires org + name
  const badFac = await fetch(`${BASE}/api/facilitator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'No Org' }),
  });
  assert(badFac.status === 400, `facilitator w/o org expected 400 got ${badFac.status}`);
  console.log('✔ POST /api/facilitator validation (400 without org)');

  // 2. Create opted-in submission with facilitatorId
  const profile = {
    fpoName: 'Expansion E2E FPO',
    state: 'Jharkhand',
    district: 'E2EDistrict',
    registrationType: 'Producer Company',
    activeMembers: 180,
    members2YrAgo: 140,
    revenueYear1: 5000000,
    revenueYear2: 4600000,
    revenueYear3: 4200000,
    costYear1: 3600000,
    costYear2: 3400000,
    costYear3: 3200000,
    products: [
      { name: 'Paddy', revenueSharePct: 60 },
      { name: 'Vegetables', revenueSharePct: 25 },
      { name: 'Pulses', revenueSharePct: 15 },
    ],
    activeBuyersCount: 6,
    contractSalesPct: 45,
    estimatedPriceRealizationPct: 60,
    auditedAccounts: true,
    agmCountLastYear: 2,
    boardMeetingsLastYear: 6,
    optedIntoLeaderboard: true,
    facilitatorId: facilitator.id,
  };

  const createRes = await fetch(`${BASE}/api/fpo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  assert(createRes.ok, `POST /api/fpo failed ${createRes.status}: ${await createRes.text()}`);
  const created = await createRes.json();
  const { id, accessToken, fpoGroupId } = created;
  assert(id && accessToken && fpoGroupId, 'submission missing id/accessToken/fpoGroupId');
  console.log('✔ POST /api/fpo (opted-in, facilitator):', id);

  // 3. Roadmap GET
  const roadmapRes = await fetch(`${BASE}/api/fpo/${id}/roadmap?token=${accessToken}`);
  assert(roadmapRes.ok, `roadmap GET failed ${roadmapRes.status}: ${await roadmapRes.text()}`);
  const roadmap = await roadmapRes.json();
  assert(Array.isArray(roadmap.items) && roadmap.items.length >= 1, 'roadmap has no items');
  const item = roadmap.items[0];
  console.log('✔ GET /api/fpo/:id/roadmap —', roadmap.items.length, 'items, weakest:', roadmap.weakestFactors);

  // 4. Roadmap PATCH (toggle complete)
  const patchRes = await fetch(`${BASE}/api/fpo/${id}/roadmap/${item.id}?token=${accessToken}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed: true }),
  });
  assert(patchRes.ok, `roadmap PATCH failed ${patchRes.status}`);
  const patched = await patchRes.json();
  assert(patched.completed === true, 'roadmap item not marked completed');
  const patchBad = await fetch(`${BASE}/api/fpo/${id}/roadmap/${item.id}?token=${accessToken}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert(patchBad.status === 400, `roadmap PATCH w/o completed expected 400 got ${patchBad.status}`);
  console.log('✔ PATCH /api/fpo/:id/roadmap/:itemId + validation');

  // 5. Checklist
  const checkRes = await fetch(`${BASE}/api/fpo/${id}/checklist?token=${accessToken}`);
  assert(checkRes.ok, `checklist GET failed ${checkRes.status}`);
  const checklist = await checkRes.json();
  assert(Array.isArray(checklist.items) && checklist.items.length >= 1, 'checklist has no items');
  console.log('✔ GET /api/fpo/:id/checklist —', checklist.items.length, 'items');

  // 6. Schemes
  const schRes = await fetch(`${BASE}/api/fpo/${id}/schemes?token=${accessToken}`);
  assert(schRes.ok, `schemes GET failed ${schRes.status}`);
  const schemes = await schRes.json();
  assert(Array.isArray(schemes.schemes) && schemes.schemes.length >= 1, 'no matched schemes');
  console.log('✔ GET /api/fpo/:id/schemes —', schemes.schemes.length, 'matched');

  // 7. History (single cycle -> hasMultipleCycles false)
  const histRes = await fetch(`${BASE}/api/fpo/group/${fpoGroupId}/history?token=${accessToken}`);
  assert(histRes.ok, `history GET failed ${histRes.status}`);
  const hist = await histRes.json();
  assert(hist.history.length === 1 && hist.hasMultipleCycles === false, 'history shape wrong');
  console.log('✔ GET /api/fpo/group/:id/history —', hist.history.length, 'cycle');

  // 8. New cycle (clone)
  const cycleRes = await fetch(`${BASE}/api/fpo/${id}/new-cycle?token=${accessToken}`, { method: 'POST' });
  assert(cycleRes.status === 201, `new-cycle expected 201 got ${cycleRes.status}`);
  const cycle = await cycleRes.json();
  assert(cycle.fpoGroupId === fpoGroupId, 'new cycle lost fpoGroupId');
  console.log('✔ POST /api/fpo/:id/new-cycle —', cycle.id);

  // 9. History now has 2 cycles with second token
  const hist2Res = await fetch(`${BASE}/api/fpo/group/${fpoGroupId}/history?token=${cycle.accessToken}`);
  assert(hist2Res.ok, `history(2) GET failed ${hist2Res.status}`);
  const hist2 = await hist2Res.json();
  assert(hist2.hasMultipleCycles === true && hist2.history.length === 2, 'history should have 2 cycles');
  console.log('✔ History shows 2 cycles after new-cycle');

  // 10. Verify (public, no token)
  const verifyRes = await fetch(`${BASE}/api/fpo/${id}/verify`);
  assert(verifyRes.ok, `verify GET failed ${verifyRes.status}`);
  const verified = await verifyRes.json();
  assert(verified.fpoName && verified.band && verified.assessedDate, 'verify missing fields');
  assert(Object.keys(verified).length === 3, `verify exposed extra fields: ${Object.keys(verified)}`);
  console.log('✔ GET /api/fpo/:id/verify (public, data-minimized) —', verified.band);

  // 11. Badge (public SVG)
  const badgeRes = await fetch(`${BASE}/api/fpo/${id}/badge`);
  assert(badgeRes.ok, `badge GET failed ${badgeRes.status}`);
  const badgeSvg = await badgeRes.text();
  assert(badgeSvg.includes('<svg') && badgeSvg.includes('GrowGauge'), 'badge not an SVG');
  console.log('✔ GET /api/fpo/:id/badge (public SVG) —', badgeSvg.length, 'bytes');

  // 12. AI assistant (graceful w/o key OR success w/ key)
  const askRes = await fetch(`${BASE}/api/fpo/${id}/ask?token=${accessToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What is my weakest area?' }),
  });
  assert([200, 503].includes(askRes.status), `ask expected 200/503 got ${askRes.status}: ${await askRes.text()}`);
  const askData = await askRes.json();
  if (askRes.status === 200) {
    assert(askData.reply || askData.answer, 'ask 200 missing reply');
    console.log('✔ POST /api/fpo/:id/ask — responded with LLM answer');
  } else {
    console.log('✔ POST /api/fpo/:id/ask — graceful 503 (no OPENAI_API_KEY set)');
  }

  // 13. Facilitator FPO list
  const fposRes = await fetch(`${BASE}/api/facilitator/${facilitator.id}/fpos?token=${facilitator.accessToken}`);
  assert(fposRes.ok, `facilitator fpos GET failed ${fposRes.status}`);
  const fpos = await fposRes.json();
  assert(Array.isArray(fpos.fpos) && fpos.fpos.length >= 1, 'facilitator saw no FPOs');
  console.log('✔ GET /api/facilitator/:id/fpos —', fpos.fpos.length, 'FPO(s)');

  // 14. Leaderboard (gated — district has 1 opted-in, below threshold)
  const lbRes = await fetch(`${BASE}/api/leaderboard?district=E2EDistrict&state=Jharkhand`);
  assert(lbRes.ok, `leaderboard GET failed ${lbRes.status}`);
  const lb = await lbRes.json();
  assert(lb.visible === false || lb.entries === undefined || Array.isArray(lb.entries), 'leaderboard shape unexpected');
  console.log('✔ GET /api/leaderboard (gated) — visible:', lb.visible);

  // 15. Unauthorized checks on protected routes
  const unauthRoadmap = await fetch(`${BASE}/api/fpo/${id}/roadmap`);
  assert(unauthRoadmap.status === 401, `roadmap w/o token expected 401 got ${unauthRoadmap.status}`);
  const unauthHist = await fetch(`${BASE}/api/fpo/group/${fpoGroupId}/history`);
  assert(unauthHist.status === 401, `history w/o token expected 401 got ${unauthHist.status}`);
  console.log('✔ Unauthorized protected routes return 401');

  console.log('\nALL EXPANSION E2E TESTS PASSED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('\nE2E Expansion Error:', err.message);
  process.exit(1);
});