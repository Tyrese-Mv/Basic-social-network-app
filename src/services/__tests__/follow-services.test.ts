import { checkFollow, createFollow, deleteFollow } from '../follow-services';

// Mock fetch globally
global.fetch = jest.fn();

describe('Follow Services', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore mocks after each test
    jest.restoreAllMocks();
  });

  describe('checkFollow', () => {
    it('should return true when user is following the profile', async () => {
      const mockResponse = { isFollowing: true };
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as unknown as Response);

      const result = await checkFollow('profile123');
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/follow?ProfileID=profile123',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    it('should return false when user is not following the profile', async () => {
      const mockResponse = { isFollowing: false };
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as unknown as Response);

      const result = await checkFollow('profile456');
      
      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/follow?ProfileID=profile456',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    it('should handle empty profile ID', async () => {
      const mockResponse = { isFollowing: false };
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as unknown as Response);

      const result = await checkFollow('');
      
      expect(result).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/follow?ProfileID=',
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    it('should handle special characters in profile ID', async () => {
      const mockResponse = { isFollowing: true };
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      const specialProfileId = 'profile-123_456@789';
      
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as unknown as Response);

      const result = await checkFollow(specialProfileId);
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/follow?ProfileID=${specialProfileId}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    it('should handle network errors gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(checkFollow('profile123')).rejects.toThrow('Network error');
    });
  });

  describe('createFollow', () => {
    it('should successfully create a follow relationship', async () => {
      const mockResponse = { success: true, message: 'Follow created' };
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as unknown as Response);

      const result = await createFollow('profile123');
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/follow?ProfileID=profile123',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    it('should handle empty profile ID in createFollow', async () => {
      const mockResponse = { success: false, error: 'Invalid profile ID' };
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as unknown as Response);

      const result = await createFollow('');
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/follow?ProfileID=',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    it('should handle API error responses', async () => {
      const mockResponse = { success: false, error: 'Already following' };
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as unknown as Response);

      const result = await createFollow('profile123');
      
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteFollow', () => {
    it('should successfully delete a follow relationship', async () => {
      const mockResponse = { success: true, message: 'Follow deleted' };
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as unknown as Response);

      const result = await deleteFollow('profile123');
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/follow?ProfileID=profile123',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    it('should handle empty profile ID in deleteFollow', async () => {
      const mockResponse = { success: false, error: 'Invalid profile ID' };
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as unknown as Response);

      const result = await deleteFollow('');
      
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/follow?ProfileID=',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });

    it('should handle API error responses in deleteFollow', async () => {
      const mockResponse = { success: false, error: 'Not following' };
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      } as unknown as Response);

      const result = await deleteFollow('profile123');
      
      expect(result).toEqual(mockResponse);
    });
  });
}); 