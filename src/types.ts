export interface Product {
  id: string;
  name: string;
  naverUrl?: string;
  coupangUrl?: string;
  keywords?: string[];
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
  keywordRanks?: string[];
}
