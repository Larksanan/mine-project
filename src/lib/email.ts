/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from 'nodemailer';
import logo from '@/components/Logo.static';
import Footer from '@/components/Footer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
  },
});

transporter.verify(function (error, _success) {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to take our messages');
    console.log('SMTP Configuration:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
      from: process.env.SMTP_FROM,
    });
  }
});

export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    await transporter.sendMail({
      from: `"Support Team" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to Our Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">${logo}</div>
          
          <!-- English -->
          <h1 style="color: #4F46E5;">Welcome, ${name}!</h1>
          <p>Thank you for joining us. We're excited to have you on board.</p>
          <p>You can now log in and start exploring our services.</p>
          <br/>
          <p>Best regards,</p>
          <p style="color: #666; font-size: 14px;">If you have any questions, feel free to contact our support team.</p>
          <p> J.A. JEBARSAN THATCROOS,</p>
          <p>The Team</p>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

          <!-- Tamil -->
          <h1 style="color: #4F46E5;">வணக்கம், ${name}!</h1>
          <p>எங்களுடன் இணைந்ததற்கு நன்றி. உங்களை வரவேற்பதில் மகிழ்ச்சி அடைகிறோம்.</p>
          <p>நீங்கள் இப்போது உள்நுழைந்து எங்கள் சேவைகளைப் பயன்படுத்தத் தொடங்கலாம்.</p>
          <br/>
          <p>வாழ்த்துகள்,</p>
          <p style="color: #666; font-size: 14px;">உங்களுக்கு ஏதேனும் கேள்விகள் இருந்தால், எங்கள் ஆதரவுக் குழுவைத் தொடர்பு கொள்ளவும்.</p>
          <p>யூ.அ.ஜெபர்சன் தகுற்ரூஸ்.</p>
          ${Footer}
        </div>
      `,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending welcome email to ${email}:`, error);
  }
};

export const sendLoginNotification = async (email: string, name: string) => {
  try {
    await transporter.sendMail({
      from: `"Security Team" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'New Login Detected',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">${logo}</div>
          
          <!-- English -->
          <h2 style="color: #EF4444;">New Login Alert</h2>
          <p>Hello ${name},</p>
          <p>We detected a new login to your account on ${new Date().toLocaleString()}.</p>
          <p>If this was you, you can safely ignore this email.</p>
          <p>If you did not sign in, please reset your password immediately.</p>
          <br/>
          <p>Best regards,</p>
          <p> J.A. JEBARSAN THATCROOS,</p>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

          <!-- Tamil -->
          <h2 style="color: #EF4444;">புதிய உள்நுழைவு எச்சரிக்கை</h2>
          <p>வணக்கம் ${name},</p>
          <p>${new Date().toLocaleString()} அன்று உங்கள் கணக்கில் புதிய உள்நுழைவைக் கண்டறிந்தோம்.</p>
          <p>இது நீங்கள்தான் என்றால், இந்த மின்னஞ்சலைப் புறக்கணிக்கலாம்.</p>
          <p>நீங்கள் உள்நுழையவில்லை என்றால், உடனடியாக உங்கள் கடவுச்சொல்லை மாற்றவும்.</p>
          <br/>
          <p>வாழ்த்துகள்,</p>
          <p>யூ.அ.ஜெபர்சன் தகுற்ரூஸ்</p>
           ${Footer}
        </div>
      `,
    });
    console.log(`Login notification sent to ${email}`);
  } catch (error) {
    console.error(`Error sending login notification to ${email}:`, error);
  }
};

export const sendPasswordResetEmail = async (email: string, code: string) => {
  try {
    await transporter.sendMail({
      from: `"Support Team" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">${logo}</div>
          
          <!-- English -->
          <h2 style="color: #4F46E5;">Password Reset Request</h2>
          <p>You requested a password reset. Please use the following verification code:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; display: inline-block; margin: 10px 0;">
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #333; margin: 0;">${code}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you did not request this, please ignore this email.</p>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

          <!-- Tamil -->
          <h2 style="color: #4F46E5;">கடவுச்சொல் மீட்டமைப்பு கோரிக்கை</h2>
          <p>நீங்கள் கடவுச்சொல் மீட்டமைப்பைக் கோரியுள்ளீர்கள். பின்வரும் சரிபார்ப்புக் குறியீட்டைப் பயன்படுத்தவும்:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; display: inline-block; margin: 10px 0;">
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #333; margin: 0;">${code}</h1>
          </div>
          <p>இந்தக் குறியீடு 10 நிமிடங்களில் காலாவியாகும்.</p>
          <p style="color: #666; font-size: 14px;">நீங்கள் இதைக் கோரவில்லை என்றால், இந்த மின்னஞ்சலைப் புறக்கணிக்கவும்.</p>
          ${Footer}
        </div>
      `,
    });
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending password reset email to ${email}:`, error);
    throw new Error('Failed to send password reset email');
  }
};

