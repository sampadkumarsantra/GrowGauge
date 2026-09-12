async function testE2E() {
  console.log('Testing GrowGauge API Endpoints...');

  // 1. Test POST /api/fpo
  const profile3 = {
    fpoName: 'Sample FPO E2E',
    state: 'Jharkhand',
    district: 'Ranchi',
    registrationType: 'Producer Company',
    activeMembers: 150,
    members2YrAgo: 120,
    revenueYear1: 4200000,
    revenueYear2: 3800000,
    revenueYear3: 3500000,
    costYear1: 3100000,
    costYear2: 2900000,
    costYear3: 2700000,
    products: [
      { name: 'Paddy', revenueSharePct: 70 },
      { name: 'Vegetables', revenueSharePct: 30 }
    ],
    activeBuyersCount: 4,
    contractSalesPct: 40,
    estimatedPriceRealizationPct: 55,
    auditedAccounts: true,
    agmCountLastYear: 1,
    boardMeetingsLastYear: 5
  };

  const createRes = await fetch('http://localhost:3000/api/fpo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile3)
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`POST /api/fpo failed: ${createRes.status} ${errText}`);
  }

  const created = await createRes.json();
  console.log('✔ POST /api/fpo succeeded:', {
    id: created.id,
    overallScore: created.overallScore,
    band: created.band,
    factors: created.factorScores
  });

  const { id, accessToken } = created;

  // 2. Test GET /api/fpo/:id with token
  const getRes = await fetch(`http://localhost:3000/api/fpo/${id}?token=${accessToken}`);
  if (!getRes.ok) throw new Error(`GET /api/fpo/${id} failed: ${getRes.status}`);
  const fetched = await getRes.json();
  console.log('✔ GET /api/fpo/:id succeeded:', fetched.fpoName, fetched.scoreResult.band);

  // 3. Test Unauthorized GET without token
  const unauthRes = await fetch(`http://localhost:3000/api/fpo/${id}`);
  if (unauthRes.status !== 401) throw new Error(`Expected 401 without token, got ${unauthRes.status}`);
  console.log('✔ Access token security check passed (401 without token)');

  // 4. Test POST /api/score/simulate
  const simRes = await fetch('http://localhost:3000/api/score/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...profile3, activeMembers: 350, activeBuyersCount: 10 })
  });
  if (!simRes.ok) throw new Error(`POST /api/score/simulate failed: ${simRes.status}`);
  const simData = await simRes.json();
  console.log('✔ POST /api/score/simulate succeeded (Simulated score:', simData.overallScore, simData.band, ')');

  // 5. Test PDF Report Generation GET /api/fpo/:id/report?token=...
  const pdfRes = await fetch(`http://localhost:3000/api/fpo/${id}/report?token=${accessToken}`);
  if (!pdfRes.ok) throw new Error(`PDF report endpoint failed: ${pdfRes.status}`);
  const pdfContentType = pdfRes.headers.get('content-type');
  const pdfBuffer = await pdfRes.arrayBuffer();
  console.log('✔ GET /api/fpo/:id/report succeeded. Content-Type:', pdfContentType, 'Bytes:', pdfBuffer.byteLength);

  console.log('\nALL API E2E TESTS PASSED SUCCESSFULLY! 🎉');
}

testE2E().catch(err => {
  console.error('E2E Test Error:', err);
  process.exit(1);
});
