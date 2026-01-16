import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as glmService from './glmService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
const mockEnv = {
  ANTHROPIC_BASE_URL: 'https://test.api.com',
  ANTHROPIC_AUTH_TOKEN: 'test-token',
  ANTHROPIC_MODEL: 'GLM-4.7',
};

// Mock global constants
declare global {
  var __ANTHROPIC_BASE_URL__: string | undefined;
  var __ANTHROPIC_AUTH_TOKEN__: string | undefined;
  var __ANTHROPIC_MODEL__: string | undefined;
}

describe('glmService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up mock environment
    global.__ANTHROPIC_BASE_URL__ = mockEnv.ANTHROPIC_BASE_URL;
    global.__ANTHROPIC_AUTH_TOKEN__ = mockEnv.ANTHROPIC_AUTH_TOKEN;
    global.__ANTHROPIC_MODEL__ = mockEnv.ANTHROPIC_MODEL;
  });

  describe('validateTripIntent', () => {
    it('should validate trip intent correctly', async () => {
      const mockResponse = {
        content: [{ type: 'text', text: 'valid' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await glmService.validateTripIntent('我想去北京');

      expect(result).toBeDefined();
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(
        glmService.validateTripIntent('test')
      ).rejects.toThrow();
    });
  });

  describe('generateTravelPlanStream', () => {
    it('should be a function', () => {
      expect(typeof glmService.generateTravelPlanStream).toBe('function');
    });

    it('should return async generator', async () => {
      const mockStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode('data: {"type":"message","delta":{"text":"Hello"}}\n\n'));
          controller.close();
        },
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const generator = await glmService.generateTravelPlanStream(
        { prompt: 'test' },
        []
      );

      expect(generator).toBeDefined();
      expect(typeof generator[Symbol.asyncIterator]).toBe('function');
    });
  });
});
