import RemovedTemplatesPage from '../page';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('RemovedTemplatesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects removed templates route to communications', () => {
    RemovedTemplatesPage();

    expect(redirect).toHaveBeenCalledWith('/admin/communications');
  });
});
