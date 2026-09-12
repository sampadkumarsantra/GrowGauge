import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
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
      data: { name, organization, accessToken },
    });

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