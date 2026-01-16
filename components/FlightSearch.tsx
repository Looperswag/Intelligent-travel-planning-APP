import React, { useState } from 'react';
import {
  Search,
  Plane,
  Calendar,
  Users,
  ArrowRight,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
  X,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import {
  AmadeusService,
  FlightOffer,
  FlightInspirationResult,
  AirportInfo
} from '../services/amadeusService';

// ============== 类型定义 ==============

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  cabinClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
}

interface FlightSearchProps {
  onFlightSelect?: (flight: FlightOffer) => void;
  defaultOrigin?: string;
  defaultDestination?: string;
}

// ============== 舱位等级配置 ==============

const CABIN_CLASSES = [
  { value: 'ECONOMY', label: '经济舱', description: '实惠之选' },
  { value: 'PREMIUM_ECONOMY', label: '超级经济舱', description: '舒适升级' },
  { value: 'BUSINESS', label: '商务舱', description: '尊贵体验' },
  { value: 'FIRST', label: '头等舱', description: '奢华极致' },
] as const;

// ============== 航班搜索组件 ==============

export const FlightSearch: React.FC<FlightSearchProps> = ({
  onFlightSelect,
  defaultOrigin = '',
  defaultDestination = '',
}) => {
  // 表单状态
  const [searchParams, setSearchParams] = useState<FlightSearchParams>({
    origin: defaultOrigin,
    destination: defaultDestination,
    departureDate: '',
    returnDate: '',
    adults: 1,
    cabinClass: 'ECONOMY',
  });

  // 搜索状态
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FlightOffer[]>([]);
  const [inspirations, setInspirations] = useState<FlightInspirationResult[]>([]);

  // 机场搜索状态
  const [originSuggestions, setOriginSuggestions] = useState<AirportInfo[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<AirportInfo[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  // 错误状态
  const [error, setError] = useState<string | null>(null);

  // UI 状态
  const [activeTab, setActiveTab] = useState<'search' | 'inspire'>('inspire');

  // 搜索机场
  const searchAirports = async (keyword: string, type: 'origin' | 'dest') => {
    if (keyword.length < 2) return;

    try {
      const results = await AmadeusService.searchAirports(keyword);
      if (type === 'origin') {
        setOriginSuggestions(results.slice(0, 8));
        setShowOriginSuggestions(true);
      } else {
        setDestSuggestions(results.slice(0, 8));
        setShowDestSuggestions(true);
      }
    } catch (err) {
      console.error('Airport search failed:', err);
    }
  };

  // 搜索航班
  const searchFlights = async () => {
    if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
      setError('请填写完整的搜索信息');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const results = await AmadeusService.getFlightOffers({
        originLocationCode: searchParams.origin,
        destinationLocationCode: searchParams.destination,
        departureDate: searchParams.departureDate,
        returnDate: searchParams.returnDate,
        adults: searchParams.adults,
        travelClass: searchParams.cabinClass,
        max: 20,
        currencyCode: 'CNY',
      });

      setSearchResults(results);
      setActiveTab('search');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '搜索失败，请稍后重试';
      setError(message);
    } finally {
      setIsSearching(false);
    }
  };

  // 获取航班灵感
  const getFlightInspiration = async () => {
    if (!searchParams.origin || !searchParams.departureDate) {
      setError('请先选择出发地和出发日期');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const results = await AmadeusService.getFlightInspiration({
        origin: searchParams.origin,
        departureDate: searchParams.departureDate,
        viewBy: 'country',
      });

      setInspirations(results.slice(0, 12));
      setActiveTab('inspire');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取灵感失败，请稍后重试';
      setError(message);
    } finally {
      setIsSearching(false);
    }
  };

  // 选择机场
  const selectAirport = (airport: AirportInfo, type: 'origin' | 'dest') => {
    if (type === 'origin') {
      setSearchParams({ ...searchParams, origin: airport.iataCode });
      setShowOriginSuggestions(false);
    } else {
      setSearchParams({ ...searchParams, destination: airport.iataCode });
      setShowDestSuggestions(false);
    }
  };

  // 选择航班
  const selectFlight = (flight: FlightOffer) => {
    if (onFlightSelect) {
      onFlightSelect(flight);
    }
  };

  // 获取最小日期（今天）
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // 获取返程最小日期
  const getReturnMinDate = () => {
    if (!searchParams.departureDate) return getMinDate();
    const depDate = new Date(searchParams.departureDate);
    depDate.setDate(depDate.getDate() + 1);
    return depDate.toISOString().split('T')[0];
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">航班搜索</h2>
              <p className="text-blue-100 text-sm">Amadeus 实时航班数据</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('inspire')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'inspire'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Sparkles size={14} className="inline mr-1" />
              灵感
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'search'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Search size={14} className="inline mr-1" />
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="p-8 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* 出发地 */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              <MapPin size={12} className="inline mr-1" />
              出发地
            </label>
            <input
              type="text"
              value={searchParams.origin}
              onChange={(e) => {
                setSearchParams({ ...searchParams, origin: e.target.value });
                searchAirports(e.target.value, 'origin');
              }}
              onFocus={() => setShowOriginSuggestions(true)}
              placeholder="城市名或机场代码"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {showOriginSuggestions && originSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                {originSuggestions.map((airport) => (
                  <button
                    key={airport.iataCode}
                    onClick={() => selectAirport(airport, 'origin')}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{airport.name}</div>
                      <div className="text-sm text-gray-500">
                        {airport.address?.cityName}, {airport.address?.countryName}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {airport.iataCode}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 目的地 */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              <MapPin size={12} className="inline mr-1" />
              目的地
            </label>
            <input
              type="text"
              value={searchParams.destination}
              onChange={(e) => {
                setSearchParams({ ...searchParams, destination: e.target.value });
                searchAirports(e.target.value, 'dest');
              }}
              onFocus={() => setShowDestSuggestions(true)}
              placeholder="城市名或机场代码"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {showDestSuggestions && destSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                {destSuggestions.map((airport) => (
                  <button
                    key={airport.iataCode}
                    onClick={() => selectAirport(airport, 'dest')}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{airport.name}</div>
                      <div className="text-sm text-gray-500">
                        {airport.address?.cityName}, {airport.address?.countryName}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {airport.iataCode}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 出发日期 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              <Calendar size={12} className="inline mr-1" />
              出发日期
            </label>
            <input
              type="date"
              value={searchParams.departureDate}
              onChange={(e) => setSearchParams({ ...searchParams, departureDate: e.target.value })}
              min={getMinDate()}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* 返程日期 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              <Calendar size={12} className="inline mr-1" />
              返程日期（可选）
            </label>
            <input
              type="date"
              value={searchParams.returnDate}
              onChange={(e) => setSearchParams({ ...searchParams, returnDate: e.target.value })}
              min={getReturnMinDate()}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 乘客数量 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              <Users size={12} className="inline mr-1" />
              乘客数量
            </label>
            <select
              value={searchParams.adults}
              onChange={(e) => setSearchParams({ ...searchParams, adults: parseInt(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <option key={num} value={num}>
                  {num} 位成人
                </option>
              ))}
            </select>
          </div>

          {/* 舱位等级 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              舱位等级
            </label>
            <select
              value={searchParams.cabinClass}
              onChange={(e) => setSearchParams({ ...searchParams, cabinClass: e.target.value as any })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            >
              {CABIN_CLASSES.map((cls) => (
                <option key={cls.value} value={cls.value}>
                  {cls.label} - {cls.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Buttons */}
        <div className="flex gap-4">
          <button
            onClick={searchFlights}
            disabled={isSearching}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isSearching ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                搜索中...
              </>
            ) : (
              <>
                <Search size={20} />
                搜索航班
              </>
            )}
          </button>
          <button
            onClick={getFlightInspiration}
            disabled={isSearching}
            className="px-6 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <TrendingUp size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {activeTab === 'inspire' && inspirations.length > 0 && (
        <div className="p-8 bg-white border-t">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            <Sparkles size={18} className="inline mr-2 text-blue-600" />
            热门目的地推荐
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inspirations.map((inspiration, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => {
                  setSearchParams({
                    ...searchParams,
                    destination: inspiration.destination,
                  });
                  searchFlights();
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {inspiration.destination}
                  </span>
                  {inspiration.price && (
                    <span className="text-blue-600 font-bold">
                      ¥{inspiration.price.total}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  出发: {inspiration.departureDate}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <ArrowRight size={14} />
                  {inspiration.returnDate && `返程: ${inspiration.returnDate}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'search' && searchResults.length > 0 && (
        <div className="p-8 bg-white border-t max-h-96 overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            <Plane size={18} className="inline mr-2 text-blue-600" />
            搜索结果 ({searchResults.length})
          </h3>
          <div className="space-y-4">
            {searchResults.map((offer) => (
              <div
                key={offer.id}
                onClick={() => selectFlight(offer)}
                className="p-6 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-gray-900">
                      {AmadeusService.formatPrice(offer.price.total, offer.price.currency)}
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {offer.itineraries[0].segments.length === 1 ? '直飞' : `${offer.itineraries[0].segments.length} 段行程`}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {offer.itineraries[0].segments.map((s, i) => (
                      <span key={i}>
                        {i > 0 && ' → '}
                        {AmadeusService.getAirlineName(s.carrierCode)}
                      </span>
                    ))}
                  </span>
                </div>

                {offer.itineraries.map((itinerary, idx) => (
                  <div key={idx} className="space-y-2">
                    {itinerary.segments.map((segment, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-4 text-sm">
                        <div className="w-24">
                          <div className="font-medium text-gray-900">{segment.departure.iataCode}</div>
                          <div className="text-gray-500">
                            {new Date(segment.departure.at).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-px bg-gray-300 flex-1" />
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-gray-600">
                            {AmadeusService.formatDuration(segment.duration)}
                          </span>
                          <div className="h-px bg-gray-300 flex-1" />
                        </div>
                        <div className="w-24 text-right">
                          <div className="font-medium text-gray-900">{segment.arrival.iataCode}</div>
                          <div className="text-gray-500">
                            {new Date(segment.arrival.at).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightSearch;
