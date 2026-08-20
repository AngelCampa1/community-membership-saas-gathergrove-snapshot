import RemovedCommunicationPage from '../page';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('RemovedCommunicationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects removed SMS route to communications', () => {
    RemovedCommunicationPage();

    expect(redirect).toHaveBeenCalledWith('/admin/communications');
  });
});