export const sendVerificationEmail = async (
  email: string,
  code: string,
  name: string
) => {
  try {
    await transporter.sendMail({
      from: `"Support Team" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">${logo}</div>
          
          <!-- English -->
          <h2 style="color: #4F46E5;">Verify Your Email</h2>
          <p>Hello ${name},</p>
          <p>Please use the verification code below to verify your email address:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; display: inline-block; margin: 10px 0;">
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #333; margin: 0;">${code}</h1>
          </div>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <br/>
          <p>Best regards,</p>
          <p>J.A. JEBARSAN THATCROOS</p>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

          <!-- Tamil -->
          <h2 style="color: #4F46E5;">உங்கள் மின்னஞ்சலைச் சரிபார்க்கவும்</h2>
          <p>வணக்கம் ${name},</p>
          <p>உங்கள் மின்னஞ்சல் முகவரியைச் சரிபார்க்க கீழே உள்ள சரிபார்ப்புக் குறியீட்டைப் பயன்படுத்தவும்:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; display: inline-block; margin: 10px 0;">
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #333; margin: 0;">${code}</h1>
          </div>
          <p>நீங்கள் இதைக் கோரவில்லை என்றால், இந்த மின்னஞ்சலைப் புறக்கணிக்கலாம்.</p>
          <br/>
          <p>வாழ்த்துகள்,</p>
          <p>யூ.அ.ஜெபர்சன் தகுற்ரூஸ்</p>
          ${Footer}
        </div>
      `,
    });
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending verification email to ${email}:`, error);
    throw new Error('Failed to send verification email');
  }
};

export const sendPrescriptions = async (
  email: string,
  firstName: string,
  lastName: string,
  diagnosis: string,
  startDate: string,
  endDate: string
) => {
  try {
    await transporter.sendMail({
      from: `"Support Team" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'New Prescription Issued - MediConnect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">${logo}</div>
          
          <!-- English -->
          <h2 style="color: #2563eb;">New Prescription Issued</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>A new prescription has been issued for you.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Diagnosis:</strong> ${diagnosis}</p>
            <p style="margin: 5px 0;"><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>
          </div>

          <p>You can view the full details of your prescription by logging into your patient portal.</p>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />

          <!-- Tamil -->
          <h2 style="color: #2563eb;">புதிய மருந்துச் சீட்டு வழங்கப்பட்டது</h2>
          <p>அன்புள்ள ${firstName} ${lastName},</p>
          <p>உங்களுக்காக ஒரு புதிய மருந்துச் சீட்டு வழங்கப்பட்டுள்ளது.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>நோயறிதல்:</strong> ${diagnosis}</p>
            <p style="margin: 5px 0;"><strong>தொடக்க தேதி:</strong> ${new Date(startDate).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>முடிவு தேதி:</strong> ${new Date(endDate).toLocaleDateString()}</p>
          </div>

          <p>உங்கள் நோயாளி போர்ட்டலில் உள்நுழைந்து உங்கள் மருந்துச் சீட்டின் முழு விவரங்களையும் பார்க்கலாம்.</p>
        </div>
        <br/>
          <p>வாழ்த்துகள்,</p>
          <p>யூ.அ.ஜெபர்சன் தகுற்ரூஸ்</p>
          ${Footer}
        </div>

      `,
    });

    console.log(`Prescription email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending prescription email to ${email}:`, error);
    throw new Error('Failed to send prescription email');
  }
};

export const sendNowPatients = async (
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  nic: string,
  dateOfBirth: string,
  gender: string,
  address: any,
  emergencyContact: any,
  medicalHistory: string,
  allergies: string[],
  medications: string[],
  insurance: any,
  bloodType: string,
  height: number,
  weight: number,
  isActive: boolean,
  maritalStatus: string,
  occupation: string,
  preferredLanguage: string,
  lastVisit: string
) => {
  try {
    const formattedAddress = address
      ? [
          address.street,
          address.city,
          address.state,
          address.zipCode,
          address.country,
        ]
          .filter(Boolean)
          .join(', ')
      : 'Not provided';

    const formattedEmergencyContact = emergencyContact
      ? `${emergencyContact.name} (${emergencyContact.relationship || 'N/A'}, ${
          emergencyContact.phone || 'N/A'
        })`
      : 'Not provided';

    const formattedInsurance = insurance
      ? `${insurance.provider} (Policy: ${insurance.policyNumber || 'N/A'})`
      : 'Not provided';

    await transporter.sendMail({
      from: `"Support Team" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Patient Registration Confirmation - MediConnect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
         <div style="text-align: center; margin-bottom: 20px;">${logo}</div>
          <h2 style="color: #2563eb;">Patient Registration Successful</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>Your patient profile has been successfully registered in our system.</p>

          <h3>Patient Details (English)</h3>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>NIC:</strong> ${nic}</p>
            <p><strong>Date of Birth:</strong> ${new Date(dateOfBirth).toLocaleDateString()}</p>
            <p><strong>Gender:</strong> ${gender}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Address:</strong> ${formattedAddress}</p>
            <p><strong>Emergency Contact:</strong> ${formattedEmergencyContact}</p>
            <p><strong>Medical History:</strong> ${medicalHistory}</p>
            <p><strong>Allergies:</strong> ${allergies.join(', ') || 'None'}</p>
            <p><strong>Medications:</strong> ${medications.join(', ') || 'None'}</p>
            <p><strong>Insurance:</strong> ${formattedInsurance}</p>
            <p><strong>Blood Type:</strong> ${bloodType}</p>
            <p><strong>Height:</strong> ${height} cm</p>
            <p><strong>Weight:</strong> ${weight} kg</p>
            <p><strong>Marital Status:</strong> ${maritalStatus}</p>
            <p><strong>Occupation:</strong> ${occupation}</p>
            <p><strong>Preferred Language:</strong> ${preferredLanguage}</p>
            <p><strong>Last Visit:</strong> ${new Date(lastVisit).toLocaleDateString()}</p>
            <p><strong>Active Status:</strong> ${isActive ? 'Active' : 'Inactive'}</p>
          </div>

          <h3>நோயாளி விவரங்கள் (Tamil)</h3>
          <div style="background-color: #e5e7eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>அடையாள எண் (NIC):</strong> ${nic}</p>
            <p><strong>பிறந்த தேதி:</strong> ${new Date(dateOfBirth).toLocaleDateString()}</p>
            <p><strong>பாலினம்:</strong> ${gender}</p>
            <p><strong>தொலைபேசி:</strong> ${phone}</p>
            <p><strong>முகவரி:</strong> ${formattedAddress}</p>
            <p><strong>அவசர தொடர்பு:</strong> ${formattedEmergencyContact}</p>
            <p><strong>மருத்துவ வரலாறு:</strong> ${medicalHistory}</p>
            <p><strong>அலர்ஜிகள்:</strong> ${allergies.join(', ') || 'இல்லை'}</p>
            <p><strong>மருந்துகள்:</strong> ${medications.join(', ') || 'இல்லை'}</p>
            <p><strong>காப்பீடு:</strong> ${formattedInsurance}</p>
            <p><strong>இரத்த வகை:</strong> ${bloodType}</p>
            <p><strong>உயரம்:</strong> ${height} செ.மீ</p>
            <p><strong>எடை:</strong> ${weight} கிலோ</p>
            <p><strong>திருமண நிலை:</strong> ${maritalStatus}</p>
            <p><strong>வேலை:</strong> ${occupation}</p>
            <p><strong>விருப்ப மொழி:</strong> ${preferredLanguage}</p>
            <p><strong>கடைசி வருகை:</strong> ${new Date(lastVisit).toLocaleDateString()}</p>
            <p><strong>செயலில் நிலை:</strong> ${isActive ? 'செயலில்' : 'செயலில் இல்லை'}</p>
          </div>

          <p>You can log in to your patient portal to view or update your information anytime.</p>
          <p>நீங்கள் எப்போதும் உங்கள் நோயாளி போர்டலில் உள்நுழைந்து உங்கள் தகவலைப் பார்க்க அல்லது புதுப்பிக்கலாம்.</p>
          ${Footer}
        </div>
      `,
    });

    console.log(
      `Patient registration email (English & Tamil) sent to ${email}`
    );
  } catch (error) {
    console.error(
      `Error sending patient registration email to ${email}:`,
      error
    );
    throw new Error('Failed to send patient registration email');
  }
};
