/* eslint-disable no-undef */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminUsersPage from './page';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

jest.mock('@/components/Loading', () => {
  return function Loading() {
    return <div>Loading...</div>;
  };
});

jest.mock('@/components/Error', () => ({
  __esModule: true,
  default: function ErrorComponent({ message }: { message: string }) {
    return <div>Error: {message}</div>;
  },
}));

jest.mock('next/link', () => {
  return function Link({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/image', () => {
  return function Image({ src, alt }: { src: string; alt: string }) {
    return <img src={src} alt={alt} />;
  };
});

const mockUsers = [
  {
    _id: '1',
    name: 'jebarsan thatcroos',
    email: 'jebarsanthatcroos@gamil.com',
    phone: '+9476 239 7951',
    image: '/avatar1.jpg',
    role: 'ADMIN',
    nic: '200121901656',
    status: 'ACTIVE',
    isEmailVerified: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    createdAtFormatted: '2024-01-01T00:00:00.000Z',
    lastLogin: '2024-01-15T00:00:00.000Z',
  },
  {
    _id: '2',
    name: 'sovika sovi',
    email: 'sovikasovika@example.com',
    phone: '+0987654321',
    role: 'DOCTOR',
    nic: '987654321V',
    status: 'ACTIVE',
    isEmailVerified: false,
    createdAt: '2024-01-02T00:00:00.000Z',
    createdAtFormatted: '2024-01-02T00:00:00.000Z',
  },
  {
    _id: '3',
    name: 't larsanan',
    email: 'larsanan@example.com',
    phone: '+1122334455',
    role: 'PATIENT',
    nic: '555666777V',
    status: 'INACTIVE',
    isEmailVerified: true,
    createdAt: '2024-01-03T00:00:00.000Z',
    createdAtFormatted: '2024-01-03T00:00:00.000Z',
  },
];

const mockStatistics = {
  total: 150,
  active: 120,
  inactive: 20,
  suspended: 10,
  verified: 130,
  unverified: 20,
  roles: {
    ADMIN: 5,
    DOCTOR: 30,
    PATIENT: 100,
    NURSE: 10,
    RECEPTIONIST: 3,
    PHARMACIST: 2,
  },
};

const mockPagination = {
  page: 1,
  limit: 20,
  total: 150,
  pages: 8,
  hasNextPage: true,
  hasPrevPage: false,
};

const mockApiResponse = {
  data: mockUsers,
  pagination: mockPagination,
  statistics: mockStatistics,
};

type FetchMock = jest.MockedFunction<typeof fetch>;

describe('AdminUsersPage', () => {
  let mockFetch: FetchMock;

  beforeEach(() => {
    mockFetch = jest.fn() as FetchMock;
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Render and Loading', () => {
    it('should show loading component initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<AdminUsersPage />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should fetch users on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/users')
        );
      });
    });
  });

  describe('Data Display', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);
    });

    it('should display page title and description', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('User Management')).toBeInTheDocument();
        expect(
          screen.getByText('Manage all system users and their roles')
        ).toBeInTheDocument();
      });
    });

    it('should display statistics cards', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('Active Users')).toBeInTheDocument();
        expect(screen.getByText('120')).toBeInTheDocument();
        expect(screen.getByText('Verified')).toBeInTheDocument();
        expect(screen.getByText('130')).toBeInTheDocument();
        expect(screen.getByText('Suspended')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
      });
    });

    it('should display users in table', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('jebarsan thatcroos')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('sovika sovi')).toBeInTheDocument();
        expect(
          screen.getByText('sovikasovika@example.com')
        ).toBeInTheDocument();
        expect(screen.getByText('t larsanan')).toBeInTheDocument();
        expect(screen.getByText('larsanan@example.com')).toBeInTheDocument();
      });
    });

    it('should display user roles with correct badges', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
        expect(screen.getByText('DOCTOR')).toBeInTheDocument();
        expect(screen.getByText('PATIENT')).toBeInTheDocument();
      });
    });

    it('should display verification status icons', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);
    });

    it('should have a search input', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Search by name, email, or phone...')
        ).toBeInTheDocument();
      });
    });

    it('should debounce search input and fetch results', async () => {
      jest.useFakeTimers();
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by name, email, or phone...'
      );

      await userEvent.type(searchInput, 'jebarsan thatcroos');

      // Fast-forward time by 500ms (debounce delay)
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('search=jebarsan%20thatcroos')
        );
      });

      jest.useRealTimers();
    });
  });

  describe('Filter Functionality', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);
    });

    it('should toggle filters panel', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.queryByLabelText('Role')).not.toBeInTheDocument();
      });

      const filterButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Role')).toBeInTheDocument();
        expect(screen.getByLabelText('Status')).toBeInTheDocument();
        expect(screen.getByLabelText('Verified')).toBeInTheDocument();
        expect(screen.getByLabelText('Sort By')).toBeInTheDocument();
      });
    });

    it('should filter by role', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Open filters
      const filterButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filterButton);

      // Select role filter
      const roleSelect = screen.getByLabelText('Role');
      fireEvent.change(roleSelect, { target: { value: 'DOCTOR' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('role=DOCTOR')
        );
      });
    });

    it('should filter by status', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const filterButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filterButton);

      const statusSelect = screen.getByLabelText('Status');
      fireEvent.change(statusSelect, { target: { value: 'ACTIVE' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('status=ACTIVE')
        );
      });
    });

    it('should filter by verification status', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const filterButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filterButton);

      const verifiedSelect = screen.getByLabelText('Verified');
      fireEvent.change(verifiedSelect, { target: { value: 'true' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('isEmailVerified=true')
        );
      });
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);
    });

    it('should display pagination information', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/Showing 1 to 20 of 150 results/i)
        ).toBeInTheDocument();
      });
    });

    it('should navigate to next page', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const nextButtons = screen.getAllByRole('button', { name: /next/i });
      fireEvent.click(nextButtons[0]);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2')
        );
      });
    });

    it('should navigate to previous page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockApiResponse,
          pagination: {
            ...mockPagination,
            page: 2,
            hasPrevPage: true,
          },
        }),
      } as Response);

      render(<AdminUsersPage />);

      await waitFor(() => {
        const prevButtons = screen.getAllByRole('button', {
          name: /previous/i,
        });
        expect(prevButtons[0]).not.toBeDisabled();
      });

      const prevButtons = screen.getAllByRole('button', { name: /previous/i });
      fireEvent.click(prevButtons[0]);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=1')
        );
      });
    });

    it('should disable previous button on first page', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        const prevButtons = screen.getAllByRole('button', {
          name: /previous/i,
        });
        prevButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });
    });

    it('should disable next button on last page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockApiResponse,
          pagination: {
            ...mockPagination,
            page: 8,
            pages: 8,
            hasNextPage: false,
            hasPrevPage: true,
          },
        }),
      } as Response);

      render(<AdminUsersPage />);

      await waitFor(() => {
        const nextButtons = screen.getAllByRole('button', { name: /next/i });
        nextButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });
    });
  });

  describe('Delete Functionality', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);
      window.alert = jest.fn();
    });

    it('should open delete confirmation modal', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('jebarsan thatcroos')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete User');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
        expect(
          screen.getByText(
            'Are you sure you want to delete this user? This action cannot be undone.'
          )
        ).toBeInTheDocument();
      });
    });

    it('should close modal when cancel is clicked', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('jebarsan thatcroos')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete User');
      fireEvent.click(deleteButtons[0]);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
      });
    });

    it('should delete user when confirmed', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockApiResponse,
            data: mockUsers.slice(1),
          }),
        } as Response);

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('jebarsan thatcroos')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete User');
      fireEvent.click(deleteButtons[0]);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('userId=1'),
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    it('should show alert on delete error', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: 'Failed to delete user' }),
        } as Response);

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('jebarsan thatcroos')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete User');
      fireEvent.click(deleteButtons[0]);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to delete user');
      });
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);

      // Mock URL.createObjectURL and related methods
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();

      // Mock document.createElement for the download link
      const mockLink = {
        click: jest.fn(),
        href: '',
        download: '',
      };
      jest
        .spyOn(document, 'createElement')
        .mockReturnValue(mockLink as unknown as HTMLElement);
    });

    it('should export users to CSV', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('jebarsan thatcroos')).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('Refresh Functionality', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);
    });

    it('should refresh users list', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('Error: Network error')).toBeInTheDocument();
      });
    });

    it('should display error when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Unauthorized' }),
      } as Response);

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('Error: Unauthorized')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no users found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          pagination: { ...mockPagination, total: 0 },
          statistics: mockStatistics,
        }),
      } as Response);

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as Response);
    });

    it('should have proper ARIA labels for buttons', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /filters/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /export/i })
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /refresh/i })
        ).toBeInTheDocument();
      });
    });

    it('should disable buttons appropriately', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        const prevButtons = screen.getAllByRole('button', {
          name: /previous/i,
        });
        prevButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });
    });
  });
});
