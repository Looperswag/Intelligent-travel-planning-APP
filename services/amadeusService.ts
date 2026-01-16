/**
 * Amadeus API 服务模块
 *
 * 功能：
 * 1. OAuth 2.0 认证（获取 access_token）
 * 2. Flight Inspiration Search - 航班灵感搜索
 * 3. Flight Offers Search - 航班报价搜索
 * 4. Flight Offers Price - 航班价格确认
 * 5. 航班预订和管理
 *
 * 文档：
 * - https://developers.amadeus.com/self-service/category/flights/api-doc/flight-inspiration-search/api-reference
 * - https://developers.amadeus.com/get-started/get-started-with-self-service-apis-335
 */

// ============== 类型定义 ==============

/**
 * Amadeus API 配置
 */
export interface AmadeusConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
}

/**
 * OAuth 访问令牌
 */
export interface AmadeusToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number; // 过期时间戳
}

/**
 * 航班灵感搜索参数
 */
export interface FlightInspirationParams {
  origin: string; // 出发地 IATA 代码（如 PEK）
  destination?: string; // 目的地（可选）
  departureDate?: string; // 出发日期（YYYY-MM-DD）
  oneWay?: boolean; // 是否单程
  duration?: string; // 停留时长（如 "--7" 表示最多7天）
  maxPrice?: number; // 最高价格
  viewBy?: string; // 结果视图类型
}

/**
 * 航班灵感搜索结果
 */
export interface FlightInspirationResult {
  type: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  price?: {
    total: number;
    currency: string;
  };
}

/**
 * 航班报价搜索参数
 */
export interface FlightOfferSearchParams {
  originLocationCode: string; // 出发地 IATA
  destinationLocationCode: string; // 目的地 IATA
  departureDate: string; // 出发日期 YYYY-MM-DD
  returnDate?: string; // 返回日期（往返票需要）
  adults?: number; // 成人数量，默认 1
  children?: number; // 儿童数量
  infants?: number; // 婴儿数量
  travelClass?: string; // 舱位等级 ECONOMY/PREMIUM_ECONOMY/BUSINESS/FIRST
  currencyCode?: string; // 货币代码
  maxPrice?: number; // 最高价格
  max?: number; // 返回结果数量
}

/**
 * 航班报价结果
 */
export interface FlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: FlightItinerary[];
  price: FlightPrice;
  pricingOptions: FlightPricingOptions;
  validatingAirlineCodes: string[];
  travelerPricings: TravelerPricing[];
}

export interface FlightItinerary {
  duration: string;
  segments: FlightSegment[];
}

export interface FlightSegment {
  departure: {
    iataCode: string;
    terminal: string;
    at: string;
  };
  arrival: {
    iataCode: string;
    terminal: string;
    at: string;
  };
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
  };
  operating: {
    carrierCode: string;
  };
  duration: string;
  numberOfStops: number;
  blacklistedInEU?: boolean;
}

export interface FlightPrice {
  currency: string;
  total: string;
  base: string;
  fees: FlightFee[];
  grandTotal: string;
}

export interface FlightFee {
  amount: string;
  type: string;
}

export interface FlightPricingOptions {
  fareType: string[];
  includedCheckedBagsOnly: boolean;
}

export interface TravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: {
    total: string;
    base: string;
    taxes: FlightTax[];
  };
}

export interface FlightTax {
  amount: string;
  code: string;
}

/**
 * 机场信息
 */
export interface AirportInfo {
  type: string;
  subType: string;
  name: string;
  iataCode: string;
  geoCode: {
    latitude: number;
    longitude: number;
  };
  address?: {
    cityName: string;
    cityCode: string;
    countryName: string;
    countryCode: string;
  };
  distance?: {
    value: number;
    unit: string;
  };
}

// ============== 配置 ==============

// 从环境变量获取 API 密钥
declare const __AMADEUS_API_KEY__: string | undefined;
declare const __AMADEUS_API_SECRET__: string | undefined;

const DEFAULT_CONFIG: AmadeusConfig = {
  apiKey: (typeof __AMADEUS_API_KEY__ !== 'undefined')
    ? __AMADEUS_API_KEY__
    : 'CBX1YTpKN7GtSbAiEKhHzna9FEmb8T9K',
  apiSecret: (typeof __AMADEUS_API_SECRET__ !== 'undefined')
    ? __AMADEUS_API_SECRET__
    : 'O7fL1zndBEIFsjcI',
  baseUrl: 'test.api.amadeus.com',
};

