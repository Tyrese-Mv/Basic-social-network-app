import handler from '@/pages/api/feed';
import { getUserFromRequest } from '@/lib/auth';
import { ddb } from '@/lib/aws-config';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { QueryCommand } from '@aws-sdk/client-dynamodb';
import type { NextApiRequest, NextApiResponse } from 'next';

jest.mock('@/lib/auth');
jest.mock('@/lib/aws-config', () => ({
  ddb: { send: jest.fn() },
}));
jest.mock('@aws-sdk/util-dynamodb', () => ({
  unmarshall: jest.fn(),
}));

// Create a helper to mock req/res with proper types
function createMockRes(): jest.Mocked<NextApiResponse> {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown;

  return res as jest.Mocked<NextApiResponse>;
}

describe('/api/posts handler', () => {
  let mockReq: NextApiRequest;
  let mockRes: jest.Mocked<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = createMockRes();
  });

  it('should reject non-GET methods', async () => {
    mockReq = { method: 'POST' } as NextApiRequest;

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Method POST Not Allowed' });
  });

  it('should return 401 if user not authenticated', async () => {
    mockReq = { method: 'GET' } as NextApiRequest;
    (getUserFromRequest as jest.Mock).mockReturnValue(null);

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  it('should return posts from followed users, sorted by timestamp desc', async () => {
    mockReq = { method: 'GET' } as NextApiRequest;
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1', email: 'test@example.com' });

    // 1) Following list response: user 1 follows user 2 and 3
    (ddb.send as jest.Mock)
      .mockResolvedValueOnce({
        Items: [
          { SK: { S: 'FOLLOW#2' } },
          { SK: { S: 'FOLLOW#3' } },
        ],
      })
      // 2) Posts for user 2
      .mockResolvedValueOnce({
        Items: [
          { PK: { S: 'USER#2' }, SK: { S: 'POST#a' }, timestamp: { N: '100' }, Title: { S: 'U2 Post' } },
        ],
      })
      // 3) Posts for user 3
      .mockResolvedValueOnce({
        Items: [
          { PK: { S: 'USER#3' }, SK: { S: 'POST#b' }, timestamp: { N: '200' }, Title: { S: 'U3 Post' } },
        ],
      });

    (unmarshall as jest.Mock).mockImplementation((item) => ({
      pk: item.PK.S,
      sk: item.SK.S,
      title: item.Title.S,
      timestamp: Number(item.timestamp.N),
    }));

    await handler(mockReq, mockRes);

    expect(ddb.send).toHaveBeenCalledWith(expect.any(QueryCommand)); // following query
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      posts: [
        { pk: 'USER#3', sk: 'POST#b', title: 'U3 Post', timestamp: 200 },
        { pk: 'USER#2', sk: 'POST#a', title: 'U2 Post', timestamp: 100 },
      ],
    });
  });

  it('should return 500 if DynamoDB throws an error', async () => {
    mockReq = { method: 'GET' } as NextApiRequest;
    (getUserFromRequest as jest.Mock).mockReturnValue({ userId: '1', email: 'test@example.com' });
    (ddb.send as jest.Mock).mockRejectedValue(new Error('DynamoDB failure'));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
  });
});
