export const calculateAge = (dateOfBirth: Date): number => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

export const getMinDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const formatAppointmentType = (type: string): string => {
  return type.toLowerCase().replace('_', ' ');
};

export const formatAppointmentStatus = (status: string): string => {
  return status.charAt(0) + status.slice(1).toLowerCase();
};

export const formatBloodType = (bloodType?: string): string => {
  if (!bloodType) return 'Not specified';
  return bloodType;
};

export const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-UK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (timeString: string): string => {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-UK', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
