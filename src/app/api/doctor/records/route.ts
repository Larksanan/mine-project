import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import '@/models/Patient';
import '@/models/User';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    if (!session.user.role || session.user.role !== 'DOCTOR') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Doctor access required',
        },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { doctorId: session.user.id };
    if (patientId) query.patientId = patientId;

    const records = await MedicalRecord.find(query)
      .populate(
        'patientId',
        'firstName lastName email phone dateOfBirth gender'
      )
      .populate('doctorId', 'name email specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await MedicalRecord.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== POST /api/doctor/records - Starting ===');

    const session = await getServerSession(authOptions);
    console.log(
      'Session check:',
      session ? 'Authenticated' : 'Not authenticated'
    );

    if (!session?.user) {
      console.log('No session/user found');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    if (!session.user.role || session.user.role !== 'DOCTOR') {
      console.log('User role check failed:', session.user.role);
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Doctor access required',
        },
        { status: 403 }
      );
    }

    console.log('Authenticated user:', session.user.id, session.user.role);

    // Parse FormData (NOT JSON!)
    console.log('Parsing FormData...');
    let formData;
    try {
      formData = await request.formData();
      console.log('FormData keys:', Array.from(formData.keys()));
    } catch (error) {
      console.error('Error parsing FormData:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid form data - expected multipart/form-data',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      );
    }

    // Extract form fields
    const patientId = formData.get('patientId') as string;
    const recordType = formData.get('recordType') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const status = formData.get('status') as string;
    const doctorNotes = formData.get('doctorNotes') as string;

    console.log('Extracted fields:', {
      patientId,
      recordType,
      title: title?.substring(0, 30) + '...',
      description: description?.substring(0, 30) + '...',
      date,
      status,
      doctorNotesLength: doctorNotes?.length || 0,
    });

    // Validate required fields
    const errors: string[] = [];
    if (!patientId) errors.push('Patient ID is required');
    if (!recordType) errors.push('Record type is required');
    if (!title) errors.push('Title is required');
    if (!description) errors.push('Description is required');
    if (!date) errors.push('Date is required');

    if (errors.length > 0) {
      console.log('Validation errors:', errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errors,
        },
        { status: 400 }
      );
    }

    // Handle file uploads
    const attachmentPaths: string[] = [];
    const files = formData.getAll('attachments') as File[];
    console.log('Processing files:', files.length);

    if (files && files.length > 0) {
      try {
        const uploadDir = join(
          process.cwd(),
          'public',
          'uploads',
          'medical-records'
        );

        // Ensure directory exists
        if (!existsSync(uploadDir)) {
          console.log('Creating upload directory:', uploadDir);
          await mkdir(uploadDir, { recursive: true });
        }

        for (const file of files) {
          // Skip if it's not actually a file (empty form field)
          if (file && file.size > 0 && file.name) {
            console.log('Processing file:', {
              name: file.name,
              size: file.size,
              type: file.type,
            });

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Generate unique filename
            const timestamp = Date.now();
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
            const filename = `${timestamp}-${sanitizedName}`;
            const filepath = join(uploadDir, filename);

            // Save file
            await writeFile(filepath, buffer);
            console.log('File saved:', filename);

            // Store relative path
            attachmentPaths.push(`/uploads/medical-records/${filename}`);
          }
        }
        console.log('Total files saved:', attachmentPaths.length);
      } catch (fileError) {
        console.error('Error handling files:', fileError);
        return NextResponse.json(
          {
            success: false,
            error: 'File upload failed',
            details:
              fileError instanceof Error ? fileError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // Connect to database
    console.log('Connecting to database...');
    try {
      await connectDB();
      console.log('Database connected');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Create new medical record
    console.log('Creating medical record...');
    try {
      const recordData = {
        patientId,
        doctorId: session.user.id,
        recordType,
        title,
        description,
        date: new Date(date),
        status: status || 'ACTIVE',
        attachments: attachmentPaths,
        doctorNotes: doctorNotes || '',
      };

      console.log('Record data:', {
        ...recordData,
        description: recordData.description.substring(0, 50) + '...',
      });

      const medicalRecord = new MedicalRecord(recordData);

      await medicalRecord.save();
      console.log('Medical record saved with ID:', medicalRecord._id);

      // Populate the response
      const populatedRecord = await MedicalRecord.findById(medicalRecord._id)
        .populate(
          'patientId',
          'firstName lastName email phone dateOfBirth gender'
        )
        .populate('doctorId', 'name email specialization')
        .lean();

      console.log('=== POST /api/doctor/records - Success ===');
      return NextResponse.json(
        {
          success: true,
          message: 'Medical record created successfully',
          data: populatedRecord,
        },
        { status: 201 }
      );
    } catch (saveError) {
      console.error('Error saving medical record:', saveError);

      if (saveError instanceof Error && saveError.name === 'ValidationError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            details: saveError.message,
          },
          { status: 400 }
        );
      }

      if (saveError instanceof Error && saveError.name === 'CastError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid ID format',
            details: 'Patient ID or Doctor ID is not a valid MongoDB ObjectId',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save medical record',
          details:
            saveError instanceof Error ? saveError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('=== Unexpected error in POST handler ===');
    console.error('Error:', error);
    console.error(
      'Stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
