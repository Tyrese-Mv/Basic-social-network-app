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

  it('should return posts if authenticated and DB query succeeds', async () => {
    mockReq = { method: 'GET' } as NextApiRequest;
    (getUserFromRequest as jest.Mock).mockReturnValue({ email: 'test@example.com' });

    const mockItems = [
      { PK: { S: 'USER#test@example.com' }, SK: { S: 'POST#1' }, Title: { S: 'Post 1' } },
      { PK: { S: 'USER#test@example.com' }, SK: { S: 'POST#2' }, Title: { S: 'Post 2' } },
    ];

    (ddb.send as jest.Mock).mockResolvedValue({ Items: mockItems });
    (unmarshall as jest.Mock).mockImplementation((item) => ({
      pk: item.PK.S,
      sk: item.SK.S,
      title: item.Title.S,
    }));

    await handler(mockReq, mockRes);

    expect(ddb.send).toHaveBeenCalledWith(expect.any(QueryCommand));
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      posts: [
        { pk: 'USER#test@example.com', sk: 'POST#1', title: 'Post 1' },
        { pk: 'USER#test@example.com', sk: 'POST#2', title: 'Post 2' },
      ],
    });
  });

  it('should return 500 if DynamoDB throws an error', async () => {
    mockReq = { method: 'GET' } as NextApiRequest;
    (getUserFromRequest as jest.Mock).mockReturnValue({ email: 'test@example.com' });
    (ddb.send as jest.Mock).mockRejectedValue(new Error('DynamoDB failure'));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
  });
});
