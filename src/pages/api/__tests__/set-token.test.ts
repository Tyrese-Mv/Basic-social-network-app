import handler from '../set-token';
import cookie from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.mock('cookie');

describe('set-token API', () => {
  let req: Partial<NextApiRequest>;
  let res: jest.Mocked<NextApiResponse>;

  const createRes = (): jest.Mocked<NextApiResponse> => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    setHeader: jest.fn(),
    end: jest.fn(),
  });

  beforeEach(() => {
    req = {
      method: 'POST',
      body: { token: 'abc' },
    };
    res = createRes();

    (cookie.serialize as jest.Mock).mockReturnValue('token=abc; Path=/;');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.NODE_ENV = 'test'; // Restore default env
  });

  it('sets cookie and returns 200 for POST with token', async () => {
    await handler(req as NextApiRequest, res);
    expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('token=abc'));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token set' });
  });

  it('returns 400 if token missing', async () => {
    req.body = {};
    await handler(req as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token required' });
  });

  it('sets secure flag in production', async () => {
    process.env.NODE_ENV = 'production';
    await handler(req as NextApiRequest, res);
    expect(cookie.serialize).toHaveBeenCalledWith(
      'token',
      'abc',
      expect.objectContaining({ secure: true })
    );
  });

  it('sets non-secure flag in non-production', async () => {
    process.env.NODE_ENV = 'development';
    await handler(req as NextApiRequest, res);
    expect(cookie.serialize).toHaveBeenCalledWith(
      'token',
      'abc',
      expect.objectContaining({ secure: false })
    );
  });

  it('sets correct maxAge', async () => {
    await handler(req as NextApiRequest, res);
    expect(cookie.serialize).toHaveBeenCalledWith(
      'token',
      'abc',
      expect.objectContaining({ maxAge: 60 * 60 * 24 * 7 }) // 1 week
    );
  });

  it('sets correct path and sameSite', async () => {
    await handler(req as NextApiRequest, res);
    expect(cookie.serialize).toHaveBeenCalledWith(
      'token',
      'abc',
      expect.objectContaining({ path: '/', sameSite: 'lax' })
    );
  });

  it('returns 405 for GET method', async () => {
    req.method = 'GET';
    await handler(req as NextApiRequest, res);
    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['POST']);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.end).toHaveBeenCalledWith('Method GET Not Allowed');
  });

  it('returns 405 for PUT method', async () => {
    req.method = 'PUT';
    await handler(req as NextApiRequest, res);
    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['POST']);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.end).toHaveBeenCalledWith('Method PUT Not Allowed');
  });

  it('handles empty body gracefully', async () => {
    req.body = undefined;
    await handler(req as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token required' });
  });

  it('handles null token gracefully', async () => {
    req.body = { token: null };
    await handler(req as NextApiRequest, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token required' });
  });
});
