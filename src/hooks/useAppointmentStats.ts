import { Appointment } from '@/types/appointment';

export const useAppointmentStats = (appointments: Appointment[]) => {
  const getStats = () => {
    const total = appointments.length;
    const scheduled = appointments.filter(
      apt => apt.status === 'scheduled'
    ).length;
    const completed = appointments.filter(
      apt => apt.status === 'completed'
    ).length;
    const cancelled = appointments.filter(
      apt => apt.status === 'cancelled'
    ).length;
    const confirmed = appointments.filter(
      apt => apt.status === 'confirmed'
    ).length;
    const noShow = appointments.filter(apt => apt.status === 'no-show').length;

    return {
      total,
      scheduled,
      completed,
      cancelled,
      confirmed,
      noShow,
    };
  };

  return {
    stats: getStats(),
  };
};
