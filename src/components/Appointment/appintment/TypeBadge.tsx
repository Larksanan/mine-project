import React from 'react';

interface TypeBadgeProps {
  type: string;
}

const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'bg-purple-100 text-purple-800';
      case 'follow-up':
        return 'bg-indigo-100 text-indigo-800';
      case 'check-up':
        return 'bg-cyan-100 text-cyan-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTypeLabel = (type: string) => {
    return (
      type.replace('-', ' ').charAt(0).toUpperCase() +
      type.replace('-', ' ').slice(1)
    );
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(type)}`}
    >
      {formatTypeLabel(type)}
    </span>
  );
};

export default TypeBadge;
