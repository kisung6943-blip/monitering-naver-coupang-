import React, { useState, useEffect } from "react";
import { 
  Search, Plus, Trash2, Edit2, Sparkles, LineChart as ChartIcon, 
  Calendar, ArrowUpDown, TrendingDown, TrendingUp, CheckCircle, 
  ExternalLink, FileSpreadsheet, Download, Upload, Info, AlertTriangle, 
  RefreshCw, Layers, Check, X, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from "recharts";
import { Product, PriceLog } from "./types";
import { INITIAL_PRODUCTS, generateHistoricalLogs } from "./data";

export default function App() {
  // State for products and price logs
  const [products, setProducts] = useState<Product[]>([]);
  const [priceLogs, setPriceLogs] = useState<PriceLog[]>([]);
  
  // UI filter states
  const [selectedDate, setSelectedDate] = useState<string>("2026-07-10");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all, naver_cheaper, coupang_cheaper, same, no_coupang
  
  // Selected product for chart and quick logging
  const [selectedProductId, setSelectedProductId] = useState<string>("prod-1");
  
  // AI Parsing states
  const [aiInputText, setAiInputText] = useState<string>("");
  const [aiParsingPlatform, setAiParsingPlatform] = useState<"naver" | "coupang">("naver");
  const [isAiParsing, setIsAiParsing] = useState<boolean>(false);
  const [aiParseError, setAiParseError] = useState<string | null>(null);
  
  // Manual / AI Edit form states (for selected product & selected date)
  const [editNaverPrice, setEditNaverPrice] = useState<string>("");
  const [editNaverShipping, setEditNaverShipping] = useState<string>("");
  const [editCoupangSeller, setEditCoupangSeller] = useState<string>("");
  const [editCoupangPrice, setEditCoupangPrice] = useState<string>("");
  const [editCoupangShipping, setEditCoupangShipping] = useState<string>("");
  
  // Manage Products state
  const [isManagingProducts, setIsManagingProducts] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState<string>("");
  const [newProductNaverUrl, setNewProductNaverUrl] = useState<string>("");
  const [newProductCoupangUrl, setNewProductCoupangUrl] = useState<string>("");
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Initialize data from LocalStorage or seed data
  useEffect(() => {
    const storedProducts = localStorage.getItem("price_monitor_products");
    const storedLogs = localStorage.getItem("price_monitor_logs");

    if (storedProducts && storedLogs) {
      setProducts(JSON.parse(storedProducts));
      setPriceLogs(JSON.parse(storedLogs));
    } else {
      // Seed initial data
      setProducts(INITIAL_PRODUCTS);
      const initialLogs = generateHistoricalLogs();
      setPriceLogs(initialLogs);
      localStorage.setItem("price_monitor_products", JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem("price_monitor_logs", JSON.stringify(initialLogs));
    }
  }, []);

  // Sync state changes with localStorage
  const saveToLocalStorage = (updatedProducts: Product[], updatedLogs: PriceLog[]) => {
    setProducts(updatedProducts);
    setPriceLogs(updatedLogs);
    localStorage.setItem("price_monitor_products", JSON.stringify(updatedProducts));
    localStorage.setItem("price_monitor_logs", JSON.stringify(updatedLogs));
  };

  // Toast Helper
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Populate input fields when selected product or date changes
  useEffect(() => {
    const activeLog = priceLogs.find(
      (log) => log.productId === selectedProductId && log.date === selectedDate
    );
    if (activeLog) {
      setEditNaverPrice(activeLog.naverPrice.toString());
      setEditNaverShipping(activeLog.naverShipping.toString());
      setEditCoupangSeller(activeLog.coupangSeller || "");
      setEditCoupangPrice(activeLog.coupangPrice === 0 ? "" : activeLog.coupangPrice.toString());
      setEditCoupangShipping(activeLog.coupangShipping === 0 ? "" : activeLog.coupangShipping.toString());
    } else {
      setEditNaverPrice("");
      setEditNaverShipping("");
      setEditCoupangSeller("");
      setEditCoupangPrice("");
      setEditCoupangShipping("");
    }
    setAiInputText("");
    setAiParseError(null);
  }, [selectedProductId, selectedDate, priceLogs]);

  // Compute logs for the selected date
  const currentLogsForDate = products.map((prod) => {
    const log = priceLogs.find((l) => l.productId === prod.id && l.date === selectedDate);
    if (log) {
      return { ...prod, ...log, id: prod.id, logId: log.id, hasLog: true };
    }
    return {
      ...prod,
      hasLog: false,
      naverPrice: 0,
      naverShipping: 0,
      naverTotal: 0,
      coupangSeller: "",
      coupangPrice: 0,
      coupangShipping: 0,
      coupangTotal: 0,
      difference: 0,
      keywordRanks: [],
    };
  });

  // Filter & Search logic
  const filteredLogs = currentLogsForDate.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "naver_cheaper") {
      return matchesSearch && item.hasLog && item.coupangPrice > 0 && item.difference < 0;
    }
    if (statusFilter === "coupang_cheaper") {
      return matchesSearch && item.hasLog && item.coupangPrice > 0 && item.difference > 0;
    }
    if (statusFilter === "same") {
      return matchesSearch && item.hasLog && item.coupangPrice > 0 && item.difference === 0;
    }
    if (statusFilter === "no_coupang") {
      return matchesSearch && (!item.hasLog || item.coupangPrice === 0);
    }
    return matchesSearch;
  });

  // Global metrics for selected date
  const metrics = (() => {
    const validLogs = currentLogsForDate.filter(l => l.hasLog);
    const withCoupang = validLogs.filter(l => l.coupangPrice > 0);
    
    const naverWins = withCoupang.filter(l => l.difference < 0).length;
    const coupangWins = withCoupang.filter(l => l.difference > 0).length;
    const samePrice = withCoupang.filter(l => l.difference === 0).length;
    const noCoupang = currentLogsForDate.filter(l => !l.hasLog || l.coupangPrice === 0).length;

    let totalDiff = 0;
    withCoupang.forEach(l => {
      totalDiff += l.difference;
    });
    const avgDiff = withCoupang.length > 0 ? Math.round(totalDiff / withCoupang.length) : 0;

    return {
      totalProducts: products.length,
      naverWins,
      coupangWins,
      samePrice,
      noCoupang,
      avgDiff,
    };
  })();

  // Handle saving prices manually
  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    const navPrice = parseInt(editNaverPrice) || 0;
    const navShip = parseInt(editNaverShipping) || 0;
    const coupPrice = parseInt(editCoupangPrice) || 0;
    const coupShip = parseInt(editCoupangShipping) || 0;
    
    const naverTotal = navPrice > 0 ? (navPrice + navShip) : 0;
    const coupangTotal = coupPrice > 0 ? (coupPrice + coupShip) : 0;
    const difference = naverTotal - coupangTotal;

    const existingLogIndex = priceLogs.findIndex(
      (log) => log.productId === selectedProductId && log.date === selectedDate
    );

    const updatedLogs = [...priceLogs];
    const newLog: PriceLog = {
      id: `log-${selectedProductId}-${selectedDate}`,
      date: selectedDate,
      productId: selectedProductId,
      naverPrice: navPrice,
      naverShipping: navShip,
      naverTotal,
      coupangSeller: editCoupangSeller.trim(),
      coupangPrice: coupPrice,
      coupangShipping: coupShip,
      coupangTotal,
      difference,
      keywordRanks: existingLogIndex >= 0 ? priceLogs[existingLogIndex].keywordRanks : [],
    };

    if (existingLogIndex >= 0) {
      updatedLogs[existingLogIndex] = newLog;
    } else {
      updatedLogs.push(newLog);
    }

    saveToLocalStorage(products, updatedLogs);
    showToast("가격 모니터링 로그가 저장되었습니다.");
  };

  const handleKeywordNameChange = (productId: string, index: number, value: string) => {
    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        const keywords = [...(p.keywords || Array(6).fill(""))];
        keywords[index] = value;
        return { ...p, keywords };
      }
      return p;
    });
    setProducts(updatedProducts);
    localStorage.setItem("price_monitor_products", JSON.stringify(updatedProducts));
  };

  const handleKeywordRankChange = (productId: string, index: number, value: string) => {
    const existingLogIndex = priceLogs.findIndex(
      (log) => log.productId === productId && log.date === selectedDate
    );
    const updatedLogs = [...priceLogs];
    
    if (existingLogIndex >= 0) {
      const log = { ...updatedLogs[existingLogIndex] };
      const ranks = [...(log.keywordRanks || Array(6).fill(""))];
      ranks[index] = value;
      log.keywordRanks = ranks;
      updatedLogs[existingLogIndex] = log;
    } else {
      const ranks = Array(6).fill("");
      ranks[index] = value;
      const newLog: PriceLog = {
        id: `log-${productId}-${selectedDate}`,
        date: selectedDate,
        productId,
        naverPrice: 0, naverShipping: 0, naverTotal: 0,
        coupangSeller: "", coupangPrice: 0, coupangShipping: 0, coupangTotal: 0,
        difference: 0,
        keywordRanks: ranks
      };
      updatedLogs.push(newLog);
    }
    setPriceLogs(updatedLogs);
    localStorage.setItem("price_monitor_logs", JSON.stringify(updatedLogs));
  };

  const handleMemoChange = (productId: string, date: string, value: string) => {
    const existingLogIndex = priceLogs.findIndex(
      (log) => log.productId === productId && log.date === date
    );
    const updatedLogs = [...priceLogs];
    
    if (existingLogIndex >= 0) {
      const log = { ...updatedLogs[existingLogIndex] };
      log.memo = value;
      updatedLogs[existingLogIndex] = log;
    } else {
      const newLog: PriceLog = {
        id: `log-${productId}-${date}`,
        date: date,
        productId,
        naverPrice: 0, naverShipping: 0, naverTotal: 0,
        coupangSeller: "", coupangPrice: 0, coupangShipping: 0, coupangTotal: 0,
        difference: 0,
        keywordRanks: [],
        memo: value
      };
      updatedLogs.push(newLog);
    }
    setPriceLogs(updatedLogs);
    localStorage.setItem("price_monitor_logs", JSON.stringify(updatedLogs));
  };


  // AI Parser trigger
  const handleAiParse = async () => {
    if (!aiInputText.trim()) {
      setAiParseError("분석할 텍스트를 입력해 주세요.");
      return;
    }

    setIsAiParsing(true);
    setAiParseError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API 키가 설정되지 않았습니다. .env 파일에 VITE_GEMINI_API_KEY를 추가해주세요.");
      }
      
      const prompt = `You are an expert price auditor. Analyze the following raw copied text from a Korean e-commerce site (Naver Shopping or Coupang). 
Extract the primary selling price, shipping fee, seller name, product name, and the platform.

Text to analyze:
"""
${aiInputText}
"""

Return ONLY a valid JSON string (no markdown formatting, no \`\`\`json) with exactly these fields:
{
  "platform": "naver" | "coupang" | "unknown",
  "price": number (the primary selling price, digits only),
  "shipping": number (the shipping fee, digits only, 0 if free),
  "seller": string (the seller name, if found),
  "productName": string (the parsed product name)
}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "AI 분석 서버(Google)와의 통신에 실패했습니다.");
      }

      const rawData = await response.json();
      const generatedText = rawData.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      let data;
      try {
        const cleanedText = generatedText.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
        data = JSON.parse(cleanedText);
      } catch (parseErr) {
        throw new Error("AI가 응답한 데이터를 분석할 수 없습니다.");
      }
      data.success = true;

      if (data.success) {
        if (data.platform === "naver") {
          setEditNaverPrice(data.price ? data.price.toString() : "0");
          setEditNaverShipping(data.shipping ? data.shipping.toString() : "0");
          showToast("네이버 가격을 AI가 파싱하여 입력했습니다!");
        } else if (data.platform === "coupang") {
          setEditCoupangPrice(data.price ? data.price.toString() : "0");
          setEditCoupangShipping(data.shipping ? data.shipping.toString() : "0");
          setEditCoupangSeller(data.seller || "쿠팡");
          showToast("쿠팡 가격을 AI가 파싱하여 입력했습니다!");
        } else {
          // If unsure, prompt user where to apply or pre-fill both
          if (aiParsingPlatform === "naver") {
            setEditNaverPrice(data.price ? data.price.toString() : "0");
            setEditNaverShipping(data.shipping ? data.shipping.toString() : "0");
            showToast("네이버 폼으로 AI 추출가격을 적용했습니다.");
          } else {
            setEditCoupangPrice(data.price ? data.price.toString() : "0");
            setEditCoupangShipping(data.shipping ? data.shipping.toString() : "0");
            setEditCoupangSeller(data.seller || "타판매자");
            showToast("쿠팡 폼으로 AI 추출가격을 적용했습니다.");
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setAiParseError(err.message || "서버 통신에 실패했습니다.");
    } finally {
      setIsAiParsing(false);
    }
  };

  // Add new product
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      id: newId,
      name: newProductName.trim(),
      naverUrl: newProductNaverUrl.trim() || undefined,
      coupangUrl: newProductCoupangUrl.trim() || undefined,
    };

    const updatedProducts = [...products, newProduct];
    saveToLocalStorage(updatedProducts, priceLogs);
    
    // Auto select the new product
    setSelectedProductId(newId);
    
    // Reset fields
    setNewProductName("");
    setNewProductNaverUrl("");
    setNewProductCoupangUrl("");
    setIsManagingProducts(false);
    showToast("새로운 품목이 추가되었습니다.");
  };

  // Delete product
  const handleDeleteProduct = (productId: string) => {
    if (confirm("정말로 이 품목과 연동된 가격 모니터링 로그를 삭제하시겠습니까?")) {
      const updatedProducts = products.filter((p) => p.id !== productId);
      const updatedLogs = priceLogs.filter((l) => l.productId !== productId);
      
      saveToLocalStorage(updatedProducts, updatedLogs);
      if (selectedProductId === productId) {
        setSelectedProductId(updatedProducts[0]?.id || "");
      }
      showToast("품목이 성공적으로 삭제되었습니다.");
    }
  };

  // Export database as JSON
  const handleExportData = () => {
    const dataStr = JSON.stringify({ products, priceLogs }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `price_monitor_backup_${selectedDate}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showToast("백업 파일이 내보내기 되었습니다.");
  };

  // Import database from JSON file
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.products && parsed.priceLogs) {
            saveToLocalStorage(parsed.products, parsed.priceLogs);
            showToast("백업 데이터가 성공적으로 복구되었습니다!");
          } else {
            showToast("올바른 백업 형식이 아닙니다.", "error");
          }
        } catch (err) {
          showToast("파일을 읽는 과정에서 오류가 발생했습니다.", "error");
        }
      };
    }
  };

  // Fill sample text for testing the AI parser
  const fillSampleText = (platform: "naver" | "coupang") => {
    setAiParsingPlatform(platform);
    if (platform === "naver") {
      setAiInputText(
        `[네이버 스마트스토어 공식몰]\n품명: 휘슬러 프리미엄 고무패킹 22cm 신형\n고객평점: 4.8/5\n정상가: 9,000원\n오늘 하루 특가 할인 35% 적용\n최종 결제가: 5,890원\n배송비: 3,000원 (CJ대한통운)\n\n※ 해당 제품은 휘슬러 정품 고무씰을 사용하여 수명이 깁니다.`
      );
    } else {
      setAiInputText(
        `쿠팡 추천 상품!\n휘슬러 호환 보조손잡이 (구형 모델 호환용)\n판매가: 5,000원\n로켓배송 무료체험 가능\n일반 배송비: 3,500원\n판매 스토어명: 레세나 홀딩스\n배송 예정: 내일 오전 7시 전 도착 보장`
      );
    }
  };

  // Prepare chart data for the selected product
  const getChartData = () => {
    const productLogs = priceLogs
      .filter((l) => l.productId === selectedProductId)
      .sort((a, b) => a.date.localeCompare(b.date));

    return productLogs.map((log) => ({
      date: log.date.substring(5), // MM-DD for cleaner view
      "네이버 합계": log.naverTotal > 0 ? log.naverTotal : null,
      "쿠팡 합계": log.coupangTotal > 0 ? log.coupangTotal : null,
    }));
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const chartData = getChartData();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans" id="app-root">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium ${
              toastMessage.type === "success" 
                ? "bg-emerald-600 text-white" 
                : "bg-rose-600 text-white"
            }`}
            id="toast-notification"
          >
            {toastMessage.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800" id="main-header">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-slate-950 p-2.5 rounded-xl font-bold shadow-md flex items-center justify-center">
              <FileSpreadsheet size={24} className="text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" id="header-title">네이버 & 쿠팡 가격 모니터링</h1>
              <p className="text-xs text-slate-400">매일의 최저가 차액 추적 및 실시간 경쟁 분석 대시보드</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {/* Date Picker */}
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Calendar size={16} className="text-amber-500" />
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-sm outline-none cursor-pointer border-none font-medium"
                id="date-picker"
              />
            </div>

            {/* Backups */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleExportData}
                title="데이터 백업 받기"
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 text-sm font-medium flex items-center gap-1.5 transition-colors"
                id="btn-export"
              >
                <Download size={15} />
                <span className="hidden sm:inline">백업 추출</span>
              </button>
              
              <label 
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                id="label-import"
              >
                <Upload size={15} />
                <span className="hidden sm:inline">백업 복구</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportData}
                  className="hidden" 
                />
              </label>

              <button 
                onClick={() => setIsManagingProducts(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-lg font-semibold text-sm flex items-center gap-1.5 shadow-sm transition-all"
                id="btn-manage-products"
              >
                <Plus size={16} />
                <span>품목 관리</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 w-full flex flex-col gap-6" id="main-content">
        
        {/* Statistics Widgets */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="stats-section">
          
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="stat-card-total">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">모니터링 품목</span>
              <Layers size={18} className="text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-950">{metrics.totalProducts}</span>
              <span className="text-xs text-slate-500">개 등록됨</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="stat-card-naver-win">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-xs font-semibold uppercase tracking-wider">네이버가 더 저렴</span>
              <TrendingDown size={18} className="text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600">{metrics.naverWins}</span>
              <span className="text-xs text-slate-500">/{metrics.totalProducts - metrics.noCoupang} 품목</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="stat-card-coupang-win">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-xs font-semibold uppercase tracking-wider">쿠팡이 더 저렴</span>
              <TrendingUp size={18} className="text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">{metrics.coupangWins}</span>
              <span className="text-xs text-slate-500">/{metrics.totalProducts - metrics.noCoupang} 품목</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between" id="stat-card-same">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-wider">동일가 비율</span>
              <CheckCircle size={18} className="text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-700">{metrics.samePrice}</span>
              <span className="text-xs text-slate-500">품목</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 lg:col-span-1" id="stat-card-avg-diff">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-wider">평균 차액 (네-쿠)</span>
              <ArrowUpDown size={18} className="text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${metrics.avgDiff < 0 ? 'text-amber-600' : metrics.avgDiff > 0 ? 'text-blue-600' : 'text-slate-700'}`}>
                {metrics.avgDiff > 0 ? `+${metrics.avgDiff.toLocaleString()}` : metrics.avgDiff.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">원</span>
            </div>
          </div>

        </section>

        {/* Dashboard Grid split into Left (Table) and Right (Detail / AI Parser) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="dashboard-layout-grid">
          
          {/* Left panel: Product Pricing Table (9 cols on desktop) */}
          <div className="lg:col-span-9 flex flex-col gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs" id="table-panel">
            
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4" id="filters-bar">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="품목명을 검색해 주세요..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 bg-slate-50"
                  id="search-input"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">필터:</span>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 border-none outline-none rounded-lg px-2.5 py-1.5 font-medium cursor-pointer text-slate-700"
                  id="status-filter-select"
                >
                  <option value="all">전체 품목</option>
                  <option value="naver_cheaper">네이버가 더 저렴 (차액 &lt; 0)</option>
                  <option value="coupang_cheaper">쿠팡이 더 저렴 (차액 &gt; 0)</option>
                  <option value="same">가격 동일 (차액 = 0)</option>
                  <option value="no_coupang">쿠팡 미등록/비교불가</option>
                </select>
              </div>
            </div>

            {/* Table Area (Horizontal scrolling for safety) */}
            <div className="overflow-x-auto rounded-lg border border-slate-100" id="table-container">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-medium border-b border-slate-100 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center w-10">번호</th>
                    <th className="py-2.5 px-3">모니터링 품목</th>
                    <th className="py-2.5 px-3 text-right bg-amber-50/50 text-amber-900 border-l border-slate-100 font-bold">네이버 판매가</th>
                    <th className="py-2.5 px-3 text-right bg-amber-50/50 text-amber-900">배송비</th>
                    <th className="py-2.5 px-3 text-right bg-amber-100/60 text-amber-950 font-bold border-r border-slate-100" style={{ backgroundColor: "#FFF2CC" }}>네이버 합계</th>
                    <th className="py-2.5 px-3 text-center bg-blue-50/50 text-blue-900">타판매자</th>
                    <th className="py-2.5 px-3 text-right bg-blue-50/50 text-blue-900 font-bold">쿠팡 판매가</th>
                    <th className="py-2.5 px-3 text-right bg-blue-50/50 text-blue-900">배송비</th>
                    <th className="py-2.5 px-3 text-right text-blue-950 font-bold border-r border-slate-100" style={{ backgroundColor: "#DDEBF7" }}>쿠팡 합계</th>
                    <th className="py-2.5 px-3 text-right font-bold w-24">차액</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-10 text-slate-400">
                        <Info size={24} className="mx-auto mb-2 text-slate-300" />
                        조건에 일치하는 모니터링 품목이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((item, idx) => {
                      const isSelected = item.id === selectedProductId;
                      // Highlight green if cheaper
                      const isNaverCheaper = item.hasLog && item.coupangPrice > 0 && item.difference < 0;
                      const isCoupangCheaper = item.hasLog && item.coupangPrice > 0 && item.difference > 0;
                      const isPriceSame = item.hasLog && item.coupangPrice > 0 && item.difference === 0;

                      return (
                        <React.Fragment key={item.id}>
                          <tr 
                            onClick={() => setSelectedProductId(item.id)}
                            className={`group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 ${
                              isSelected ? "bg-slate-100/70 font-semibold border-l-4 border-l-amber-500" : ""
                            }`}
                            id={`row-${item.id}`}
                          >
                            {/* Number */}
                            <td className="py-3 px-3 text-center text-xs text-slate-400 group-hover:text-slate-600">
                              {idx + 1}
                            </td>
                            
                            {/* Name */}
                            <td className="py-3 px-3">
                              <div className="font-medium text-slate-900 line-clamp-1">{item.name}</div>
                              <div className="flex gap-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.naverUrl && (
                                  <a 
                                    href={item.naverUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] text-amber-600 hover:underline flex items-center gap-0.5"
                                  >
                                    네이버 쇼핑 <ExternalLink size={8} />
                                  </a>
                                )}
                                {item.coupangUrl && (
                                  <a 
                                    href={item.coupangUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                                  >
                                    쿠팡 바로가기 <ExternalLink size={8} />
                                  </a>
                                )}
                              </div>
                            </td>

                            {/* Naver Sale */}
                            <td className="py-3 px-3 text-right bg-amber-50/20 text-slate-800">
                              {item.hasLog && item.naverPrice > 0 ? `${item.naverPrice.toLocaleString()}원` : "-"}
                            </td>

                            {/* Naver Ship */}
                            <td className="py-3 px-3 text-right bg-amber-50/20 text-slate-500 text-xs">
                              {item.hasLog && item.naverPrice > 0 ? (item.naverShipping === 0 ? "무료" : `${item.naverShipping.toLocaleString()}원`) : "-"}
                            </td>

                            {/* Naver Total (Yellow highlighted cell style like user's Excel) */}
                            <td 
                              className={`py-3 px-3 text-right font-semibold border-r border-slate-100 transition-all ${
                                isNaverCheaper ? "bg-amber-100 text-amber-950 ring-2 ring-emerald-500 ring-inset" : "bg-amber-50 text-slate-900"
                              }`}
                              style={!isNaverCheaper ? { backgroundColor: "#FFF9E6" } : undefined}
                            >
                              {item.hasLog && item.naverTotal > 0 ? `${item.naverTotal.toLocaleString()}원` : "-"}
                            </td>

                            {/* Coupang Seller */}
                            <td className="py-3 px-3 text-center bg-blue-50/25 text-slate-600 text-xs max-w-[80px] truncate">
                              {item.hasLog ? item.coupangSeller || "-" : "-"}
                            </td>

                            {/* Coupang Sale */}
                            <td className="py-3 px-3 text-right bg-blue-50/25 text-slate-800">
                              {item.hasLog && item.coupangPrice > 0 ? `${item.coupangPrice.toLocaleString()}원` : "-"}
                            </td>

                            {/* Coupang Ship */}
                            <td className="py-3 px-3 text-right bg-blue-50/25 text-slate-500 text-xs">
                              {item.hasLog && item.coupangPrice > 0 ? (item.coupangShipping === 0 ? "무료" : `${item.coupangShipping.toLocaleString()}원`) : "-"}
                            </td>

                            {/* Coupang Total (Blue highlighted cell style like user's Excel) */}
                            <td 
                              className={`py-3 px-3 text-right font-semibold border-r border-slate-100 transition-all ${
                                isCoupangCheaper ? "bg-blue-100 text-blue-950 ring-2 ring-emerald-500 ring-inset" : "bg-blue-50 text-slate-900"
                              }`}
                              style={!isCoupangCheaper ? { backgroundColor: "#F2F6FA" } : undefined}
                            >
                              {item.hasLog && item.coupangTotal > 0 ? `${item.coupangTotal.toLocaleString()}원` : "-"}
                            </td>

                            {/* Difference */}
                            <td className="py-3 px-3 text-right font-semibold">
                              {item.hasLog && item.coupangPrice > 0 ? (
                                <span className={item.difference < 0 ? "text-amber-600" : item.difference > 0 ? "text-blue-600" : "text-slate-600"}>
                                  {item.difference > 0 ? `+${item.difference.toLocaleString()}` : item.difference.toLocaleString()}원
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>네이버 우위</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span>쿠팡 우위</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>초록색 하이라이트: 해당 품목의 최저가 총액</span>
              </div>
              <span className="font-semibold">품목 행을 클릭하시면 가격 추세 차트와 AI 가격 파서가 오른쪽에 나타납니다.</span>
            </div>

            {/* Keyword Tracking & Management (Full width under table) */}
            {selectedProduct && (
              <div className="mt-6 border-t-2 border-slate-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-500 text-white p-1.5 rounded-lg shadow-sm">
                      <Search size={18} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">일별 키워드 순위 추적 및 관리</h3>
                  </div>
                  <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md font-bold">
                    선택된 품목: <span className="text-slate-800">{selectedProduct.name}</span>
                  </span>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Top: Input fields */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-sm">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                      <span>✏️ {selectedDate} 키워드 순위 입력</span>
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-semibold">✓ 자동 저장됨</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const keywordName = selectedProduct?.keywords?.[i] || "";
                        const activeLog = priceLogs.find(l => l.productId === selectedProductId && l.date === selectedDate);
                        const keywordRank = activeLog?.keywordRanks?.[i] || "";
                        return (
                          <div key={i} className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all shadow-xs">
                            <span className="bg-slate-200/70 text-slate-500 font-bold px-3 py-2.5 text-sm border-r border-slate-200">{i+1}</span>
                            <input 
                              type="text" 
                              placeholder="키워드 입력"
                              value={keywordName}
                              onChange={(e) => handleKeywordNameChange(selectedProductId, i, e.target.value)}
                              className="w-full text-sm px-3 py-2.5 outline-none text-slate-800 font-medium bg-transparent placeholder-slate-400"
                            />
                            <div className="w-px h-6 bg-slate-200 shrink-0"></div>
                            <input 
                              type="text" 
                              placeholder="순위"
                              value={keywordRank}
                              onChange={(e) => handleKeywordRankChange(selectedProductId, i, e.target.value)}
                              className="w-16 text-sm px-2 py-2.5 outline-none text-blue-600 font-bold text-center shrink-0 placeholder-slate-300 bg-transparent"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Bottom: Trend Table */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                      <span>📈 {selectedDate.substring(0, 7)}월 키워드 순위 변동 추이</span>
                    </div>
                    
                    <div className="overflow-x-auto rounded-lg border border-slate-100 h-full pb-2">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                            <th className="p-3 font-bold whitespace-nowrap bg-slate-100 sticky left-0 z-10 border-r border-slate-200 min-w-[150px]">키워드</th>
                            {(() => {
                              const year = parseInt(selectedDate.substring(0, 4));
                              const month = parseInt(selectedDate.substring(5, 7));
                              const daysInMonth = new Date(year, month, 0).getDate();
                              const dates = Array.from({ length: daysInMonth }).map((_, i) => 
                                `${selectedDate.substring(0, 7)}-${(i + 1).toString().padStart(2, '0')}`
                              );
                              return dates.map(d => (
                                <th key={d} className={`p-2 font-bold text-center whitespace-nowrap min-w-[50px] ${d === selectedDate ? 'bg-amber-100/50 text-amber-700' : ''}`}>
                                  <div className="flex flex-col items-center">
                                    <span className="text-[10px] opacity-70 font-normal">{d.substring(5, 7)}/</span>
                                    <span>{d.substring(8, 10)}</span>
                                  </div>
                                </th>
                              ));
                            })()}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Array.from({ length: 6 }).map((_, i) => {
                            const kw = selectedProduct?.keywords?.[i];
                            if (!kw) return null;
                            const year = parseInt(selectedDate.substring(0, 4));
                            const month = parseInt(selectedDate.substring(5, 7));
                            const daysInMonth = new Date(year, month, 0).getDate();
                            const dates = Array.from({ length: daysInMonth }).map((_, i) => 
                              `${selectedDate.substring(0, 7)}-${(i + 1).toString().padStart(2, '0')}`
                            );
                            return (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-800 min-w-[150px] max-w-[200px] truncate bg-white sticky left-0 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10" title={kw}>{kw}</td>
                                {dates.map(d => {
                                  const log = priceLogs.find(l => l.productId === selectedProductId && l.date === d);
                                  const rank = log?.keywordRanks?.[i];
                                  return (
                                    <td key={d} className={`p-2 text-center border-r border-slate-50 ${d === selectedDate ? 'bg-amber-50/50' : ''}`}>
                                      {rank ? <span className="text-blue-600 font-bold text-[13px]">{rank}</span> : <span className="text-slate-200">-</span>}
                                    </td>
                                  )
                                })}
                              </tr>
                            );
                          })}
                          {(() => {
                            const year = parseInt(selectedDate.substring(0, 4));
                            const month = parseInt(selectedDate.substring(5, 7));
                            const daysInMonth = new Date(year, month, 0).getDate();
                            const dates = Array.from({ length: daysInMonth }).map((_, i) => 
                              `${selectedDate.substring(0, 7)}-${(i + 1).toString().padStart(2, '0')}`
                            );
                            return (
                              <tr className="hover:bg-amber-50/50 bg-amber-50/20 border-t-2 border-slate-100">
                                <td className="p-2.5 font-bold text-amber-800 min-w-[150px] max-w-[200px] truncate bg-amber-50/80 sticky left-0 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10 flex items-center gap-1.5">
                                  <span>📝</span> 일일 특이사항 (메모)
                                </td>
                                {dates.map(d => {
                                  const log = priceLogs.find(l => l.productId === selectedProductId && l.date === d);
                                  const memo = log?.memo || "";
                                  return (
                                    <td key={`memo-${d}`} className={`p-1 text-center border-r border-amber-100/30 ${d === selectedDate ? 'bg-amber-100/60' : ''}`}>
                                      <input
                                        type="text"
                                        value={memo}
                                        onChange={(e) => handleMemoChange(selectedProductId, d, e.target.value)}
                                        placeholder="메모"
                                        className="w-full min-w-[40px] text-[11px] px-1 py-1.5 outline-none text-amber-900 bg-transparent text-center focus:bg-white focus:ring-1 focus:ring-amber-400 rounded transition-all placeholder-amber-900/20 font-medium"
                                        title={memo}
                                      />
                                    </td>
                                  )
                                })}
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                      {(!selectedProduct?.keywords || !selectedProduct.keywords.some(k => k)) && (
                        <div className="p-10 text-center text-xs text-slate-400">
                          위에서 키워드를 입력하시면<br/>해당 월의 순위 변동 추이가 여기에 표시됩니다.
                        </div>
                      )}
                    </div>
                    {/* Monthly Memo Summary */}
                    {(() => {
                      const currentMonth = selectedDate.substring(0, 7);
                      const logsWithMemos = priceLogs.filter(l => l.productId === selectedProductId && l.date.startsWith(currentMonth) && l.memo && l.memo.trim() !== "");
                      
                      if (logsWithMemos.length === 0) return null;
                      
                      return (
                        <div className="mt-3 bg-amber-50/60 rounded-xl p-3 border border-amber-200/50 shadow-[inset_0_2px_10px_rgba(245,158,11,0.05)]">
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              {currentMonth}
                            </span>
                            <h4 className="text-xs font-bold text-slate-700">월간 특이사항 모아보기</h4>
                          </div>
                          <ul className="flex flex-col gap-1.5 pl-1">
                            {logsWithMemos.sort((a, b) => a.date.localeCompare(b.date)).map(log => (
                              <li key={`summary-${log.date}`} className="text-[11px] flex items-start gap-2 text-slate-600 bg-white/60 p-1.5 rounded-lg border border-white">
                                <span className="font-bold text-amber-700 bg-amber-100/50 px-1.5 py-0.5 rounded shrink-0 leading-none mt-0.5">{log.date.substring(5)}</span>
                                <span className="leading-relaxed break-words pt-0.5">{log.memo}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right panel: Details, Chart, and AI Parser (3 cols on desktop) */}
          <div className="lg:col-span-3 flex flex-col gap-6" id="right-panel">
            
            {/* 1. Dynamic Chart Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-3" id="trend-chart-card">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <ChartIcon size={18} className="text-amber-500" />
                  <span>가격 변동 추세 차트</span>
                </div>
                {selectedProduct && (
                  <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">
                    {selectedProduct.name}
                  </span>
                )}
              </div>

              {selectedProduct ? (
                chartData.length > 0 ? (
                  <div className="h-44 w-full" id="trend-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={["auto", "auto"]} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#fff" }}
                          itemStyle={{ fontSize: "11px", padding: 0 }}
                          labelStyle={{ fontSize: "11px", fontWeight: "bold", color: "#fbbf24" }}
                        />
                        <Legend iconSize={10} wrapperStyle={{ fontSize: "10px", marginTop: "5px" }} />
                        <Line 
                          name="네이버 합계" 
                          type="monotone" 
                          dataKey="네이버 합계" 
                          stroke="#fbbf24" 
                          strokeWidth={2.5}
                          activeDot={{ r: 6 }} 
                          connectNulls
                        />
                        <Line 
                          name="쿠팡 합계" 
                          type="monotone" 
                          dataKey="쿠팡 합계" 
                          stroke="#3b82f6" 
                          strokeWidth={2.5}
                          activeDot={{ r: 6 }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-10 text-center text-xs text-slate-400">
                    등록된 과거 변동 이력이 없습니다.
                  </div>
                )
              ) : (
                <div className="py-10 text-center text-xs text-slate-400">
                  선택된 품목이 없습니다.
                </div>
              )}
            </div>

            {/* 2. Fast Input & AI Parser Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4" id="ai-parser-card">
              
              <div className="border-b border-slate-100 pb-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <Sparkles size={18} className="text-amber-500 animate-pulse" />
                    <span>AI 기반 가격 입력 & 관리</span>
                  </div>
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold">
                    Gemini 3.5 Flash
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  네이버나 쿠팡의 본문 텍스트를 복사해 붙여넣으면 판매가와 배송비를 AI가 추출합니다!
                </p>
              </div>

              {selectedProduct ? (
                <div className="flex flex-col gap-4" id="price-entry-forms">
                  
                  {/* AI Paste Section */}
                  <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Sparkles size={14} className="text-amber-500" />
                        복사한 텍스트 붙여넣기
                      </span>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => fillSampleText("naver")}
                          className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded"
                        >
                          네이버 예시
                        </button>
                        <button 
                          onClick={() => fillSampleText("coupang")}
                          className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded"
                        >
                          쿠팡 예시
                        </button>
                      </div>
                    </div>

                    <textarea
                      placeholder="제품 상세페이지나 옵션에서 드래그하여 복사한 글을 그대로 붙여넣어 주세요..."
                      value={aiInputText}
                      onChange={(e) => setAiInputText(e.target.value)}
                      rows={3}
                      className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg outline-none resize-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      id="ai-text-textarea"
                    />

                    {aiParseError && (
                      <div className="text-xs text-rose-600 font-medium flex items-center gap-1">
                        <AlertTriangle size={12} />
                        <span>{aiParseError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <select 
                          value={aiParsingPlatform}
                          onChange={(e) => setAiParsingPlatform(e.target.value as "naver" | "coupang")}
                          className="text-xs bg-white border border-slate-200 px-2 py-1 rounded outline-none w-full"
                        >
                          <option value="naver">네이버에 입력</option>
                          <option value="coupang">쿠팡에 입력</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={handleAiParse}
                        disabled={isAiParsing}
                        className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold text-xs py-1.5 px-2.5 rounded-lg flex items-center justify-center gap-1 shadow-xs transition-colors"
                        id="btn-ai-parse-trigger"
                      >
                        {isAiParsing ? (
                          <>
                            <RefreshCw size={12} className="animate-spin" />
                            <span>분석 중...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} className="text-amber-400" />
                            <span>AI 가격 분석 적용</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Pricing Form */}
                  <form onSubmit={handleSavePrice} className="flex flex-col gap-4">
                    <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60 flex flex-col gap-3">
                      
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-1 border-b border-slate-100">
                        <span>✏️ 가격 정보 수동 입력 및 검증</span>
                        <span className="text-[10px] text-slate-400 font-normal">기준 날짜: {selectedDate}</span>
                      </div>

                      {/* Naver Input Fields */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          네이버 쇼핑
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400">판매가 (원)</label>
                            <input 
                              type="number" 
                              placeholder="0"
                              value={editNaverPrice}
                              onChange={(e) => setEditNaverPrice(e.target.value)}
                              className="bg-white border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-amber-400"
                              id="input-naver-price"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-slate-400">배송비 (원)</label>
                            <input 
                              type="number" 
                              placeholder="0"
                              value={editNaverShipping}
                              onChange={(e) => setEditNaverShipping(e.target.value)}
                              className="bg-white border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-amber-400"
                              id="input-naver-shipping"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Coupang Input Fields */}
                      <div className="flex flex-col gap-2 mt-1">
                        <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          쿠팡 / 타판매자
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col gap-1 col-span-1">
                            <label className="text-[10px] text-slate-400">판매자명</label>
                            <input 
                              type="text" 
                              placeholder="예: 레세나"
                              value={editCoupangSeller}
                              onChange={(e) => setEditCoupangSeller(e.target.value)}
                              className="bg-white border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-blue-400"
                              id="input-coupang-seller"
                            />
                          </div>
                          <div className="flex flex-col gap-1 col-span-1">
                            <label className="text-[10px] text-slate-400">판매가 (원)</label>
                            <input 
                              type="number" 
                              placeholder="0"
                              value={editCoupangPrice}
                              onChange={(e) => setEditCoupangPrice(e.target.value)}
                              className="bg-white border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-blue-400"
                              id="input-coupang-price"
                            />
                          </div>
                          <div className="flex flex-col gap-1 col-span-1">
                            <label className="text-[10px] text-slate-400">배송비 (원)</label>
                            <input 
                              type="number" 
                              placeholder="0"
                              value={editCoupangShipping}
                              onChange={(e) => setEditCoupangShipping(e.target.value)}
                              className="bg-white border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-blue-400"
                              id="input-coupang-shipping"
                            />
                          </div>
                        </div>
                      </div>


                    </div>

                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-xs"
                      id="btn-save-price-form"
                    >
                      {selectedDate} 날짜의 가격 저장하기
                    </button>
                  </form>

                </div>
              ) : (
                <div className="py-10 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                  품목을 선택하시면 해당 품목의 가격 및 키워드를 관리할 수 있습니다.
                </div>
              )}


            </div>

          </div>

        </div>

      </main>

      {/* Product Management Modal */}
      <AnimatePresence>
        {isManagingProducts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" id="product-modal-container">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
              id="product-modal-card"
            >
              
              {/* Modal Header */}
              <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">모니터링 품목 목록 관리</h3>
                  <p className="text-[11px] text-slate-400">모니터링할 품목을 추가하거나 삭제할 수 있습니다.</p>
                </div>
                <button 
                  onClick={() => setIsManagingProducts(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
                
                {/* Add New Product Form */}
                <form onSubmit={handleAddProduct} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-800">➕ 새 모니터링 품목 추가</span>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4 flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-semibold">품목명 (필수)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="예: 휘슬러 프리미엄 3종세트"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        className="bg-white border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-amber-500"
                        id="new-product-name"
                      />
                    </div>
                    <div className="md:col-span-4 flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-semibold">네이버 쇼핑 검색 주소</label>
                      <input 
                        type="url" 
                        placeholder="https://..."
                        value={newProductNaverUrl}
                        onChange={(e) => setNewProductNaverUrl(e.target.value)}
                        className="bg-white border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-amber-500"
                        id="new-product-naver"
                      />
                    </div>
                    <div className="md:col-span-4 flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-semibold">쿠팡 쇼핑 검색 주소</label>
                      <input 
                        type="url" 
                        placeholder="https://..."
                        value={newProductCoupangUrl}
                        onChange={(e) => setNewProductCoupangUrl(e.target.value)}
                        className="bg-white border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-amber-500"
                        id="new-product-coupang"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition-all shadow-xs"
                      id="btn-add-product-submit"
                    >
                      추가 완료
                    </button>
                  </div>
                </form>

                {/* Products List */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-slate-800">📋 현재 모니터링 중인 품목 리스트 ({products.length}개)</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {products.map((p, idx) => (
                      <div key={p.id} className="p-3 bg-white flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-5 text-center font-bold">{idx + 1}</span>
                          <div>
                            <span className="text-xs font-semibold text-slate-900">{p.name}</span>
                            <div className="flex gap-2.5 mt-0.5 text-[10px] text-slate-400">
                              <span>네이버 URL: {p.naverUrl ? "등록됨" : "미등록"}</span>
                              <span>•</span>
                              <span>쿠팡 URL: {p.coupangUrl ? "등록됨" : "미등록"}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="품목 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setIsManagingProducts(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  닫기
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 text-center py-5 text-xs text-slate-400 mt-auto" id="main-footer">
        <p>© 2026 Naver & Coupang Price Monitor. All rights reserved.</p>
        <p className="mt-1 text-[10px] text-slate-400">
          AI 분석 및 파싱은 Google Gemini 3.5 Flash 모델로 실행됩니다. 상세페이지 텍스트를 그대로 드래그하여 적용해 보세요.
        </p>
      </footer>

    </div>
  );
}
