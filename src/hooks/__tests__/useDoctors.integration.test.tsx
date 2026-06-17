/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDoctors } from '../useDoctors';

// Mock the hook for integration testing
jest.mock('../useDoctors', () => {
  const originalModule = jest.requireActual('../useDoctors');
  return {
    ...originalModule,
    useDoctors: jest.fn(),
  };
});

const mockUseDoctors = useDoctors as jest.MockedFunction<typeof useDoctors>;

// Test component that uses useDoctors
const TestDoctorsComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [department, _setDepartment] = useState('');
  const [minExperience, setMinExperience] = useState(0);
  const [maxFee, _setMaxFee] = useState(10000);
  const [sortBy, setSortBy] = useState('name');

  const {
    doctors,
    filteredDoctors,
    loading,
    filterAndSortDoctors,
    refetchDoctors,
  } = useDoctors('authenticated');

  const handleFilter = () => {
    const _filtered = filterAndSortDoctors(
      doctors,
      searchTerm,
      specialization,
      department,
      minExperience,
      maxFee,
      sortBy as any
    );
    // In real component, you'd setFilteredDoctors(_filtered)
  };

  return (
    <div>
      <div data-testid='loading'>{loading ? 'Loading...' : 'Loaded'}</div>
      <div data-testid='doctors-count'>
        Doctors: {doctors.length}, Filtered: {filteredDoctors.length}
      </div>

      <input
        data-testid='search-input'
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder='Search...'
      />

      <select
        data-testid='specialization-select'
        value={specialization}
        onChange={e => setSpecialization(e.target.value)}
      >
        <option value=''>All Specializations</option>
        <option value='Cardiology'>Cardiology</option>
        <option value='Neurology'>Neurology</option>
      </select>

      <input
        data-testid='experience-input'
        type='number'
        value={minExperience}
        onChange={e => setMinExperience(Number(e.target.value))}
        placeholder='Min Experience'
      />

      <select
        data-testid='sort-select'
        value={sortBy}
        onChange={e => setSortBy(e.target.value)}
      >
        <option value='name'>Name</option>
        <option value='experience'>Experience</option>
        <option value='fee'>Fee</option>
        <option value='rating'>Rating</option>
      </select>

      <button data-testid='filter-button' onClick={handleFilter}>
        Apply Filters
      </button>

      <button data-testid='refetch-button' onClick={refetchDoctors}>
        Refresh
      </button>

      <div data-testid='doctors-list'>
        {filteredDoctors.map(doctor => (
          <div key={doctor._id} data-testid={`doctor-${doctor._id}`}>
            <h3 data-testid={`doctor-name-${doctor._id}`}>{doctor.name}</h3>
            <p data-testid={`doctor-specialization-${doctor._id}`}>
              {doctor.specialization}
            </p>
            <p data-testid={`doctor-experience-${doctor._id}`}>
              {doctor.experience} years
            </p>
            <p data-testid={`doctor-fee-${doctor._id}`}>
              ${doctor.consultationFee}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

describe('useDoctors Hook Integration', () => {
  const mockDoctors = [
    {
      _id: '1',
      name: 'Dr. Jebarsan Thatcroos',
      email: 'jebarsathatcroos@gmail.com',
      phone: '1234567890',
      image: '',
      specialization: 'Cardiology',
      department: 'Heart Center',
      licenseNumber: 'LIC123',
      hospital: 'City Hospital',
      experience: 10,
      consultationFee: 5000,
      qualifications: ['MBBS', 'MD'],
      languages: ['Tamil', 'English'],
      isVerified: true,
      rating: { average: 4.5, count: 120 },
    },
    {
      _id: '2',
      name: 'Dr. Shalomai Moraies',
      email: 'shalomaimoraies@gmail.com',
      phone: '0987654321',
      image: '',
      specialization: 'Neurology',
      department: 'Neuro Center',
      licenseNumber: 'LIC456',
      hospital: 'General Hospital',
      experience: 8,
      consultationFee: 6000,
      qualifications: ['MBBS', 'DM'],
      languages: ['English'],
      isVerified: true,
      rating: { average: 4.8, count: 95 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should integrate with UI component correctly', async () => {
    mockUseDoctors.mockReturnValue({
      doctors: mockDoctors,
      filteredDoctors: mockDoctors,
      loading: false,
      setFilteredDoctors: jest.fn(),
      filterAndSortDoctors: jest.fn().mockReturnValue(mockDoctors),
      refetchDoctors: jest.fn(),
    });

    render(<TestDoctorsComponent />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    expect(screen.getByTestId('doctors-count')).toHaveTextContent(
      'Doctors: 2, Filtered: 2'
    );

    // UI elements should be present
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('specialization-select')).toBeInTheDocument();
    expect(screen.getByTestId('experience-input')).toBeInTheDocument();
    expect(screen.getByTestId('sort-select')).toBeInTheDocument();
    expect(screen.getByTestId('filter-button')).toBeInTheDocument();
    expect(screen.getByTestId('refetch-button')).toBeInTheDocument();

    // Doctors should be displayed
    expect(screen.getByTestId('doctor-1')).toBeInTheDocument();
    expect(screen.getByTestId('doctor-2')).toBeInTheDocument();
    expect(screen.getByTestId('doctor-name-1')).toHaveTextContent(
      'Dr. Jebarsan Thatcroos'
    );
    expect(screen.getByTestId('doctor-specialization-1')).toHaveTextContent(
      'Cardiology'
    );
  });

  it('should handle loading state', () => {
    mockUseDoctors.mockReturnValue({
      doctors: [],
      filteredDoctors: [],
      loading: true,
      setFilteredDoctors: jest.fn(),
      filterAndSortDoctors: jest.fn(),
      refetchDoctors: jest.fn(),
    });

    render(<TestDoctorsComponent />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
    expect(screen.queryByTestId('doctors-list')).toBeEmptyDOMElement();
  });

  it('should call filterAndSortDoctors when filters are applied', () => {
    const mockFilterAndSort = jest.fn().mockReturnValue([mockDoctors[0]]);

    mockUseDoctors.mockReturnValue({
      doctors: mockDoctors,
      filteredDoctors: mockDoctors,
      loading: false,
      setFilteredDoctors: jest.fn(),
      filterAndSortDoctors: mockFilterAndSort,
      refetchDoctors: jest.fn(),
    });

    render(<TestDoctorsComponent />);

    // Set filter values
    fireEvent.change(screen.getByTestId('search-input'), {
      target: { value: 'Jebarsan' },
    });
    fireEvent.change(screen.getByTestId('specialization-select'), {
      target: { value: 'Cardiology' },
    });
    fireEvent.change(screen.getByTestId('experience-input'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByTestId('sort-select'), {
      target: { value: 'experience' },
    });

    // Apply filters
    fireEvent.click(screen.getByTestId('filter-button'));

    expect(mockFilterAndSort).toHaveBeenCalledWith(
      mockDoctors,
      'Jebarsan',
      'Cardiology',
      '',
      5,
      10000,
      'experience'
    );
  });

  it('should call refetchDoctors when refresh button is clicked', () => {
    const mockRefetch = jest.fn();

    mockUseDoctors.mockReturnValue({
      doctors: mockDoctors,
      filteredDoctors: mockDoctors,
      loading: false,
      setFilteredDoctors: jest.fn(),
      filterAndSortDoctors: jest.fn(),
      refetchDoctors: mockRefetch,
    });

    render(<TestDoctorsComponent />);

    fireEvent.click(screen.getByTestId('refetch-button'));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});
