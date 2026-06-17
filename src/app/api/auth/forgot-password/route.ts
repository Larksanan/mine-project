import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return Response.json({ message: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // For security reasons, we return a success message even if the user doesn't exist
      // to prevent email enumeration.
      return Response.json(
        {
          message:
            'If an account exists with this email, a verification code has been sent.',
        },
        { status: 200 }
      );
    }

    // Generate a 6-digit random code
    const resetToken = crypto.randomInt(100000, 999999).toString();

    // Set expiration to 10 minutes from now
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    return Response.json(
      {
        message:
          'If an account exists with this email, a verification code has been sent.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
