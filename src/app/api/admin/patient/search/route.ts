/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Patient, { IPatientModel } from '@/models/Patient';

function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Get all matching patients first (since static method returns Promise)
    const allPatients = await (
      Patient as unknown as IPatientModel
    ).searchPatients(query);

    // Apply limit manually
    const patients = allPatients.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: patients.map((patient: any) => ({
        id: patient._id.toString(),
        name: `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
        phone: patient.phone,
        nic: patient.nic,
        age: calculateAge(patient.dateOfBirth),
      })),
    });
  } catch (error: any) {
    console.error(' Error searching patients:', error);
    return NextResponse.json(
      { error: 'Failed to search patients', details: error.message },
      { status: 500 }
    );
  }
}
