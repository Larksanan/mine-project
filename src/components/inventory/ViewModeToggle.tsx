'use client';

interface ViewModeToggleProps {
  viewMode: 'grid' | 'list';
  onChange: (mode: 'grid' | 'list') => void;
}

export default function ViewModeToggle({
  viewMode,
  onChange,
}: ViewModeToggleProps) {
  return (
    <div className='flex border border-gray-300 rounded-lg overflow-hidden'>
      <button
        onClick={() => onChange('list')}
        className={`px-3 py-2 ${
          viewMode === 'list'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700'
        } transition-colors focus:outline-none`}
        aria-label='List view'
      >
        <span className='hidden sm:inline'>List</span>
        <span className='sm:hidden'>📋</span>
      </button>
      <button
        onClick={() => onChange('grid')}
        className={`px-3 py-2 ${
          viewMode === 'grid'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700'
        } transition-colors focus:outline-none`}
        aria-label='Grid view'
      >
        <span className='hidden sm:inline'>Grid</span>
        <span className='sm:hidden'>⏹️</span>
      </button>
    </div>
  );
}