// ============== OAuth 认证管理 ==============

class AmadeusAuth {
  private token: AmadeusToken | null = null;
  private config: AmadeusConfig;

  constructor(config: AmadeusConfig) {
    this.config = config;
  }

  /**
   * 获取访问令牌
   */
  async getAccessToken(): Promise<string> {
    // 检查现有 token 是否有效
    if (this.token && this.token.expires_at > Date.now() + 60000) {
      return this.token.access_token;
    }

    // 获取新 token
    return this.fetchNewToken();
  }

  /**
   * 获取新的访问令牌
   */
  private async fetchNewToken(): Promise<string> {
    const url = `https://${this.config.baseUrl}/v1/security/oauth2/token`;
    const credentials = btoa(`${this.config.apiKey}:${this.config.apiSecret}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Amadeus auth failed: ${response.status} - ${error}`);
      }

      const data = await response.json();

      this.token = {
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
        expires_at: Date.now() + data.expires_in * 1000,
      };

      console.log('[Amadeus] New token obtained, expires at:', new Date(this.token.expires_at).toISOString());

      return this.token.access_token;
    } catch (error) {
      console.error('[Amadeus] Auth error:', error);
      throw error;
    }
  }

  /**
   * 清除令牌
   */
  clearToken(): void {
    this.token = null;
  }
}

// ============== Amadeus API 客户端 ==============

class AmadeusClient {
  private auth: AmadeusAuth;
  private config: AmadeusConfig;

  constructor(config?: Partial<AmadeusConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.auth = new AmadeusAuth(this.config);
  }

  /**
   * 发送认证请求
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const token = await this.auth.getAccessToken();
    const url = `https://${this.config.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Amadeus API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // ============== Flight Inspiration Search ==============

  /**
   * 航班灵感搜索
   * 查找从指定出发地出发的廉价航班目的地
   *
   * @param params 搜索参数
   * @returns 航班灵感列表
   */
  async getFlightInspiration(
    params: FlightInspirationParams
  ): Promise<FlightInspirationResult[]> {
    const queryParams = new URLSearchParams();

    queryParams.append('origin', params.origin);

    if (params.destination) {
      queryParams.append('destination', params.destination);
    }
    if (params.departureDate) {
      queryParams.append('departureDate', params.departureDate);
    }
    if (params.oneWay !== undefined) {
      queryParams.append('oneWay', String(params.oneWay));
    }
    if (params.duration) {
      queryParams.append('duration', params.duration);
    }
    if (params.maxPrice) {
      queryParams.append('maxPrice', String(params.maxPrice));
    }
    if (params.viewBy) {
      queryParams.append('viewBy', params.viewBy);
    }

    const endpoint = `/v1/shopping/flight-destinations?${queryParams.toString()}`;

    try {
      const data = await this.request<{ data: FlightInspirationResult[] }>(endpoint);
      return data.data || [];
    } catch (error) {
      console.error('[Amadeus] Flight inspiration search failed:', error);
      throw error;
    }
  }

  /**
   * 按国家查找航班灵感
   *
   * @param origin 出发地 IATA 代码
   * @param _destCountry 目的地国家代码（保留用于未来扩展）
   * @param departureDate 出发日期
   */
  async getFlightInspirationByCountry(
    origin: string,
    _destCountry: string,
    departureDate?: string
  ): Promise<FlightInspirationResult[]> {
    return this.getFlightInspiration({
      origin,
      departureDate,
      viewBy: 'country',
    });
  }

  /**
   * 按城市查找航班灵感
   */
  async getFlightInspirationByCity(
    origin: string,
    departureDate?: string
  ): Promise<FlightInspirationResult[]> {
    return this.getFlightInspiration({
      origin,
      departureDate,
      viewBy: 'city',
    });
  }

  // ============== Flight Offers Search ==============

