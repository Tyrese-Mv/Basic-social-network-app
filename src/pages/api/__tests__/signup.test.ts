import handler from '@/pages/api/signup';
import { ddb } from '@/lib/aws-config';
import bcrypt from 'bcrypt';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.mock('@/lib/aws-config', () => ({ ddb: { send: jest.fn() } }));
jest.mock('bcrypt');
jest.mock('uuid', () => ({ v4: jest.fn() }));

function createMockRes(): jest.Mocked<NextApiResponse> {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    end: jest.fn(),
  } as unknown;
  return res as jest.Mocked<NextApiResponse>;
}

describe('/api/signup handler', () => {
  let mockReq: NextApiRequest;
  let mockRes: jest.Mocked<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = createMockRes();
  });

  it('should reject non-POST methods', async () => {
    mockReq = { method: 'GET' } as NextApiRequest;
    await handler(mockReq, mockRes);
    expect(mockRes.status).not.toHaveBeenCalledWith(201);
    expect(mockRes.end).toHaveBeenCalled();
  });

  it('should return 400 if fields missing', async () => {
    mockReq = { method: 'POST', body: { email: '', username: '', password: '' } } as NextApiRequest;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'All fields required' });
  });

  it('should create user and return 201', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', username: 'user', password: 'pw' } } as NextApiRequest;
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (ddb.send as jest.Mock).mockResolvedValue({});
    (uuidv4 as jest.Mock).mockReturnValue('uuid-123');
    await handler(mockReq, mockRes);
    expect(ddb.send).toHaveBeenCalledWith(expect.any(PutCommand));
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'User created', userId: 'uuid-123' });
  });

  it('should handle bcrypt errors', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', username: 'user', password: 'pw' } } as NextApiRequest;
    (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it('should handle DynamoDB errors', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', username: 'user', password: 'pw' } } as NextApiRequest;
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (ddb.send as jest.Mock).mockRejectedValue(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    spy.mockRestore();
  });

  it('should return 409 if user already exists', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', username: 'user', password: 'pw' } } as NextApiRequest;
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (ddb.send as jest.Mock).mockRejectedValue({ name: 'ConditionalCheckFailedException' });
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'User already exists' });
  });

  it('should call bcrypt.hash with correct password', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', username: 'user', password: 'pw' } } as NextApiRequest;
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (ddb.send as jest.Mock).mockResolvedValue({});
    await handler(mockReq, mockRes);
    expect(bcrypt.hash).toHaveBeenCalledWith('pw', 10);
  });

  it('should call ddb.send with PutCommand', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', username: 'user', password: 'pw' } } as NextApiRequest;
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (ddb.send as jest.Mock).mockResolvedValue({});
    await handler(mockReq, mockRes);
    expect(ddb.send).toHaveBeenCalledWith(expect.any(PutCommand));
  });

  it('should return 201 and correct userId', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', username: 'user', password: 'pw' } } as NextApiRequest;
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    (ddb.send as jest.Mock).mockResolvedValue({});
    (uuidv4 as jest.Mock).mockReturnValue('user-xyz');
    await handler(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'User created', userId: 'user-xyz' });
  });

  it('should return 405 for PUT method', async () => {
    mockReq = { method: 'PUT' } as NextApiRequest;
    await handler(mockReq, mockRes);
    expect(mockRes.status).not.toHaveBeenCalledWith(201);
    expect(mockRes.end).toHaveBeenCalled();
  });

  it('should return 400 if username is missing', async () => {
    mockReq = { method: 'POST', body: { email: 'a@a.com', username: '', password: 'pw' } } as NextApiRequest;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'All fields required' });
  });
}); 