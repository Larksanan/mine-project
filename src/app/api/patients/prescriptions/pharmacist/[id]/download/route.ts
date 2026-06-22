// app/api/pharmacist/prescriptions/[id]/download/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { connectDB } from '@/lib/mongodb';
import Prescription from '@/models/Patientprescription';
import Pharmacy from '@/models/Pharmacy';
import { authOptions } from '@/lib/auth';

const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

async function getPharmacyForPharmacist(userId: string) {
  return Pharmacy.findOne({ 'pharmacists.userId': userId });
}

// GET - Pharmacist downloads the prescription attachment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'PHARMACIST') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const pharmacy = await getPharmacyForPharmacist(session.user.id);
    if (!pharmacy) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No pharmacy is linked to this account. Ask an admin to add you to a pharmacy.',
        },
        { status: 404 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Prescription ID is required' },
        { status: 400 }
      );
    }

    const prescription = await Prescription.findOne({
      _id: id,
      pharmaciesID: pharmacy._id,
      sentTopharmacies: true,
      isActive: true,
    }).lean();

    if (!prescription) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prescription not found or not sent to your pharmacy',
        },
        { status: 404 }
      );
    }

    const attachmentUrl = (prescription as any).attachmentUrl as
      | string
      | undefined;

    if (!attachmentUrl) {
      return NextResponse.json(
        { success: false, error: 'No attachment found for this prescription' },
        { status: 404 }
      );
    }

    // attachmentUrl is stored like '/uploads/prescriptions/rx_xxx.pdf'
    const filePath = join(process.cwd(), 'public', attachmentUrl);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'File not found on server' },
        { status: 404 }
      );
    }

    const fileBuffer = await readFile(filePath);
    const fileName = attachmentUrl.split('/').pop() || 'prescription-file';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('Error downloading prescription file:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to download prescription file',
      },
      { status: 500 }
    );
  }
}
