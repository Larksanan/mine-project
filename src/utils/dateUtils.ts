export const getMinDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const getMaxDate = (daysInFuture = 90): string => {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + daysInFuture);
  return maxDate.toISOString().split('T')[0];
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (time: string): string => {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
