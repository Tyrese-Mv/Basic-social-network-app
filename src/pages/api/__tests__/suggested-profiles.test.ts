import handler from '@/pages/api/suggested-profiles';
import { ddb } from '@/lib/aws-config';
import type { NextApiRequest, NextApiResponse } from 'next';
import { QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

jest.mock('@/lib/aws-config', () => ({ ddb: { send: jest.fn() } }));

function createMockRes(): jest.Mocked<NextApiResponse> {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown;
  return res as jest.Mocked<NextApiResponse>;
}

describe('/api/suggested-profiles handler', () => {
  let mockReq: NextApiRequest;
  let mockRes: jest.Mocked<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = createMockRes();
  });

  it('should return 400 if userId is missing', async () => {
    mockReq = { method: 'GET', query: {} } as unknown as NextApiRequest;
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing userId' });
  });

  it('should return 200 with filtered suggestions', async () => {
    mockReq = { method: 'GET', query: { userId: '1' } } as unknown as NextApiRequest;
    (ddb.send as jest.Mock)
      .mockResolvedValueOnce({ Items: [
        { userId: { S: '1' }, username: { S: 'a' }, email: { S: 'a@a.com' } },
        { userId: { S: '2' }, username: { S: 'b' }, email: { S: 'b@b.com' } },
        { userId: { S: '3' }, username: { S: 'c' }, email: { S: 'c@c.com' } },
      ] })
      .mockResolvedValueOnce({ Items: [
        { SK: { S: 'FOLLOW#2' } },
      ] });
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith([
      { userId: '3', username: 'c', email: 'c@c.com' }
    ]);
  });

  it('should return 200 with empty array if all followed', async () => {
    mockReq = { method: 'GET', query: { userId: '1' } } as unknown as NextApiRequest;
    (ddb.send as jest.Mock)
      .mockResolvedValueOnce({ Items: [
        { userId: { S: '1' }, username: { S: 'a' }, email: { S: 'a@a.com' } },
        { userId: { S: '2' }, username: { S: 'b' }, email: { S: 'b@b.com' } },
      ] })
      .mockResolvedValueOnce({ Items: [
        { SK: { S: 'FOLLOW#2' } },
      ] });
    await handler(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith([]);
  });

  it('should return 200 with all profiles if following none', async () => {
    mockReq = { method: 'GET', query: { userId: '1' } } as unknown as NextApiRequest;
    (ddb.send as jest.Mock)
      .mockResolvedValueOnce({ Items: [
        { userId: { S: '2' }, username: { S: 'b' }, email: { S: 'b@b.com' } },
        { userId: { S: '3' }, username: { S: 'c' }, email: { S: 'c@c.com' } },
      ] })
      .mockResolvedValueOnce({ Items: [] });
    await handler(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith([
      { userId: '2', username: 'b', email: 'b@b.com' },
      { userId: '3', username: 'c', email: 'c@c.com' }
    ]);
  });

  it('should handle DynamoDB error in allUsers', async () => {
    mockReq = { method: 'GET', query: { userId: '1' } } as unknown as NextApiRequest;
    (ddb.send as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });

  it('should handle DynamoDB error in followings', async () => {
    mockReq = { method: 'GET', query: { userId: '1' } } as unknown as NextApiRequest;
    (ddb.send as jest.Mock)
      .mockResolvedValueOnce({ Items: [
        { userId: { S: '2' }, username: { S: 'b' }, email: { S: 'b@b.com' } },
      ] })
      .mockRejectedValueOnce(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });

  it('should filter out self from suggestions', async () => {
    mockReq = { method: 'GET', query: { userId: '1' } } as unknown as NextApiRequest;
    (ddb.send as jest.Mock)
      .mockResolvedValueOnce({ Items: [
        { userId: { S: '1' }, username: { S: 'a' }, email: { S: 'a@a.com' } },
        { userId: { S: '2' }, username: { S: 'b' }, email: { S: 'b@b.com' } },
      ] })
      .mockResolvedValueOnce({ Items: [] });
    await handler(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith([
      { userId: '2', username: 'b', email: 'b@b.com' }
    ]);
  });

  it('should return 200 and empty array if no profiles', async () => {
    mockReq = { method: 'GET', query: { userId: '1' } } as unknown as NextApiRequest;
    (ddb.send as jest.Mock)
      .mockResolvedValueOnce({ Items: [] })
      .mockResolvedValueOnce({ Items: [] });
    await handler(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith([]);
  });

  it('should call ScanCommand and QueryCommand with correct params', async () => {
    mockReq = { method: 'GET', query: { userId: '1' } } as unknown as NextApiRequest;
    (ddb.send as jest.Mock)
      .mockResolvedValueOnce({ Items: [] })
      .mockResolvedValueOnce({ Items: [] });
    await handler(mockReq, mockRes);
    expect(ddb.send).toHaveBeenCalledWith(expect.any(ScanCommand));
    expect(ddb.send).toHaveBeenCalledWith(expect.any(QueryCommand));
  });

  it('should parse followedUserIds correctly', async () => {
    mockReq = { method: 'GET', query: { userId: '1' } } as unknown as NextApiRequest;
    (ddb.send as jest.Mock)
      .mockResolvedValueOnce({ Items: [
        { userId: { S: '2' }, username: { S: 'b' }, email: { S: 'b@b.com' } },
        { userId: { S: '3' }, username: { S: 'c' }, email: { S: 'c@c.com' } },
      ] })
      .mockResolvedValueOnce({ Items: [
        { SK: { S: 'FOLLOW#2' } },
        { SK: { S: 'FOLLOW#3' } },
      ] });
    await handler(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith([]);
  });
}); 