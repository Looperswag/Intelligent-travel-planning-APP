/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly ANTHROPIC_BASE_URL: string;
  readonly ANTHROPIC_AUTH_TOKEN: string;
  readonly ANTHROPIC_MODEL: string;
  readonly AMAP_API_KEY?: string;
  readonly PEXELS_API_KEY?: string;
  readonly PIXABAY_API_KEY?: string;
  readonly UNSPLASH_ACCESS_KEY?: string;
  readonly WEATHER_API_KEY?: string;
  readonly AMADEUS_API_KEY?: string;
  readonly AMADEUS_API_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
