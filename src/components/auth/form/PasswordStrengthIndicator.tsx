'use client';

import { useState, useEffect } from 'react';
import { MdCheck } from 'react-icons/md';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
}

export default function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const [passwordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
  });

  useEffect(() => {
    if (password) {
      // eslint-disable-next-line react-hooks/immutability
      checkPasswordStrength(password);
    }
  }, [password]);

  const checkPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score++;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('One uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('One lowercase letter');
    }

    if (/[0-9]/.test(password)) {
      score++;
    } else {
      feedback.push('One number');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score++;
    } else {
      feedback.push('One special character');
    }

    return { score, feedback };
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score === 0) return 'bg-gray-200';
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score === 0) return 'Enter a password';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className='mt-3 space-y-2'>
      <div className='flex items-center justify-between'>
        <span className='text-xs text-gray-500'>
          Password strength:{' '}
          <span
            className={`font-medium ${
              passwordStrength.score <= 2
                ? 'text-red-600'
                : passwordStrength.score <= 3
                  ? 'text-yellow-600'
                  : passwordStrength.score <= 4
                    ? 'text-blue-600'
                    : 'text-green-600'
            }`}
          >
            {getPasswordStrengthText(passwordStrength.score)}
          </span>
        </span>
        <span className='text-xs text-gray-500'>
          {passwordStrength.score}/5
        </span>
      </div>
      <div className='w-full bg-gray-200 rounded-full h-2'>
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
          style={{
            width: `${(passwordStrength.score / 5) * 100}%`,
          }}
        />
      </div>

      {/* Password Requirements */}
      <div className='grid grid-cols-2 gap-1 mt-2'>
        {[
          { check: /^.{8,}$/, text: '8+ characters' },
          { check: /[A-Z]/, text: 'Uppercase letter' },
          { check: /[a-z]/, text: 'Lowercase letter' },
          { check: /[0-9]/, text: 'Number' },
          { check: /[^A-Za-z0-9]/, text: 'Special character' },
        ].map((req, index) => (
          <div key={index} className='flex items-center space-x-1'>
            {req.check.test(password) ? (
              <MdCheck className='h-3 w-3 text-green-500 shrink-0' />
            ) : (
              <div className='h-3 w-3 rounded-full border border-gray-300 shrink-0' />
            )}
            <span
              className={`text-xs ${req.check.test(password) ? 'text-green-600' : 'text-gray-500'}`}
            >
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
