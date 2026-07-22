export interface Product {
  id: string;
  name: string;
  naverUrl?: string;
  coupangUrl?: string;
  keywords?: string[];
  keywordVolumes?: string[];
}

export interface PriceLog {
  id: string;
  date: string; // YYYY-MM-DD
  productId: string;
  naverPrice: number;
  naverShipping: number;
  naverTotal: number;
  coupangSeller: string;
  coupangPrice: number;
  coupangShipping: number;
  coupangTotal: number;
  difference: number; // naverTotal - coupangTotal
  keywordRanks?: string[]; // Legacy/Naver ranks
  coupangKeywordRanks?: string[]; // Coupang specific ranks
  memo?: string; // Optional memo for the date
}
