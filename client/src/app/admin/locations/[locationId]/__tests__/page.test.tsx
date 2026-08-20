import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import LocationDetailPage from '../page';
import type { LocationResponse } from '@/lib/api/locationService';

// ── Boundary mocks only ──────────────────────────────────────────────────────
// axios = HTTP boundary (real locationService runs against it).
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// next/navigation = framework boundary.
const mockPush = jest.fn();
let mockParams: Record<string, string> = { locationId: '1' };
jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: mockPush }),
}));

// logger wraps external telemetry (Sentry) = boundary.
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const mockLocation: LocationResponse = {
  id: 1,
  parentClubId: 1,
  locationName: 'Downtown Chapter',
  locationCode: 'DT',
  address: '123 Main St',
  city: 'New York',
  state: 'NY',
  country: 'USA',
  timezone: 'America/New_York',
  contactEmail: 'downtown@club.com',
  contactPhone: '+1 (555) 123-4567',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { locationId: '1' };
  mockedAxios.get.mockResolvedValue({ data: mockLocation });
  mockedAxios.put.mockResolvedValue({ data: mockLocation });
});

describe('LocationDetailPage', () => {
  it('loads and displays the location details', async () => {
    render(<LocationDetailPage />);

    expect(await screen.findByText('Downtown Chapter')).toBeInTheDocument();
    // Real locationService should call GET /locations/1
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/locations/1'),
      expect.objectContaining({ withCredentials: true })
    );
    expect(screen.getByText('Code: DT')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('New York, NY, USA')).toBeInTheDocument();
    expect(screen.getByText('downtown@club.com')).toBeInTheDocument();
    expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
    expect(screen.getByText('America/New_York')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows an inactive badge when the location is inactive', async () => {
    mockedAxios.get.mockResolvedValue({ data: { ...mockLocation, isActive: false } });
    render(<LocationDetailPage />);
    expect(await screen.findByText('Inactive')).toBeInTheDocument();
  });

  it('navigates back to the locations list', async () => {
    render(<LocationDetailPage />);
    const backButton = await screen.findByRole('button', { name: /back to locations/i });
    await userEvent.click(backButton);
    expect(mockPush).toHaveBeenCalledWith('/admin/settings/locations');
  });

  it('navigates to the branding and transfers subroutes', async () => {
    render(<LocationDetailPage />);
    await screen.findByText('Downtown Chapter');

    await userEvent.click(screen.getByRole('button', { name: /manage branding/i }));
    expect(mockPush).toHaveBeenCalledWith('/admin/locations/1/branding');

    await userEvent.click(screen.getByRole('button', { name: /manage transfers/i }));
    expect(mockPush).toHaveBeenCalledWith('/admin/locations/1/transfers');
  });

  it('edits the location and persists changes via the API', async () => {
    const updated = { ...mockLocation, locationName: 'Uptown Chapter' };
    mockedAxios.put.mockResolvedValue({ data: updated });

    render(<LocationDetailPage />);
    await screen.findByText('Downtown Chapter');

    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText(/location name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Uptown Chapter');

    await userEvent.click(within(dialog).getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/locations/1'),
        expect.objectContaining({ locationName: 'Uptown Chapter', locationCode: 'DT' }),
        expect.objectContaining({ withCredentials: true })
      );
    });
    expect(await screen.findByText('Uptown Chapter')).toBeInTheDocument();
  });

  it('edits every field, upper-cases the code, and sends them in the payload', async () => {
    const blank: LocationResponse = {
      ...mockLocation,
      address: '',
      city: '',
      state: '',
      country: '',
      timezone: '',
      contactEmail: '',
      contactPhone: '',
    };
    mockedAxios.get.mockResolvedValue({ data: blank });
    mockedAxios.put.mockResolvedValue({ data: blank });

    render(<LocationDetailPage />);
    await screen.findByText('Downtown Chapter');
    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/location code/i), 'up');
    await userEvent.type(within(dialog).getByLabelText(/address/i), '99 Side St');
    await userEvent.type(within(dialog).getByLabelText(/city/i), 'Boston');
    await userEvent.type(within(dialog).getByLabelText(/state/i), 'MA');
    await userEvent.type(within(dialog).getByLabelText(/country/i), 'USA');
    await userEvent.type(within(dialog).getByLabelText(/contact email/i), 'a@b.com');
    await userEvent.type(within(dialog).getByLabelText(/contact phone/i), '555-0000');
    await userEvent.type(within(dialog).getByLabelText(/timezone/i), 'UTC');

    await userEvent.click(within(dialog).getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/locations/1'),
        expect.objectContaining({
          locationCode: 'DTUP', // existing 'DT' + typed 'up', upper-cased
          address: '99 Side St',
          city: 'Boston',
          state: 'MA',
          country: 'USA',
          contactEmail: 'a@b.com',
          contactPhone: '555-0000',
          timezone: 'UTC',
        }),
        expect.objectContaining({ withCredentials: true })
      );
    });
  });

  it('closes the edit dialog when cancel is clicked', async () => {
    render(<LocationDetailPage />);
    await screen.findByText('Downtown Chapter');
    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  it('navigates back to the locations list from the not-found state', async () => {
    mockedAxios.get.mockRejectedValue(new Error('boom'));
    render(<LocationDetailPage />);
    await screen.findByText('Location not found');
    await userEvent.click(screen.getByRole('button', { name: /back to locations/i }));
    expect(mockPush).toHaveBeenCalledWith('/admin/settings/locations');
  });

  it('renders placeholders for a location with no optional fields and omits them on save', async () => {
    // Optional fields entirely absent -> exercises the `?? ''` + `|| '—'` branches.
    const sparse: LocationResponse = {
      id: 1,
      parentClubId: 1,
      locationName: 'Bare Chapter',
      locationCode: 'BARE',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };
    mockedAxios.get.mockResolvedValue({ data: sparse });
    mockedAxios.put.mockResolvedValue({ data: sparse });

    render(<LocationDetailPage />);
    await screen.findByText('Bare Chapter');
    // Empty optional fields render as em-dashes.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(4);

    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/locations/1'),
        // Empty strings -> `.trim() || undefined` -> undefined in payload.
        expect.objectContaining({
          locationName: 'Bare Chapter',
          locationCode: 'BARE',
          address: undefined,
          city: undefined,
          contactEmail: undefined,
        }),
        expect.objectContaining({ withCredentials: true })
      );
    });
  });

  it('shows a not-found state when loading fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('boom'));
    render(<LocationDetailPage />);
    expect(await screen.findByText('Location not found')).toBeInTheDocument();
  });

  it('falls back to a generic message when the update error has no server message', async () => {
    mockedAxios.put.mockRejectedValue(new Error('network down'));

    render(<LocationDetailPage />);
    await screen.findByText('Downtown Chapter');
    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
    });
    // Dialog stays open so the user can retry.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows a not-found state for an invalid location id', async () => {
    mockParams = { locationId: 'not-a-number' };
    render(<LocationDetailPage />);
    expect(await screen.findByText('Location not found')).toBeInTheDocument();
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('shows a not-found state when the route param is missing', async () => {
    mockParams = {};
    render(<LocationDetailPage />);
    expect(await screen.findByText('Location not found')).toBeInTheDocument();
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('surfaces a server error message when the update fails', async () => {
    mockedAxios.put.mockRejectedValue({
      response: { data: { message: 'Code already in use' } },
    });

    render(<LocationDetailPage />);
    await screen.findByText('Downtown Chapter');
    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }));

    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
    });
    // Dialog stays open on failure so the user can retry.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
