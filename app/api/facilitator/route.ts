import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Facilitator records are now consolidated into User accounts. Creating a
    // dashboard the legacy way still works, and a logged-in user gets the
    // record linked to their account so the same data is available on /dashboard
    // and via session auth.
    const session = await getAuthSession();
    const currentUserId = session?.user.id ?? null;

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const organization = typeof body.organization === 'string' ? body.organization.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'Facilitator name is required' }, { status: 400 });
    }
    if (!organization) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    const accessToken = crypto.randomBytes(24).toString('hex');

    const facilitator = await prisma.facilitator.create({
      data: {
        name,
        organization,
        accessToken,
        userAccountId: currentUserId,
        email: session?.user.email ?? null,
      },
    });

    if (currentUserId && session?.user.role === 'fpo_rep') {
      await prisma.user.update({
        where: { id: currentUserId },
        data: { role: 'facilitator' },
      });
    }

    return NextResponse.json(
      {
        id: facilitator.id,
        name: facilitator.name,
        organization: facilitator.organization,
        accessToken: facilitator.accessToken,
        message:
          'Facilitator created. Share your dashboard link and invite others using the assessment invite link.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating facilitator:', error);
    return NextResponse.json({ error: 'Internal server error while creating facilitator' }, { status: 500 });
  }
}