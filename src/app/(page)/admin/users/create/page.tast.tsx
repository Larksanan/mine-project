/* eslint-disable no-undef */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminUsersPage from './page';
import '@testing-library/jest-dom';

jest.mock('@/components/Loading', () => {
  const LoadingMock = () => <div data-testid='loading'>Loading...</div>;
  LoadingMock.displayName = 'Loading';
  return LoadingMock;
});

jest.mock('@/components/Error', () => {
  const ErrorComponentMock = ({ message }: { message: string }) => (
    <div data-testid='error'>Error: {message}</div>
  );
  ErrorComponentMock.displayName = 'ErrorComponent';
  return ErrorComponentMock;
});

jest.mock('next/link', () => {
  const LinkMock = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  LinkMock.displayName = 'Link';
  return LinkMock;
});

jest.mock('next/image', () => {
  const ImageMock = ({
    src,
    alt,
    width,
    height,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }) => <img src={src} alt={alt} width={width} height={height} />;
  ImageMock.displayName = 'Image';
  return ImageMock;
});

// Mock data
const mockUsers = [
  {
    _id: '1',
    name: 'jebrsan thatcroos',
    email: 'jebrsanthatcroos@example.com',
    phone: '+1234567890',
    image: '/avatar1.jpg',
    role: 'ADMIN',
    nic: '123456789V',
    status: 'ACTIVE',
    isEmailVerified: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    createdAtFormatted: '2024-01-01T00:00:00.000Z',
    lastLogin: '2024-01-15T00:00:00.000Z',
  },
  {
    _id: '2',
    name: 'sovika sovi',
    email: 'sovika@example.com',
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

// Type for fetch mock
type FetchMock = jest.MockedFunction<typeof fetch>;

describe('AdminUsersPage', () => {
  let mockFetch: FetchMock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock window properties
    Object.defineProperty(window, 'alert', {
      writable: true,
      value: jest.fn(),
    });

    // Mock URL methods
    Object.defineProperty(window.URL, 'createObjectURL', {
      writable: true,
      value: jest.fn(() => 'blob:mock-url'),
    });

    Object.defineProperty(window.URL, 'revokeObjectURL', {
      writable: true,
      value: jest.fn(),
    });

    // Mock document.createElement
    const mockLink = {
      click: jest.fn(),
      href: '',
      download: '',
    };
    jest
      .spyOn(document, 'createElement')
      .mockReturnValue(mockLink as unknown as HTMLElement);

    mockFetch = jest.fn() as FetchMock;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Render and Loading', () => {
    it('should show loading component initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<AdminUsersPage />);
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should fetch users on mount', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/users')
        );
      });
    });
  });

  describe('Data Display', () => {
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
        expect(
          screen.getByText('jebrsanthatcroos@example.com')
        ).toBeInTheDocument();
        expect(screen.getByText('sovika sovi')).toBeInTheDocument();
        expect(screen.getByText('sovika@example.com')).toBeInTheDocument();
        expect(screen.getByText('t larsanan')).toBeInTheDocument();
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

    it('should display user images or initials', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        const image = screen.getByRole('img', { name: 'jebarsan thatcroos' });
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', '/avatar1.jpg');
      });
    });

    it('should display NIC numbers', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('123456789V')).toBeInTheDocument();
        expect(screen.getByText('987654321V')).toBeInTheDocument();
        expect(screen.getByText('555666777V')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
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

      fireEvent.change(searchInput, { target: { value: 'jebarsan' } });

      // Fast-forward time by 500ms (debounce delay)
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('search=jebarsan')
        );
      });

      jest.useRealTimers();
    });

    it('should reset to page 1 when searching', async () => {
      jest.useFakeTimers();

      // Start on page 2
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockApiResponse,
          pagination: { ...mockPagination, page: 2 },
        }),
      } as Response);

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const searchInput = screen.getByPlaceholderText(
        'Search by name, email, or phone...'
      );

      fireEvent.change(searchInput, { target: { value: 'test' } });
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=1')
        );
      });

      jest.useRealTimers();
    });
  });

  describe('Filter Functionality', () => {
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

      const filterButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filterButton);

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

    it('should change sort order', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const filterButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filterButton);

      const sortSelect = screen.getByLabelText('Sort By');
      fireEvent.change(sortSelect, { target: { value: 'name' } });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('sortBy=name')
        );
      });
    });
  });

  describe('Pagination', () => {
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

    it('should navigate to specific page number', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const pageButton = screen.getByRole('button', { name: '3' });
      fireEvent.click(pageButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=3')
        );
      });
    });
  });

  describe('Delete Functionality', () => {
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
        expect(screen.getByText('John Doe')).toBeInTheDocument();
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
    it('should export users to CSV', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('jebarsan thatcroos')).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);

      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('Refresh Functionality', () => {
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

    it('should disable refresh button while loading', async () => {
      mockFetch.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<AdminUsersPage />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
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
        expect(screen.getByTestId('error')).toBeInTheDocument();
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

  describe('Navigation Links', () => {
    it('should have add user link', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        const addUserLink = screen.getByRole('link', { name: /add user/i });
        expect(addUserLink).toHaveAttribute('href', '/admin/users/create');
      });
    });

    it('should have view user links', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        const viewButtons = screen.getAllByTitle('View Details');
        expect(viewButtons).toHaveLength(3);
      });
    });

    it('should have edit user links', async () => {
      render(<AdminUsersPage />);

      await waitFor(() => {
        const editButtons = screen.getAllByTitle('Edit User');
        expect(editButtons).toHaveLength(3);
      });
    });
  });

  describe('Accessibility', () => {
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