  /**
   * 航班报价搜索
   *
   * @param params 搜索参数
   * @returns 航班报价列表
   */
  async getFlightOffers(
    params: FlightOfferSearchParams
  ): Promise<FlightOffer[]> {
    const queryParams = new URLSearchParams();

    queryParams.append('originLocationCode', params.originLocationCode);
    queryParams.append('destinationLocationCode', params.destinationLocationCode);
    queryParams.append('departureDate', params.departureDate);

    if (params.returnDate) {
      queryParams.append('returnDate', params.returnDate);
    }
    if (params.adults) {
      queryParams.append('adults', String(params.adults));
    }
    if (params.children) {
      queryParams.append('children', String(params.children));
    }
    if (params.infants) {
      queryParams.append('infants', String(params.infants));
    }
    if (params.travelClass) {
      queryParams.append('travelClass', params.travelClass);
    }
    if (params.currencyCode) {
      queryParams.append('currencyCode', params.currencyCode);
    }
    if (params.maxPrice) {
      queryParams.append('maxPrice', String(params.maxPrice));
    }
    if (params.max) {
      queryParams.append('max', String(params.max));
    }

    const endpoint = `/v2/shopping/flight-offers?${queryParams.toString()}`;

    try {
      const data = await this.request<{ data: FlightOffer[] }>(endpoint);
      return data.data || [];
    } catch (error) {
      console.error('[Amadeus] Flight offers search failed:', error);
      throw error;
    }
  }

  /**
   * 获取最便宜的航班
   *
   * @param params 搜索参数
   * @returns 最便宜的航班报价
   */
  async getCheapestFlight(
    params: FlightOfferSearchParams
  ): Promise<FlightOffer | null> {
    const offers = await this.getFlightOffers({
      ...params,
      max: 10,
    });

    if (offers.length === 0) return null;

    // 按价格排序
    const sorted = offers.sort((a, b) =>
      parseFloat(a.price.total) - parseFloat(b.price.total)
    );

    return sorted[0];
  }

  // ============== Airport & City Search ==============

  /**
   * 搜索机场和城市
   *
   * @param keyword 搜索关键词（城市名或机场代码）
   * @param subType 子类型过滤（CITY/AIRPORT）
   * @returns 机场/城市列表
   */
  async searchAirports(
    keyword: string,
    subType?: 'CITY' | 'AIRPORT'
  ): Promise<AirportInfo[]> {
    const queryParams = new URLSearchParams();

    queryParams.append('keyword', keyword);
    if (subType) {
      queryParams.append('subType', subType);
    }

    const endpoint = `/v1/reference-data/locations?${queryParams.toString()}`;

    try {
      const data = await this.request<{ data: AirportInfo[] }>(endpoint);
      return data.data || [];
    } catch (error) {
      console.error('[Amadeus] Airport search failed:', error);
      throw error;
    }
  }

  /**
   * 获取机场最近的城市
   *
   * @param keyword 关键词
   * @returns 城市列表
   */
  async searchCities(keyword: string): Promise<AirportInfo[]> {
    return this.searchAirports(keyword, 'CITY');
  }

  // ============== 辅助方法 ==============

  /**
   * 格式化价格
   */
  formatPrice(price: string, currency: string): string {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency,
    }).format(numPrice);
  }

  /**
   * 格式化飞行时长
   */
  formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return duration;

    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;

    if (hours === 0) return `${minutes}分钟`;
    if (minutes === 0) return `${hours}小时`;
    return `${hours}小时${minutes}分钟`;
  }

  /**
   * 获取航司名称映射
   */
  getAirlineName(code: string): string {
    const airlines: Record<string, string> = {
      CA: '中国国际航空',
      MU: '中国东方航空',
      CZ: '中国南方航空',
      HU: '海南航空',
      FM: '上海航空',
      ZH: '深圳航空',
      '3U': '四川航空',
      SC: '山东航空',
      JD: '首都航空',
      KN: '中国联合航空',
      // 国际航司
      NH: '全日空',
      JL: '日本航空',
      OZ: '韩亚航空',
      KE: '大韩航空',
      SQ: '新加坡航空',
      TG: '泰国国际航空',
      CX: '国泰航空',
      EK: '阿联酋航空',
      QR: '卡塔尔航空',
      LH: '汉莎航空',
      AF: '法国航空',
      BA: '英国航空',
      UA: '美联航',
      DL: '达美航空',
      AA: '美国航空',
      AC: '加拿大航空',
      QF: '澳洲航空',
    };
    return airlines[code] || code;
  }
}

// ============== 导出 ==============

// 创建默认客户端实例
export const AmadeusService = new AmadeusClient();

// 导出类以支持自定义配置
export { AmadeusClient };
