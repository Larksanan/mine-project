interface ProgressStepsProps {
  currentStep: number;
}

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
  const steps = [
    { number: 1, label: 'Shipping' },
    { number: 2, label: 'Review' },
    { number: 3, label: 'Payment' },
  ];

  return (
    <div className='mb-8'>
      <div className='flex items-center justify-center gap-4'>
        {steps.map((step, index) => (
          <div key={step.number} className='flex items-center'>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                currentStep >= step.number
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {step.number}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 sm:w-32 h-1 transition-all ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className='flex justify-center gap-8 sm:gap-32 mt-2'>
        {steps.map(step => (
          <span
            key={step.number}
            className='text-xs sm:text-sm font-semibold text-gray-700'
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}
