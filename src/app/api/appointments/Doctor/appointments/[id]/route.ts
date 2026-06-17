/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

let Appointment: any;
let Doctor: any;

try {
  Appointment =
    mongoose.models.Appointment || require('@/models/Appointment').default;
  Doctor = mongoose.models.Doctor || require('@/models/Doctor').default;
} catch (error) {
  console.error('Error loading models:', error);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Changed: params is now a Promise
) {
  try {
    await connectDB();

    // Ensure models are loaded
    if (!Appointment) {
      Appointment = require('@/models/Appointment').default;
    }
    if (!Doctor) {
      Doctor = require('@/models/Doctor').default;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a doctor
    if (session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        { success: false, message: 'Access denied. Doctor role required.' },
        { status: 403 }
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    // Find the Doctor document for this user
    const doctorDoc = await Doctor.findOne({ user: userObjectId }).lean();

    if (!doctorDoc) {
      return NextResponse.json(
        { success: false, message: 'Doctor profile not found' },
        { status: 404 }
      );
    }

    const doctorId = doctorDoc._id;

    // FIX: Await params before accessing properties
    const { id: appointmentId } = await params;

    // Verify the appointment belongs to this doctor
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: doctorId,
      isActive: true,
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found or access denied' },
        { status: 404 }
      );
    }

    // Get update data from request body
    const body = await request.json();
    const { status, diagnosis, prescription, notes } = body;

    // Prepare update object
    const updateData: any = {};

    if (status) {
      updateData.status = status.toUpperCase();
    }
    if (diagnosis !== undefined) {
      updateData.diagnosis = diagnosis;
    }
    if (prescription !== undefined) {
      updateData.prescription = prescription;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Update the appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate({
        path: 'patient',
        model: 'Patient',
        select: 'firstName lastName email phone nic dateOfBirth gender address',
      })
      .populate({
        path: 'doctor',
        model: 'Doctor',
        select: 'user profile',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name email phone',
        },
      })
      .lean();

    if (!updatedAppointment) {
      return NextResponse.json(
        { success: false, message: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    // Format the response
    const patientData = updatedAppointment.patient
      ? {
          _id: updatedAppointment.patient._id?.toString() || '',
          firstName: updatedAppointment.patient.firstName || '',
          lastName: updatedAppointment.patient.lastName || '',
          email: updatedAppointment.patient.email || '',
          phone: updatedAppointment.patient.phone || '',
          nic: updatedAppointment.patient.nic || '',
          dateOfBirth: updatedAppointment.patient.dateOfBirth || null,
          gender: updatedAppointment.patient.gender || '',
          address: updatedAppointment.patient.address || null,
        }
      : null;

    let doctorData = null;
    if (
      updatedAppointment.doctor &&
      typeof updatedAppointment.doctor === 'object'
    ) {
      doctorData = {
        _id: updatedAppointment.doctor._id?.toString() || '',
        id: updatedAppointment.doctor._id?.toString() || '',
        name: updatedAppointment.doctor.user?.name || '',
        email: updatedAppointment.doctor.user?.email || '',
        phone: updatedAppointment.doctor.user?.phone || '',
        specialization: updatedAppointment.doctor.profile?.specialization || '',
        department: updatedAppointment.doctor.profile?.department || '',
      };
    }

    const formattedAppointment = {
      _id: updatedAppointment._id?.toString() || '',
      id: updatedAppointment._id?.toString() || '',
      patient: patientData,
      doctor: doctorData,
      appointmentDate: updatedAppointment.appointmentDate
        ? new Date(updatedAppointment.appointmentDate)
            .toISOString()
            .split('T')[0]
        : '',
      appointmentTime: updatedAppointment.appointmentTime || '',
      duration: updatedAppointment.duration || 30,
      type: updatedAppointment.type || '',
      status: updatedAppointment.status || 'SCHEDULED',
      reason: updatedAppointment.reason || '',
      symptoms: updatedAppointment.symptoms || '',
      diagnosis: updatedAppointment.diagnosis || '',
      prescription: updatedAppointment.prescription || '',
      notes: updatedAppointment.notes || '',
      createdAt: updatedAppointment.createdAt || null,
      updatedAt: updatedAppointment.updatedAt || null,
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment updated successfully',
        data: formattedAppointment,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to update appointment',
      },
      { status: 500 }
    );
  }
}
