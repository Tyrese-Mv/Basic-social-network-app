import handler from '@/pages/api/follow';
import { getUserFromRequest } from '@/lib/auth';
import { ddb } from '@/lib/aws-config';
import { PutCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { ParsedUrlQuery } from 'querystring';

jest.mock('@/lib/auth');
jest.mock('@/lib/aws-config', () => ({ ddb: { send: jest.fn() } }));

function createMockRes(): jest.Mocked<NextApiResponse> {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    setHeader: jest.fn(),
    end: jest.fn(),
  } as unknown as jest.Mocked<NextApiResponse>;
}

function createMockReq(method: string, query: ParsedUrlQuery = {}): NextApiRequest {
  return {
    method,
    query,
    headers: {},
  } as unknown as NextApiRequest;
}

describe('/api/follow handler', () => {
  let mockReq: NextApiRequest;
  let mockRes: jest.Mocked<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = createMockRes();
  });

  it('should return 401 if not authenticated', async () => {
    mockReq = createMockReq('POST', { ProfileID: '2' });
    (getUserFromRequest as jest.Mock).mockReturnValue(null);

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should return 400 if ProfileID is missing', async () => {
    mockReq = createMockReq('POST');
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Missing ProfileID' });
  });

  it('should follow a user (POST)', async () => {
    mockReq = createMockReq('POST', { ProfileID: '2' });
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });
    (ddb.send as jest.Mock).mockResolvedValue({});

    await handler(mockReq, mockRes);

    expect(ddb.send).toHaveBeenCalledWith(expect.any(PutCommand));
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Followed successfully' });
  });

  it('should unfollow a user (DELETE)', async () => {
    mockReq = createMockReq('DELETE', { ProfileID: '2' });
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });
    (ddb.send as jest.Mock).mockResolvedValue({});

    await handler(mockReq, mockRes);

    expect(ddb.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unfollowed successfully' });
  });

  it('should check following status (GET)', async () => {
    mockReq = createMockReq('GET', { ProfileID: '2' });
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });
    (ddb.send as jest.Mock).mockResolvedValue({ Item: { foo: 'bar' } });

    await handler(mockReq, mockRes);

    expect(ddb.send).toHaveBeenCalledWith(expect.any(GetCommand));
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ isFollowing: true });
  });

  it('should return isFollowing false if not following', async () => {
    mockReq = createMockReq('GET', { ProfileID: '2' });
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });
    (ddb.send as jest.Mock).mockResolvedValue({});

    await handler(mockReq, mockRes);

    expect(mockRes.json).toHaveBeenCalledWith({ isFollowing: false });
  });

  it('should return 405 for unsupported method', async () => {
    mockReq = createMockReq('PUT', { ProfileID: '2' });
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Method PUT Not Allowed' });
  });

  it('should handle DynamoDB errors', async () => {
    mockReq = createMockReq('POST', { ProfileID: '2' });
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });
    (ddb.send as jest.Mock).mockRejectedValue(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Internal Server Error',
      error: expect.any(Error),
    });

    spy.mockRestore();
  });

  it('should use correct keys for follow/unfollow', async () => {
    mockReq = createMockReq('POST', { ProfileID: '2' });
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });
    (ddb.send as jest.Mock).mockResolvedValue({});

    await handler(mockReq, mockRes);

    const call = (ddb.send as jest.Mock).mock.calls[0][0];
    expect(call.input.Item.PK).toBe('USER#1');
    expect(call.input.Item.SK).toBe('FOLLOW#2');
  });


  it('should return 400 if ProfileID is empty string', async () => {
    mockReq = createMockReq('POST', { ProfileID: '' });
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1' });

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Missing ProfileID' });
  });
});
