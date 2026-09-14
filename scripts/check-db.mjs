import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const f = await p.facilitator.count();
  const s = await p.fPOSubmission.count();
  console.log('facilitators:', f);
  console.log('submissions:', s);
  const facs = await p.facilitator.findMany({ take: 3 });
  console.log('sample fac:', JSON.stringify(facs));
  const subs = await p.fPOSubmission.findMany({ take: 3, select: { id: true, fpoName: true, facilitatorId: true, userId: true } });
  console.log('sample subs:', JSON.stringify(subs));
  await p.$disconnect();
})();
