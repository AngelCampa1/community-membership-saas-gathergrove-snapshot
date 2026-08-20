import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocationsPage from '../page';
import { locationService, type LocationResponse } from '@/lib/api/locationService';

// Mock dependencies
const mockUser = {
  id: 1,
  clubId: 1,
  email: 'admin@test.com',
  name: 'Admin User',
};

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock('@/hooks/useToast', () => ({
  useToast: () => mockToast,
}));

jest.mock('@/lib/api/locationService', () => ({
  locationService: {
    getClubLocations: jest.fn(),
    createLocation: jest.fn(),
    deactivateLocation: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

const mockLocationService = locationService as jest.Mocked<typeof locationService>;

// Mock window.confirm
const mockConfirm = jest.fn();
global.confirm = mockConfirm;

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

// Mock data
const mockLocations: LocationResponse[] = [
  {
    id: 1,
    clubId: 1,
    locationName: 'Main Office',
    locationCode: 'MAIN',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    timezone: 'America/New_York',
    contactEmail: 'main@club.com',
    contactPhone: '+1 (555) 123-4567',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    clubId: 1,
    locationName: 'Downtown Branch',
    locationCode: 'DT',
    address: '456 Oak Ave',
    city: 'Brooklyn',
    state: 'NY',
    country: 'USA',
    timezone: 'America/New_York',
    contactEmail: 'downtown@club.com',
    contactPhone: '+1 (555) 987-6543',
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    clubId: 1,
    locationName: 'Inactive Location',
    locationCode: 'INAC',
    address: '789 Pine Rd',
    city: 'Queens',
    state: 'NY',
    country: 'USA',
    timezone: 'America/New_York',
    contactEmail: 'inactive@club.com',
    contactPhone: '+1 (555) 456-7890',
    isActive: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
];

describe('LocationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockConfirm.mockReturnValue(true);
    window.location.href = '';
    mockLocationService.getClubLocations.mockResolvedValue(mockLocations);
  });

  describe('Loading State', () => {
    it('should show loading message initially', () => {
      mockLocationService.getClubLocations.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<LocationsPage />);

      expect(screen.getByText('Loading locations...')).toBeInTheDocument();
    });

    it('should load locations on mount', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        expect(mockLocationService.getClubLocations).toHaveBeenCalledWith(1);
      });
    });

    it('should hide loading message after data loads', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Loading locations...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Page Header', () => {
    it('should render page title', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /locations & chapters/i })).toBeInTheDocument();
      });
    });

    it('should render page description', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/manage multiple locations for your club/i)).toBeInTheDocument();
      });
    });

    it('should render Add Location button in header', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        const addButtons = screen.getAllByRole('button', { name: /add location/i });
        expect(addButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no locations', async () => {
      mockLocationService.getClubLocations.mockResolvedValue([]);

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/no locations yet/i)).toBeInTheDocument();
      });
    });

    it('should show empty state message', async () => {
      mockLocationService.getClubLocations.mockResolvedValue([]);

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/create your first location to start managing multiple chapters/i)).toBeInTheDocument();
      });
    });

    it('should render Add Location button in empty state', async () => {
      mockLocationService.getClubLocations.mockResolvedValue([]);

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /add location/i }).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Location List Rendering', () => {
    it('should render all locations', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
        expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
        expect(screen.getByText('Inactive Location')).toBeInTheDocument();
      });
    });

    it('should display location codes', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/code: main/i)).toBeInTheDocument();
        expect(screen.getByText(/code: dt/i)).toBeInTheDocument();
      });
    });

    it('should display location addresses', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/new york, ny, usa/i)).toBeInTheDocument();
        expect(screen.getByText(/brooklyn, ny, usa/i)).toBeInTheDocument();
      });
    });

    it('should display contact emails', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/main@club\.com/i)).toBeInTheDocument();
        expect(screen.getByText(/downtown@club\.com/i)).toBeInTheDocument();
      });
    });

    it('should display contact phones', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/\+1 \(555\) 123-4567/)).toBeInTheDocument();
        expect(screen.getByText(/\+1 \(555\) 987-6543/)).toBeInTheDocument();
      });
    });
  });

  describe('Status Badges', () => {
    it('should render Active badge for active locations', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        const activeBadges = screen.getAllByText('Active');
        expect(activeBadges.length).toBe(2);
      });
    });

    it('should render Inactive badge for inactive locations', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Inactive')).toBeInTheDocument();
      });
    });
  });

  describe('Manage Button', () => {
    it('should render Manage button for each location', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        const manageButtons = screen.getAllByRole('button', { name: /manage/i });
        expect(manageButtons.length).toBe(3);
      });
    });

    it('should navigate to location detail page on click', async () => {
      const user = userEvent.setup();
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const manageButtons = screen.getAllByRole('button', { name: /manage/i });
      await user.click(manageButtons[0]);

      expect(mockPush).toHaveBeenCalledWith('/admin/locations/1');
    });
  });

  describe('Deactivate Button', () => {
    const getCard = (name: string) =>
      screen.getByText(name).closest('[data-slot="card"]') as HTMLElement;

    it('should not render deactivate button for MAIN location', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      // MAIN location should have 1 button (Manage only)
      const buttons = getCard('Main Office').querySelectorAll('button');
      expect(buttons.length).toBe(1);
    });

    it('should render deactivate button for non-MAIN locations', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
      });

      // Non-MAIN location should have 2 buttons (Manage + Deactivate)
      const buttons = getCard('Downtown Branch').querySelectorAll('button');
      expect(buttons.length).toBe(2);
    });

    it('should show confirm dialog when deactivate clicked', async () => {
      const user = userEvent.setup();
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
      });

      const deactivateButton = getCard('Downtown Branch').querySelectorAll('button')[1];
      await user.click(deactivateButton);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to deactivate "Downtown Branch"?');
    });

    it('should call deactivate service on confirm', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      mockLocationService.deactivateLocation.mockResolvedValue({} as any);

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
      });

      const deactivateButton = getCard('Downtown Branch').querySelectorAll('button')[1];
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(mockLocationService.deactivateLocation).toHaveBeenCalledWith(2);
      });
    });

    it('should not call service when confirm cancelled', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
      });

      const deactivateButton = getCard('Downtown Branch').querySelectorAll('button')[1];
      await user.click(deactivateButton);

      expect(mockLocationService.deactivateLocation).not.toHaveBeenCalled();
    });

    it('should show success toast after deactivation', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      mockLocationService.deactivateLocation.mockResolvedValue({} as any);

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
      });

      const deactivateButton = getCard('Downtown Branch').querySelectorAll('button')[1];
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Location deactivated successfully');
      });
    });

    it('should reload locations after deactivation', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      mockLocationService.deactivateLocation.mockResolvedValue({} as any);

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
      });

      const initialCallCount = mockLocationService.getClubLocations.mock.calls.length;

      const deactivateButton = getCard('Downtown Branch').querySelectorAll('button')[1];
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(mockLocationService.getClubLocations).toHaveBeenCalledTimes(initialCallCount + 1);
      });
    });
  });

  describe('Create Dialog', () => {
    it('should open dialog when Add Location clicked', async () => {
      const user = userEvent.setup();
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should render dialog title', async () => {
      const user = userEvent.setup();
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Create New Location')).toBeInTheDocument();
      });
    });

    it('should render all form fields', async () => {
      const user = userEvent.setup();
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/location name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/location code/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^address$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^city$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^state$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^country$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
      });
    });

    it('should allow typing in form fields', async () => {
      const user = userEvent.setup();
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/location name/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/location name/i);
      await user.type(nameInput, 'Test Location');

      expect(nameInput).toHaveValue('Test Location');
    });

    it('should uppercase location code input', async () => {
      const user = userEvent.setup();
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/location code/i)).toBeInTheDocument();
      });

      const codeInput = screen.getByLabelText(/location code/i);
      await user.type(codeInput, 'test');

      expect(codeInput).toHaveValue('TEST');
    });

    it('should disable Create button when fields empty', async () => {
      const user = userEvent.setup();
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create location/i });
        expect(createButton).toBeDisabled();
      });
    });

    it('should enable Create button when required fields filled', async () => {
      const user = userEvent.setup();
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/location name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/location name/i), 'Test Location');
      await user.type(screen.getByLabelText(/location code/i), 'TST');

      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create location/i });
        expect(createButton).not.toBeDisabled();
      });
    });
  });

  describe('Create Location', () => {
    it('should call create service with form data', async () => {
      const user = userEvent.setup();
      mockLocationService.createLocation.mockResolvedValue({} as any);

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/location name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/location name/i), 'New Branch');
      await user.type(screen.getByLabelText(/location code/i), 'NB');
      await user.type(screen.getByLabelText(/^address$/i), '100 Test St');
      await user.type(screen.getByLabelText(/^city$/i), 'TestCity');

      const createButton = screen.getByRole('button', { name: /create location/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockLocationService.createLocation).toHaveBeenCalledWith(1, {
          locationName: 'New Branch',
          locationCode: 'NB',
          address: '100 Test St',
          city: 'TestCity',
          state: '',
          country: '',
          timezone: 'UTC',
          contactEmail: '',
          contactPhone: '',
        });
      });
    });

    it('should show success toast after creation', async () => {
      const user = userEvent.setup();
      mockLocationService.createLocation.mockResolvedValue({} as any);

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/location name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/location name/i), 'New Branch');
      await user.type(screen.getByLabelText(/location code/i), 'NB');

      const createButton = screen.getByRole('button', { name: /create location/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('Location created successfully');
      });
    });

    it('should close dialog after successful creation', async () => {
      const user = userEvent.setup();
      mockLocationService.createLocation.mockResolvedValue({} as any);

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/location name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/location name/i), 'New Branch');
      await user.type(screen.getByLabelText(/location code/i), 'NB');

      const createButton = screen.getByRole('button', { name: /create location/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should reload locations after creation', async () => {
      const user = userEvent.setup();
      mockLocationService.createLocation.mockResolvedValue({} as any);

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const initialCallCount = mockLocationService.getClubLocations.mock.calls.length;

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/location name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/location name/i), 'New Branch');
      await user.type(screen.getByLabelText(/location code/i), 'NB');

      const createButton = screen.getByRole('button', { name: /create location/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockLocationService.getClubLocations).toHaveBeenCalledTimes(initialCallCount + 1);
      });
    });

    it('should show in-flight state and disable buttons while creating', async () => {
      const user = userEvent.setup();
      // Keep the create request in-flight so the button stays in its loading state.
      mockLocationService.createLocation.mockReturnValue(new Promise(() => {}));

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/location name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/location name/i), 'New Branch');
      await user.type(screen.getByLabelText(/location code/i), 'NB');

      const createButton = screen.getByRole('button', { name: /create location/i });
      await user.click(createButton);

      // The button switches to the in-flight label and is disabled, preventing
      // duplicate creates from a double click.
      await waitFor(() => {
        expect(screen.getByText(/creating\.\.\./i)).toBeInTheDocument();
      });

      const creatingButton = screen.getByRole('button', { name: /creating/i });
      expect(creatingButton).toBeDisabled();

      const cancelButton = screen.getByRole('button', { name: /^cancel$/i });
      expect(cancelButton).toBeDisabled();

      // A second click while in-flight must not trigger another create call.
      await user.click(creatingButton);
      expect(mockLocationService.createLocation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle error loading locations', async () => {
      mockLocationService.getClubLocations.mockRejectedValue(new Error('Network error'));

      render(<LocationsPage />);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Failed to load locations');
      });
    });

    it('should handle error creating location', async () => {
      const user = userEvent.setup();
      mockLocationService.createLocation.mockRejectedValue({
        response: { data: { message: 'Location code already exists' } },
      });

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/location name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/location name/i), 'Duplicate');
      await user.type(screen.getByLabelText(/location code/i), 'MAIN');

      const createButton = screen.getByRole('button', { name: /create location/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Location code already exists');
      });
    });

    it('should handle error deactivating location', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      mockLocationService.deactivateLocation.mockRejectedValue({
        response: { data: { message: 'Location has active members' } },
      });

      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Downtown Branch')).toBeInTheDocument();
      });

      const downtownCard = screen.getByText('Downtown Branch').closest('[data-slot="card"]') as HTMLElement;
      const deactivateButton = downtownCard.querySelectorAll('button')[1];
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Location has active members');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /locations & chapters/i });
        expect(heading).toBeInTheDocument();
      });
    });

    it('should have labeled form inputs', async () => {
      const user = userEvent.setup();
      render(<LocationsPage />);

      await waitFor(() => {
        expect(screen.getByText('Main Office')).toBeInTheDocument();
      });

      const addButtons = screen.getAllByRole('button', { name: /add location/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByLabelText(/location name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/location code/i)).toBeInTheDocument();
      });
    });

    it('should have accessible buttons', async () => {
      render(<LocationsPage />);

      await waitFor(() => {
        const addButtons = screen.getAllByRole('button', { name: /add location/i });
        const manageButtons = screen.getAllByRole('button', { name: /manage/i });
        expect(addButtons.length).toBeGreaterThan(0);
        expect(manageButtons.length).toBeGreaterThan(0);
      });
    });
  });
});
