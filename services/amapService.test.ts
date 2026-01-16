import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AmapService } from './amapService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AmapService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchPlace', () => {
    it('should return location data when search is successful', async () => {
      const mockResponse = {
        status: '1',
        pois: [
          {
            name: '故宫博物院',
            location: '116.397028,39.918058',
            address: '北京市东城区景山前街4号',
            cityname: '北京',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await AmapService.searchPlace('故宫', '北京');

      expect(result).toEqual({
        name: '故宫博物院',
        lat: 39.918058,
        lng: 116.397028,
        address: '北京市东城区景山前街4号',
        city: '北京',
      });
    });

    it('should return null when no results found', async () => {
      const mockResponse = {
        status: '1',
        pois: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await AmapService.searchPlace('不存在的地点', '北京');

      expect(result).toBeNull();
    });

    it('should return null and log error when API call fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await AmapService.searchPlace('故宫', '北京');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getWeather', () => {
    it('should return weather info when successful', async () => {
      const mockResponse = {
        status: '1',
        lives: [
          {
            weather: '晴',
            temperature: '25',
            windpower: '3',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await AmapService.getWeather('北京');

      expect(result).toBe('晴 25°C, 风力3级');
    });

    it('should return null when no weather data', async () => {
      const mockResponse = {
        status: '1',
        lives: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await AmapService.getWeather('北京');

      expect(result).toBeNull();
    });

    it('should return null and log error when API call fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await AmapService.getWeather('北京');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
