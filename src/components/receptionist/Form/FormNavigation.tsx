import React from 'react';

interface FormNavigationProps {
  sections: Array<{ id: string; label: string }>;
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

const FormNavigation: React.FC<FormNavigationProps> = ({
  sections,
  activeSection,
  onSectionChange,
}) => {
  return (
    <div className='lg:col-span-1'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-4'>
        <h3 className='text-lg font-medium text-gray-900 mb-4'>
          Receptionist Profile
        </h3>
        <nav className='space-y-2'>
          {sections.map(section => (
            <button
              key={section.id}
              type='button'
              onClick={() => onSectionChange(section.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default FormNavigation;
