/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Patient from '@/models/Patient';
import Appointment from '@/models/Appointment';

export async function GET(request: NextRequest) {
  try {
    console.log('=== GET APPOINTMENTS API CALLED ===');

    await connectDB();

    // Get session
    const session = await getServerSession(authOptions);
    console.log('Session user ID:', session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    console.log('Query params:', { patientId, status, limit, page });

    // Validate patientId
    if (!patientId) {
      return NextResponse.json(
        { success: false, message: 'patientId is required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid patientId format' },
        { status: 400 }
      );
    }

    // Find the patient by ID
    const patientObjectId = new mongoose.Types.ObjectId(patientId);
    const patient = await Patient.findById(patientObjectId).lean();

    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }

    // Authorization check - verify the logged-in user owns this patient profile
    const userObjectId = new mongoose.Types.ObjectId(session.user.id);
    const isAuthorized =
      (patient.user && patient.user.toString() === userObjectId.toString()) ||
      (patient.user && patient.user.toString() === userObjectId.toString()) ||
      (patient.createdBy &&
        patient.createdBy.toString() === userObjectId.toString()) ||
      (patient.createdBy?._id &&
        patient.createdBy._id.toString() === userObjectId.toString());

    if (!isAuthorized && session.user.role !== 'ADMIN') {
      console.warn('Unauthorized access attempt:', {
        patientUserId: patient.user,
        patientCreatedBy: patient.createdBy,
        sessionUserId: userObjectId.toString(),
        userRole: session.user.role,
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized - You do not have access to this patient's data",
        },
        { status: 403 }
      );
    }

    // Build query
    const query: any = {
      patient: patientObjectId,
      isActive: true,
    };

    // Apply status filter
    if (status && status !== 'all') {
      query.status = status.toUpperCase();
      console.log('Status filter applied:', query.status);
    }

    const skip = (page - 1) * limit;
    console.log('Query:', JSON.stringify(query, null, 2));

    // Fetch appointments with proper population
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate({
          path: 'doctor',
          model: 'Doctor',
          select: 'user profile name email specialization department hospital',
          populate: {
            path: 'user',
            model: 'User',
            select: 'name email phone',
          },
        })
        .sort({ appointmentDate: -1, appointmentTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Appointment.countDocuments(query),
    ]);

    console.log(
      `Found ${appointments.length} appointments out of ${total} total`
    );

    // Format appointments
    const formattedAppointments = appointments.map((apt: any) => {
      // Extract doctor information
      let doctorInfo = null;
      if (apt.doctor) {
        if (apt.doctor.user) {
          doctorInfo = {
            _id: apt.doctor._id?.toString() || '',
            firstName: apt.doctor.user.name?.split(' ')[0] || '',
            lastName: apt.doctor.user.name?.split(' ')[1] || '',
            name: apt.doctor.user.name || '',
            email: apt.doctor.user.email || '',
            phone: apt.doctor.user.phone || '',
            specialization:
              apt.doctor.specialization ||
              apt.doctor.profile?.specialization ||
              '',
            department:
              apt.doctor.department || apt.doctor.profile?.department || '',
            hospital:
              apt.doctor.hospital ||
              apt.doctor.profile?.hospitalAffiliation ||
              '',
          };
        } else {
          doctorInfo = {
            _id: apt.doctor._id?.toString() || '',
            firstName: apt.doctor.name?.split(' ')[0] || '',
            lastName: apt.doctor.name?.split(' ')[1] || '',
            name: apt.doctor.name || '',
            email: apt.doctor.email || '',
            phone: apt.doctor.phone || '',
            specialization: apt.doctor.specialization || '',
            department: apt.doctor.department || '',
            hospital: apt.doctor.hospital || '',
          };
        }
      }

      return {
        _id: apt._id?.toString() || '',
        id: apt._id?.toString() || '',
        doctor: doctorInfo,
        doctorId: apt.doctor?._id?.toString() || '',
        appointmentDate: apt.appointmentDate
          ? new Date(apt.appointmentDate).toISOString().split('T')[0]
          : '',
        appointmentTime: apt.appointmentTime || '',
        duration: apt.duration || 30,
        type: apt.type || 'CONSULTATION',
        status: apt.status || 'SCHEDULED',
        reason: apt.reason || '',
        symptoms: apt.symptoms || '',
        diagnosis: apt.diagnosis || '',
        prescription: apt.prescription || '',
        notes: apt.notes || '',
        createdAt: apt.createdAt || null,
        updatedAt: apt.updatedAt || null,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: formattedAppointments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
          currentPage: page,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('=== ERROR IN GET /api/appointments/patient ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to fetch appointments',
        error:
          process.env.NODE_ENV === 'development'
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
