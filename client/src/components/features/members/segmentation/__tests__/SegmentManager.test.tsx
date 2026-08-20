/**
 * SegmentManager tests — boundary-mock ONLY the HTTP layer (apiClient).
 *
 * The real memberSegmentationService, billingService, and the real UI
 * primitives all run. apiClient.get/post/put/delete are routed by URL.
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import apiClient from '@/services/apiClient';
import memberSegmentationService, {
  type MemberSegment,
} from '@/services/memberSegmentationService';
import SegmentManager from '../SegmentManager';

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const unlimitedBilling = {
  currentTier: 'Unlimited',
  hasActiveSubscription: true,
  memberCount: 1,
  memberLimit: Number.MAX_SAFE_INTEGER,
  canUpgrade: false,
};

function makeSegment(overrides: Partial<MemberSegment> = {}): MemberSegment {
  return {
    id: 1,
    clubId: 123,
    name: 'Active Members',
    description: 'All currently active members',
    filterCriteria: { status: 'Active' },
    memberCount: 42,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    ...overrides,
  };
}

/** Route apiClient.get: /billing/status -> billing; /segments -> segments fixture. */
function routeGet(segments: MemberSegment[] | (() => Promise<unknown>)) {
  mockGet.mockImplementation((url: string) => {
    if (url.includes('/billing/status')) {
      return Promise.resolve({ data: { ...unlimitedBilling } });
    }
    if (url.includes('/segments')) {
      if (typeof segments === 'function') {
        return segments();
      }
      return Promise.resolve({ data: segments });
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  // The service caches across instances — clear it so each test is isolated.
  memberSegmentationService.clearCache();
});

describe('SegmentManager', () => {
  it('loads and renders a list of segments with names and member counts', async () => {
    routeGet([
      makeSegment({ id: 1, name: 'Active Members', memberCount: 42 }),
      makeSegment({ id: 2, name: 'Overdue Dues', memberCount: 7, filterCriteria: { duesStatus: 'Overdue' } }),
    ]);

    render(<SegmentManager clubId={123} />);

    expect(await screen.findByText('Active Members')).toBeInTheDocument();
    expect(screen.getByText('Overdue Dues')).toBeInTheDocument();
    expect(screen.getByText('42 members')).toBeInTheDocument();
    expect(screen.getByText('7 members')).toBeInTheDocument();

    // The getSegments call goes to the club-scoped segments URL.
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/clubs/123/segments')
      );
    });
  });

  it('shows the empty state when no segments exist', async () => {
    routeGet([]);

    render(<SegmentManager clubId={123} />);

    expect(await screen.findByText(/no segments yet/i)).toBeInTheDocument();
  });

  it('shows an error state and recovers via Retry', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    let calls = 0;
    routeGet(() => {
      calls += 1;
      if (calls === 1) {
        return Promise.reject({ response: { status: 500 } });
      }
      return Promise.resolve({ data: [makeSegment({ name: 'Recovered Segment' })] });
    });

    render(<SegmentManager clubId={123} />);

    expect(await screen.findByText(/failed to load segments/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText('Recovered Segment')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('creates a segment and refreshes the list', async () => {
    let getCalls = 0;
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/billing/status')) {
        return Promise.resolve({ data: { ...unlimitedBilling } });
      }
      if (url.includes('/segments')) {
        getCalls += 1;
        // First load: just the existing segment. After create: include the new one.
        const data =
          getCalls === 1
            ? [makeSegment({ id: 1, name: 'Active Members' })]
            : [
                makeSegment({ id: 1, name: 'Active Members' }),
                makeSegment({ id: 2, name: 'VIP Members', memberCount: 5 }),
              ];
        return Promise.resolve({ data });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    mockPost.mockResolvedValue({
      data: makeSegment({ id: 2, name: 'VIP Members', memberCount: 5 }),
    });

    render(<SegmentManager clubId={123} />);

    await screen.findByText('Active Members');

    // Open the create dialog.
    await userEvent.click(screen.getByRole('button', { name: /create segment/i }));

    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText(/^name$/i);
    await userEvent.type(nameInput, 'VIP Members');

    await userEvent.click(within(dialog).getByRole('button', { name: /^create segment$/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/clubs/123/segments',
        expect.objectContaining({ name: 'VIP Members' })
      );
    });

    // List refreshed to include the new segment.
    expect(await screen.findByText('VIP Members')).toBeInTheDocument();
  });

  it('previews matching members and shows the total count', async () => {
    routeGet([makeSegment({ name: 'Active Members' })]);
    mockPost.mockResolvedValue({
      data: {
        totalCount: 17,
        members: [],
        currentPage: 1,
        pageSize: 25,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });

    render(<SegmentManager clubId={123} />);
    await screen.findByText('Active Members');

    await userEvent.click(screen.getByRole('button', { name: /create segment/i }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: /preview/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/clubs/123/segments/search',
        expect.objectContaining({ filterCriteria: expect.any(Object) })
      );
    });

    expect(await within(dialog).findByText(/17 members match/i)).toBeInTheDocument();
  });

  it('deletes a segment after confirmation', async () => {
    let getCalls = 0;
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/billing/status')) {
        return Promise.resolve({ data: { ...unlimitedBilling } });
      }
      if (url.includes('/segments')) {
        getCalls += 1;
        const data =
          getCalls === 1
            ? [makeSegment({ id: 9, name: 'Doomed Segment' })]
            : [];
        return Promise.resolve({ data });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    mockDelete.mockResolvedValue({ data: { success: true } });

    render(<SegmentManager clubId={123} />);
    await screen.findByText('Doomed Segment');

    await userEvent.click(screen.getByRole('button', { name: /delete segment/i }));

    const alert = await screen.findByRole('alertdialog');
    await userEvent.click(within(alert).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/clubs/123/segments/9');
    });

    expect(await screen.findByText(/no segments yet/i)).toBeInTheDocument();
  });

  it('edits a segment and refreshes', async () => {
    let getCalls = 0;
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/billing/status')) {
        return Promise.resolve({ data: { ...unlimitedBilling } });
      }
      if (url.includes('/segments')) {
        getCalls += 1;
        const data =
          getCalls === 1
            ? [makeSegment({ id: 3, name: 'Old Name' })]
            : [makeSegment({ id: 3, name: 'New Name' })];
        return Promise.resolve({ data });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    mockPut.mockResolvedValue({ data: makeSegment({ id: 3, name: 'New Name' }) });

    render(<SegmentManager clubId={123} />);
    await screen.findByText('Old Name');

    await userEvent.click(screen.getByRole('button', { name: /edit segment/i }));

    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText(/^name$/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Name');

    await userEvent.click(within(dialog).getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        '/clubs/123/segments/3',
        expect.objectContaining({ name: 'New Name' })
      );
    });

    expect(await screen.findByText('New Name')).toBeInTheDocument();
  });

  it('blocks create submission when name is empty', async () => {
    routeGet([makeSegment({ name: 'Active Members' })]);

    render(<SegmentManager clubId={123} />);
    await screen.findByText('Active Members');

    await userEvent.click(screen.getByRole('button', { name: /create segment/i }));
    const dialog = await screen.findByRole('dialog');

    const submit = within(dialog).getByRole('button', { name: /^create segment$/i });
    expect(submit).toBeDisabled();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('builds full filter criteria from the create form and sends it on create', async () => {
    routeGet([makeSegment({ name: 'Active Members' })]);
    mockPost.mockResolvedValue({ data: makeSegment({ id: 50, name: 'Power Users' }) });

    render(<SegmentManager clubId={123} />);
    await screen.findByText('Active Members');

    await userEvent.click(screen.getByRole('button', { name: /create segment/i }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.type(within(dialog).getByLabelText(/^name$/i), 'Power Users');
    await userEvent.type(
      within(dialog).getByLabelText(/description/i),
      'High-engagement attendees'
    );

    // Exercise the Dues Status select handler.
    await userEvent.click(within(dialog).getByLabelText(/dues status/i));
    await userEvent.click(await screen.findByRole('option', { name: 'Overdue' }));

    // Exercise the Engagement Level select handler.
    await userEvent.click(within(dialog).getByLabelText(/engagement level/i));
    await userEvent.click(await screen.findByRole('option', { name: 'high' }));

    await userEvent.type(within(dialog).getByLabelText(/join date from/i), '2026-01-01');
    await userEvent.type(within(dialog).getByLabelText(/join date to/i), '2026-12-31');
    await userEvent.type(within(dialog).getByLabelText(/^tags$/i), ' vip , board , ');
    await userEvent.type(within(dialog).getByLabelText(/event attendance min/i), '3');
    await userEvent.type(within(dialog).getByLabelText(/event attendance max/i), '20');

    await userEvent.click(within(dialog).getByRole('button', { name: /^create segment$/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/clubs/123/segments',
        expect.objectContaining({
          name: 'Power Users',
          description: 'High-engagement attendees',
          isActive: true,
          filterCriteria: expect.objectContaining({
            duesStatus: 'Overdue',
            engagementLevel: 'high',
            joinDateFrom: '2026-01-01',
            joinDateTo: '2026-12-31',
            tags: ['vip', 'board'],
            eventAttendanceMin: 3,
            eventAttendanceMax: 20,
          }),
        })
      );
    });
  });

  it('shows a form error when create fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    routeGet([makeSegment({ name: 'Active Members' })]);
    mockPost.mockRejectedValue({
      response: { status: 409 },
      message: 'A segment with this name already exists',
    });

    render(<SegmentManager clubId={123} />);
    await screen.findByText('Active Members');

    await userEvent.click(screen.getByRole('button', { name: /create segment/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/^name$/i), 'Dupe');
    await userEvent.click(within(dialog).getByRole('button', { name: /^create segment$/i }));

    expect(
      await within(dialog).findByText(/already exists/i)
    ).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('shows a form error when preview fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    routeGet([makeSegment({ name: 'Active Members' })]);
    mockPost.mockRejectedValue({ response: { status: 400 }, message: 'Invalid filter criteria' });

    render(<SegmentManager clubId={123} />);
    await screen.findByText('Active Members');

    await userEvent.click(screen.getByRole('button', { name: /create segment/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /preview/i }));

    expect(await within(dialog).findByText(/invalid filter criteria/i)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('pre-fills the edit form from existing segment criteria', async () => {
    routeGet([
      makeSegment({
        id: 7,
        name: 'Engaged VIPs',
        description: 'Top tier',
        isActive: false,
        filterCriteria: {
          status: 'Active',
          duesStatus: 'Current',
          engagementLevel: 'high',
          joinDateFrom: '2025-06-01',
          tags: ['vip', 'board'],
          eventAttendanceMin: 5,
          eventAttendanceMax: 50,
        },
      }),
    ]);

    render(<SegmentManager clubId={123} />);
    await screen.findByText('Engaged VIPs');

    await userEvent.click(screen.getByRole('button', { name: /edit segment/i }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByLabelText(/^name$/i)).toHaveValue('Engaged VIPs');
    expect(within(dialog).getByLabelText(/description/i)).toHaveValue('Top tier');
    expect(within(dialog).getByLabelText(/^tags$/i)).toHaveValue('vip, board');
    expect(within(dialog).getByLabelText(/event attendance min/i)).toHaveValue(5);
    expect(within(dialog).getByLabelText(/event attendance max/i)).toHaveValue(50);
    expect(within(dialog).getByLabelText(/join date from/i)).toHaveValue('2025-06-01');
  });

  it('shows a form error when edit fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    routeGet([makeSegment({ id: 4, name: 'Editable' })]);
    mockPut.mockRejectedValue({ response: { status: 404 }, message: 'Segment not found' });

    render(<SegmentManager clubId={123} />);
    await screen.findByText('Editable');

    await userEvent.click(screen.getByRole('button', { name: /edit segment/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /save changes/i }));

    expect(await within(dialog).findByText(/segment not found/i)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('surfaces an error when delete fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    routeGet([makeSegment({ id: 8, name: 'Stubborn Segment' })]);
    mockDelete.mockRejectedValue({ response: { status: 500 }, message: 'Server error' });

    render(<SegmentManager clubId={123} />);
    await screen.findByText('Stubborn Segment');

    await userEvent.click(screen.getByRole('button', { name: /delete segment/i }));
    const alert = await screen.findByRole('alertdialog');
    await userEvent.click(within(alert).getByRole('button', { name: /^delete$/i }));

    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('creates from the empty-state Create button with selected filters', async () => {
    let getCalls = 0;
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/billing/status')) {
        return Promise.resolve({ data: { ...unlimitedBilling } });
      }
      if (url.includes('/segments')) {
        getCalls += 1;
        const data =
          getCalls === 1 ? [] : [makeSegment({ id: 11, name: 'Lapsed' })];
        return Promise.resolve({ data });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });
    mockPost.mockResolvedValue({ data: makeSegment({ id: 11, name: 'Lapsed' }) });

    render(<SegmentManager clubId={123} />);
    await screen.findByText(/no segments yet/i);

    // The empty-state Create button (there are two: header + empty state).
    const createButtons = screen.getAllByRole('button', { name: /create segment/i });
    await userEvent.click(createButtons[createButtons.length - 1]);

    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText(/^name$/i), 'Lapsed');

    // Toggle the Active switch off to exercise that handler.
    await userEvent.click(within(dialog).getByLabelText(/^active$/i));

    // Choose a status from the Select to exercise onValueChange.
    await userEvent.click(within(dialog).getByLabelText(/^status$/i));
    await userEvent.click(await screen.findByRole('option', { name: 'Inactive' }));

    await userEvent.click(within(dialog).getByRole('button', { name: /^create segment$/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/clubs/123/segments',
        expect.objectContaining({
          name: 'Lapsed',
          isActive: false,
          filterCriteria: expect.objectContaining({ status: 'Inactive' }),
        })
      );
    });

    expect(await screen.findByText('Lapsed')).toBeInTheDocument();
  });

  it('disables Save Changes when the edit name is cleared', async () => {
    routeGet([makeSegment({ id: 6, name: 'Has Name' })]);

    render(<SegmentManager clubId={123} />);
    await screen.findByText('Has Name');

    await userEvent.click(screen.getByRole('button', { name: /edit segment/i }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.clear(within(dialog).getByLabelText(/^name$/i));

    expect(within(dialog).getByRole('button', { name: /save changes/i })).toBeDisabled();
    expect(mockPut).not.toHaveBeenCalled();
  });

  it('closes the create dialog via Cancel without submitting', async () => {
    routeGet([makeSegment({ name: 'Active Members' })]);

    render(<SegmentManager clubId={123} />);
    await screen.findByText('Active Members');

    await userEvent.click(screen.getByRole('button', { name: /create segment/i }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(mockPost).not.toHaveBeenCalled();
  });
});
