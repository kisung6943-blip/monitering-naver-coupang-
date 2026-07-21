import { Product, PriceLog } from "./types";

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "휘슬러프리미엄고무패킹",
    naverUrl: "https://search.shopping.naver.com/search/all?query=휘슬러프리미엄고무패킹",
    coupangUrl: "https://www.coupang.com/np/search?component=&q=휘슬러프리미엄고무패킹"
  },
  {
    id: "prod-2",
    name: "프리미엄고무패킹22+멤버레인",
    naverUrl: "https://search.shopping.naver.com/search/all?query=프리미엄고무패킹22+멤버레인",
    coupangUrl: "https://www.coupang.com/np/search?component=&q=프리미엄고무패킹22+멤버레인"
  },
  {
    id: "prod-3",
    name: "휘슬러보조손잡이(구형)",
    naverUrl: "https://search.shopping.naver.com/search/all?query=휘슬러보조손잡이(구형)",
    coupangUrl: "https://www.coupang.com/np/search?component=&q=휘슬러보조손잡이(구형)"
  },
  {
    id: "prod-4",
    name: "휘슬러멤버레인",
    naverUrl: "https://search.shopping.naver.com/search/all?query=휘슬러멤버레인",
    coupangUrl: "https://www.coupang.com/np/search?component=&q=휘슬러멤버레인"
  },
  {
    id: "prod-5",
    name: "휘슬러멤버레인1+1",
    naverUrl: "https://search.shopping.naver.com/search/all?query=휘슬러멤버레인1%2B1",
    coupangUrl: "https://www.coupang.com/np/search?component=&q=휘슬러멤버레인1+1"
  },
  {
    id: "prod-6",
    name: "휘슬러블루포인트멤버레인",
    naverUrl: "https://search.shopping.naver.com/search/all?query=휘슬러블루포인트멤버레인",
    coupangUrl: "https://www.coupang.com/np/search?component=&q=휘슬러블루포인트멤버레인"
  },
  {
    id: "prod-7",
    name: "휘슬러블루포인트멤버레인1+1",
    naverUrl: "https://search.shopping.naver.com/search/all?query=휘슬러블루포인트멤버레인1%2B1",
    coupangUrl: "https://www.coupang.com/np/search?component=&q=휘슬러블루포인트멤버레인1+1"
  },
  {
    id: "prod-8",
    name: "휘슬러 프리미엄3종세트",
    naverUrl: "https://search.shopping.naver.com/search/all?query=휘슬러프리미엄3종세트",
    coupangUrl: "https://www.coupang.com/np/search?component=&q=휘슬러프리미엄3종세트"
  },
  {
    id: "prod-9",
    name: "휘슬러고무패킹22(구형)",
    naverUrl: "https://search.shopping.naver.com/search/all?query=휘슬러고무패킹22(구형)",
    coupangUrl: "https://www.coupang.com/np/search?component=&q=휘슬러고무패킹22(구형)"
  },
  {
    id: "prod-10",
    name: "휘슬러유니메틱",
    naverUrl: "https://search.shopping.naver.com/search/all?query=휘슬러유니메틱",
    coupangUrl: "https://www.coupang.com/np/search?component=&q=휘슬러유니메틱"
  }
];

// Seed exact pricing as of 2026-07-10 (Korean Time/Metadata context)
const TODAY_PRICES: Record<string, {
  naverPrice: number;
  naverShipping: number;
  coupangSeller: string;
  coupangPrice: number;
  coupangShipping: number;
}> = {
  "prod-1": { naverPrice: 5890, naverShipping: 3000, coupangSeller: "휘슬러as", coupangPrice: 5900, coupangShipping: 3000 },
  "prod-2": { naverPrice: 6790, naverShipping: 3000, coupangSeller: "휘슬러as", coupangPrice: 6800, coupangShipping: 3000 },
  "prod-3": { naverPrice: 5800, naverShipping: 3000, coupangSeller: "레세나", coupangPrice: 5000, coupangShipping: 3500 },
  "prod-4": { naverPrice: 4300, naverShipping: 0, coupangSeller: "휘슬러as", coupangPrice: 1300, coupangShipping: 3000 },
  "prod-5": { naverPrice: 2650, naverShipping: 3000, coupangSeller: "휘슬러as", coupangPrice: 2660, coupangShipping: 3000 },
  "prod-6": { naverPrice: 3970, naverShipping: 3000, coupangSeller: "라인마인", coupangPrice: 3980, coupangShipping: 3000 },
  "prod-7": { naverPrice: 7940, naverShipping: 3000, coupangSeller: "", coupangPrice: 0, coupangShipping: 0 },
  "prod-8": { naverPrice: 12290, naverShipping: 3000, coupangSeller: "", coupangPrice: 0, coupangShipping: 0 },
  "prod-9": { naverPrice: 3990, naverShipping: 3000, coupangSeller: "휘슬러as", coupangPrice: 4000, coupangShipping: 3000 },
  "prod-10": { naverPrice: 4150, naverShipping: 3000, coupangSeller: "세계명품", coupangPrice: 4200, coupangShipping: 3000 }
};

export function generateHistoricalLogs(): PriceLog[] {
  const logs: PriceLog[] = [];
  const dates = [
    "2026-07-04",
    "2026-07-05",
    "2026-07-06",
    "2026-07-07",
    "2026-07-08",
    "2026-07-09",
    "2026-07-10"
  ];

  INITIAL_PRODUCTS.forEach((p) => {
    const todayData = TODAY_PRICES[p.id];
    if (!todayData) return;

    dates.forEach((date, index) => {
      // Create some realistic slight variation for previous dates
      const diffMultiplier = 1 + (index - 6) * 0.01; // slightly lower prices in past
      let navPrice = Math.round((todayData.naverPrice * diffMultiplier) / 10) * 10;
      let coupPrice = todayData.coupangPrice > 0 
        ? Math.round((todayData.coupangPrice * (diffMultiplier + (p.id === "prod-3" ? 0.02 : -0.005))) / 10) * 10
        : 0;

      // On the final date (2026-07-10), force the exact prices from the Excel sheet!
      if (date === "2026-07-10") {
        navPrice = todayData.naverPrice;
        coupPrice = todayData.coupangPrice;
      }

      const naverTotal = navPrice + (navPrice > 0 ? todayData.naverShipping : 0);
      const coupangTotal = coupPrice > 0 ? (coupPrice + todayData.coupangShipping) : 0;
      const difference = naverTotal - coupangTotal;

      logs.push({
        id: `log-${p.id}-${date}`,
        date,
        productId: p.id,
        naverPrice: navPrice,
        naverShipping: navPrice > 0 ? todayData.naverShipping : 0,
        naverTotal,
        coupangSeller: coupPrice > 0 ? todayData.coupangSeller : "",
        coupangPrice: coupPrice,
        coupangShipping: coupPrice > 0 ? todayData.coupangShipping : 0,
        coupangTotal,
        difference
      });
    });
  });

  return logs;
}
