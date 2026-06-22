/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import Pharmacy from '@/models/Pharmacy';
import { authOptions } from '@/lib/auth';

// GET - List pharmacies (lightweight, for dropdowns/selection UI)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: any = {};
    if (status && status !== 'ALL') {
      query.status = status;
    } else {
      // Default to active pharmacies only, unless explicitly asked for all
      query.status = 'ACTIVE';
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const pharmacies = await Pharmacy.find(query)
      .select(
        'name address contact status is24Hours deliveryAvailable deliveryFee'
      )
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: pharmacies,
    });
  } catch (error: any) {
    console.error('Error fetching pharmacies:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch pharmacies' },
      { status: 500 }
    );
  }
}
