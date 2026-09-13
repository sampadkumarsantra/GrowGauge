/**
 * One-off, idempotent migration: consolidate the legacy `Facilitator` table into
 * the new unified `User` table (PRD: Authentication & Accounts §2, §5).
 *
 * Behaviour:
 *  - Every Facilitator row is given a matching `User` with role `facilitator`.
 *  - The Facilitator row's `userAccountId` is linked to that User.
 *  - If a `User` already exists for the facilitator's email (or the generated
 *    placeholder), it is reused and linked instead of duplicated.
 *  - Legacy rows keep their `accessToken`, so every existing dashboard link
 *    keeps working exactly as before — this script never touches tokens.
 *
 * The legacy `Facilitator` table and all `FPOSubmission.facilitatorId`
 * references are left intact for backward compatibility.
 *
 * Usage:
 *   npx tsx scripts/migrate-facilitators.ts            # dry run
 *   npx tsx scripts/migrate-facilitators.ts --apply    # write to the database
 *
 * Always run this against a copy of the production database first.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

const domain = 'facilitators.growgauge.in';

function placeholderEmail(id: string): string {
  return `facilitator-${id}@${domain}`;
}

async function main() {
  const facilitators = await prisma.facilitator.findMany({
    orderBy: { createdAt: 'asc' },
  });

  console.log(
    `Found ${facilitators.length} facilitator record(s). Mode: ${apply ? 'APPLY' : 'DRY RUN'}\n`
  );

  let newlyLinked = 0;
  let alreadyLinked = 0;
  let reusedExistingUser = 0;
  let duplicatesSkipped = 0;

  const usedUsers = new Set<string>();

  for (const fac of facilitators) {
    if (fac.userAccountId) {
      console.log(`  ✔ ${fac.name}: already linked (userId=${fac.userAccountId})`);
      alreadyLinked += 1;
      usedUsers.add(fac.userAccountId);
      continue;
    }

    const email = (fac.email || '').trim().toLowerCase() || placeholderEmail(fac.id);

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (usedUsers.has(user.id)) {
        console.log(
          `  ⚠ ${fac.name}: another facilitator is already linked to user ${user.email}; skipping (legacy token still works).`
        );
        duplicatesSkipped += 1;
        continue;
      }
      console.log(`  · ${fac.name}: reusing existing user ${email}`);
      reusedExistingUser += 1;
    } else {
      user = await prisma.user.create({
        data: {
          email,
          role: 'facilitator',
          name: fac.name,
          organization: fac.organization,
          emailVerified: false,
          passwordHash: null,
        },
      });
      console.log(`  + ${fac.name}: created user ${email}`);
    }

    if (!apply) {
      usedUsers.add(user.id);
      newlyLinked += 1;
      continue;
    }

    await prisma.facilitator.update({
      where: { id: fac.id },
      data: { userAccountId: user.id, email },
    });

    if (user.role !== 'facilitator') {
      await prisma.user.update({ where: { id: user.id }, data: { role: 'facilitator' } });
    }

    usedUsers.add(user.id);
    newlyLinked += 1;
  }

  console.log(`\nSummary:`);
  console.log(`  created/linked user accounts : ${newlyLinked}`);
  console.log(`  already linked               : ${alreadyLinked}`);
  console.log(`  reused existing users        : ${reusedExistingUser}`);
  console.log(`  duplicate emails skipped     : ${duplicatesSkipped}`);
  console.log(`  legacy access tokens         : untouched (all dashboard links keep working)`);

  if (!apply) {
    console.log(`\nRe-run with --apply to write these changes.`);
  } else {
    console.log(`\nDone. Newly-created facilitator users have no password set; they must sign in with Google` +
      ` or request a password reset before they can use the matching email.`);
  }
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });