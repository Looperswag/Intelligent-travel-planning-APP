
// 高德地图 Web 服务 API 封装
// 文档: https://lbs.amap.com/api/webservice/guide/api/newroute
// 密钥配置: 通过环境变量 AMAP_API_KEY 配置

const AMAP_KEY = (import.meta.env.AMAP_API_KEY as string) || '';
const BASE_URL = 'https://restapi.amap.com/v3';

if (!AMAP_KEY) {
  console.error('[Amap] AMAP_API_KEY not configured. Please set it in your .env.local file.');
}

export interface AmapLocation {
  name: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
}

export const AmapService = {
  /**
   * 关键字搜索 API
   * https://lbs.amap.com/api/webservice/guide/api/newroute
   */
  async searchPlace(keyword: string, city: string): Promise<AmapLocation | null> {
    try {
      // 构造请求 URL (注意：前端直接调用可能存在 CORS 问题，通常建议在生产环境通过后端代理转发)
      // 但在高德 Web 服务中，部分接口支持直接调用，或者我们可以尝试
      const url = `${BASE_URL}/place/text?keywords=${encodeURIComponent(keyword)}&city=${encodeURIComponent(city)}&offset=1&page=1&extensions=all&key=${AMAP_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.pois && data.pois.length > 0) {
        const poi = data.pois[0];
        const [lngStr, latStr] = poi.location.split(',');
        return {
          name: poi.name,
          lat: parseFloat(latStr),
          lng: parseFloat(lngStr),
          address: poi.address,
          city: poi.cityname
        };
      }
      return null;
    } catch (error) {
      console.warn(`[Amap] Search failed for ${keyword}:`, error);
      return null;
    }
  },

  /**
   * 获取天气信息
   * https://lbs.amap.com/api/webservice/guide/api-advanced/weatherinfo
   */
  async getWeather(city: string): Promise<string | null> {
    try {
      const url = `${BASE_URL}/weather/weatherInfo?city=${encodeURIComponent(city)}&key=${AMAP_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === '1' && data.lives && data.lives.length > 0) {
        const live = data.lives[0];
        return `${live.weather} ${live.temperature}°C, 风力${live.windpower}级`;
      }
      return null;
    } catch (error) {
      console.error('[Amap] Weather fetch failed:', error);
      return null;
    }
  }
};
