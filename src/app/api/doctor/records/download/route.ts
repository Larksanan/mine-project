// app/api/doctor/records/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readFile } from 'fs/promises';
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

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        {
          success: false,
          error: 'Filename is required',
        },
        { status: 400 }
      );
    }

    console.log('Download request for:', filename);

    // Normalize backslashes to forward slashes
    let cleanFilename = filename.replace(/\\/g, '/');

    // Remove allowed prefix if present
    const allowedPrefix = '/uploads/medical-records/';
    if (cleanFilename.startsWith(allowedPrefix)) {
      cleanFilename = cleanFilename.substring(allowedPrefix.length);
    }

    console.log('Clean filename:', cleanFilename);

    // Security: Prevent path traversal attacks
    if (
      cleanFilename.includes('..') ||
      cleanFilename.includes('/') ||
      cleanFilename.includes('\0')
    ) {
      console.error('Invalid filename detected:', cleanFilename);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid filename - path traversal not allowed',
        },
        { status: 400 }
      );
    }

    const filepath = join(
      process.cwd(),
      'public',
      'uploads',
      'medical-records',
      cleanFilename
    );
    console.log('Looking for file at:', filepath);

    // Check if file exists
    if (!existsSync(filepath)) {
      console.error('File not found at:', filepath);
      return NextResponse.json(
        {
          success: false,
          error: 'File not found',
        },
        { status: 404 }
      );
    }

    // Read file
    const fileBuffer = await readFile(filepath);
    console.log('File read successfully, size:', fileBuffer.length);

    // Determine content type based on file extension
    const ext = cleanFilename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'doc':
        contentType = 'application/msword';
        break;
      case 'docx':
        contentType =
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'txt':
        contentType = 'text/plain';
        break;
    }

    // Return file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${cleanFilename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to download file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
