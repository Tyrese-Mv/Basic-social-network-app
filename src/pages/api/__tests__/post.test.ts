import handler from '@/pages/api/post';
import { getUserFromRequest } from '@/lib/auth';
import { ddb } from '@/lib/aws-config';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.mock('@/lib/auth');
jest.mock('@/lib/aws-config', () => ({ ddb: { send: jest.fn() } }));
jest.mock('uuid', () => ({ v4: jest.fn() }));

function createMockRes(): jest.Mocked<NextApiResponse> {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown;
  return res as jest.Mocked<NextApiResponse>;
}

describe('/api/post handler', () => {
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
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Method GET Not Allowed' });
  });

  it('should return 401 if not authenticated', async () => {
    mockReq = { method: 'POST', body: { content: 'hello' } } as NextApiRequest;
    (getUserFromRequest as jest.Mock).mockReturnValue(null);
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should create a post for authenticated user', async () => {
    mockReq = { method: 'POST', body: { content: 'hello' } } as NextApiRequest;
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });
    (ddb.send as jest.Mock).mockResolvedValue({});
    (uuidv4 as jest.Mock).mockReturnValue('uuid-123');
    await handler(mockReq, mockRes);
    expect(ddb.send).toHaveBeenCalledWith(expect.any(PutItemCommand));
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ postId: 'uuid-123', message: 'Post created' });
  });

  it('should handle DynamoDB errors', async () => {
    mockReq = { method: 'POST', body: { content: 'hello' } } as NextApiRequest;
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });
    (ddb.send as jest.Mock).mockRejectedValue(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to create post' });
    spy.mockRestore();
  });

  it('should use correct PK and SK in PutItemCommand', async () => {
    mockReq = { method: 'POST', body: { content: 'hello' } } as NextApiRequest;
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });
    (ddb.send as jest.Mock).mockResolvedValue({});
    await handler(mockReq, mockRes);
    const call = (ddb.send as jest.Mock).mock.calls[0][0];
    expect(call.input.Item.PK.S).toBe('USER#1');
    expect(call.input.Item.SK.S).toMatch(/^POST#/);
  });

  // it('should return 401 if getUserFromRequest throws', async () => {
  //   mockReq = { method: 'POST', body: { content: 'hello' } } as NextApiRequest;
  //   (getUserFromRequest as jest.Mock).mockImplementation(() => { throw new Error('fail'); });
  //   await handler(mockReq, mockRes);
  //   expect(mockRes.status).toHaveBeenCalledWith(401);
  // });

  it('should return 201 and correct postId', async () => {
    mockReq = { method: 'POST', body: { content: 'hello' } } as NextApiRequest;
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });
    (ddb.send as jest.Mock).mockResolvedValue({});
    (uuidv4 as jest.Mock).mockReturnValue('post-xyz');
    await handler(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith({ postId: 'post-xyz', message: 'Post created' });
  });

  it('should return 405 for PUT method', async () => {
    mockReq = { method: 'PUT' } as NextApiRequest;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(405);
  });

  it('should call ddb.send with PutItemCommand', async () => {
    mockReq = { method: 'POST', body: { content: 'hello' } } as NextApiRequest;
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });
    (ddb.send as jest.Mock).mockResolvedValue({});
    await handler(mockReq, mockRes);
    expect(ddb.send).toHaveBeenCalledWith(expect.any(PutItemCommand));
  });

  it('should handle missing content gracefully', async () => {
    mockReq = { method: 'POST', body: {} } as NextApiRequest;
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });
    (ddb.send as jest.Mock).mockResolvedValue({});
    await handler(mockReq, mockRes);
    expect(ddb.send).toHaveBeenCalledWith(expect.any(PutItemCommand));
    expect(mockRes.status).toHaveBeenCalledWith(201);
  });
}); 