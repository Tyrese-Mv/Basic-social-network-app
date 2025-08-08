import handler from '@/pages/api/login';
import { ddb } from '@/lib/aws-config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.mock('@/lib/aws-config', () => ({ ddb: { send: jest.fn() } }));
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

function createMockRes(): jest.Mocked<NextApiResponse> {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown;
  return res as jest.Mocked<NextApiResponse>;
}

describe('/api/login handler', () => {
  let mockReq: NextApiRequest;
  let mockRes: jest.Mocked<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = createMockRes();
  });

  it('should reject non-POST methods', async () => {
    mockReq = { method: 'GET' } as NextApiRequest;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method GET Not Allowed' });
  });

  it('should return 401 if user not found', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', password: 'pw' } } as NextApiRequest;
    (ddb.send as jest.Mock).mockResolvedValue({ Items: [] });
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('should return 401 if password does not match', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', password: 'pw' } } as NextApiRequest;
    (ddb.send as jest.Mock).mockResolvedValue({ Items: [{ hashedPassword: 'hash', userId: '1', email: 'a@a.com' }] });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('should return 200 and token if credentials valid', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', password: 'pw' } } as NextApiRequest;
    (ddb.send as jest.Mock).mockResolvedValue({ Items: [{ hashedPassword: 'hash', userId: '1', email: 'a@a.com' }] });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('token-123');
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ token: 'token-123' });
  });

  it('should handle DynamoDB errors', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', password: 'pw' } } as NextApiRequest;
    (ddb.send as jest.Mock).mockRejectedValue(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Something went wrong during login.' });
    spy.mockRestore();
  });

  it('should handle bcrypt errors', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', password: 'pw' } } as NextApiRequest;
    (ddb.send as jest.Mock).mockResolvedValue({ Items: [{ hashedPassword: 'hash', userId: '1', email: 'a@a.com' }] });
    (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('should call QueryCommand with correct params', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', password: 'pw' } } as NextApiRequest;
    (ddb.send as jest.Mock).mockResolvedValue({ Items: [{ hashedPassword: 'hash', userId: '1', email: 'a@a.com' }] });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('token-123');
    await handler(mockReq, mockRes);
    expect(ddb.send).toHaveBeenCalledWith(expect.any(QueryCommand));
  });

  it('should call jwt.sign with correct payload', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', password: 'pw' } } as NextApiRequest;
    (ddb.send as jest.Mock).mockResolvedValue({ Items: [{ hashedPassword: 'hash', userId: '1', email: 'a@a.com' }] });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('token-123');
    await handler(mockReq, mockRes);
    expect(jwt.sign).toHaveBeenCalledWith(
      { userId: '1', email: 'a@a.com' },
      expect.anything(),
      { expiresIn: '100h' }
    );
  });

  it('should return 405 for PUT method', async () => {
    mockReq = { method: 'PUT' } as NextApiRequest;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(405);
  });

  it('should handle missing email or password gracefully', async () => {
    mockReq = { method: 'POST', body: { email: '', password: '' } } as NextApiRequest;
    (ddb.send as jest.Mock).mockResolvedValue({ Items: [] });
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
}); 