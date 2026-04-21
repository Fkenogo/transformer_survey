
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { generateMockData } from './mockData';
import { StakeholderType, SurveyResponse } from './types';
import Papa from 'papaparse';
import { GoogleGenAI } from "@google/genai";
import { 
  LayoutDashboard, Zap, Factory, Truck, HardHat, Gavel, 
  BarChart3, TrendingUp, Clock, DollarSign, Upload, Sparkles,
  FileText, Search, Filter, AlertCircle, ChevronRight, 
  ArrowUpDown, ChevronLeft, SlidersHorizontal, CheckSquare, Square,
  PieChart as PieIcon, Target, Users, X, ArrowUpRight, Download, Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, RadarChart, PolarGrid, PolarAngleAxis, 
  Radar, Legend, PieChart, Pie
} from 'recharts';
import { DashboardCard } from './components/DashboardCard';

type SortConfig = { key: keyof SurveyResponse; direction: 'asc' | 'desc' } | null;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StakeholderType | 'overview' | 'data' | 'compare' | 'share'>('overview');
  const [data, setData] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [weightingLens, setWeightingLens] = useState<'ci' | 'utility'>('ci');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize data with artificial delay to show loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setData(generateMockData());
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // --- Filtering State ---
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [mvaRange, setMvaRange] = useState<[number, number]>([0, 100]);
  const [selectedStakeholders, setSelectedStakeholders] = useState<StakeholderType[]>(['utility', 'ci', 'supplier', 'epc', 'regulator']);
  const [showFilters, setShowFilters] = useState(false);

  // --- Sorting & Pagination State ---
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'stakeholder_type', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Selection State for Comparison ---
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

  // Simulation of "processing" when filters change
  const handleFilterChange = (updater: () => void) => {
    setIsLoading(true);
    setTimeout(() => {
      updater();
      setIsLoading(false);
    }, 400);
  };

  // --- CSV Import/Export Logic ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const processedData = results.data.map((row: any, idx) => ({
          ...row,
          id: row.id || `row-${idx}`,
          stakeholder_type: row.stakeholder_type || 'utility',
          sup_price_mid_usd: Number(row.sup_price_mid_usd) || 0,
          sup_max_mva: Number(row.sup_max_mva) || 0,
          price_score: Number(row.price_score) || 0,
          lead_time_score: Number(row.lead_time_score) || 0,
          mva_score: Number(row.mva_score) || 0,
          supplier_composite_score: Number(row.supplier_composite_score) || 0,
        })) as SurveyResponse[];
        
        setData(processedData);
        setTimeout(() => {
            setIsLoading(false);
            setActiveTab('overview');
        }, 800);
      },
    });
  };

  const exportToCSV = () => {
    setIsLoading(true);
    setTimeout(() => {
        const csv = Papa.unparse(sortedData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `powergrid_survey_export_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsLoading(false);
    }, 600);
  };

  // --- Computed Data ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const price = item.util_total_spend_usd || item.sup_price_mid_usd || item.ci_budget_mid_usd || 0;
      const mva = item.sup_max_mva || item.ci_largest_mva || 0;
      return (
        price >= priceRange[0] && 
        price <= priceRange[1] &&
        mva >= mvaRange[0] && 
        mva <= mvaRange[1] &&
        selectedStakeholders.includes(item.stakeholder_type)
      );
    });
  }, [data, priceRange, mvaRange, selectedStakeholders]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined || bValue === undefined) return 0;
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const toggleStakeholder = (type: StakeholderType) => {
    handleFilterChange(() => {
        setSelectedStakeholders(prev => 
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    });
  };

  const handleSort = (key: keyof SurveyResponse) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const calculateWeightedScore = (sup: SurveyResponse, lens: 'ci' | 'utility') => {
    const p = sup.price_score || 0;
    const l = sup.lead_time_score || 0;
    const m = sup.mva_score || 0;
    if (lens === 'ci') return Number((p * 0.4 + l * 0.4 + m * 0.2).toFixed(1));
    return Number((m * 0.5 + p * 0.25 + l * 0.25).toFixed(1));
  };

  const suppliers = useMemo(() => data.filter(d => d.stakeholder_type === 'supplier'), [data]);
  const selectedSuppliers = useMemo(() => suppliers.filter(s => selectedSupplierIds.includes(s.id)), [suppliers, selectedSupplierIds]);

  // Data for the side-by-side bar chart
  const comparisonChartData = useMemo(() => {
    return [
      { metric: 'Price Score' },
      { metric: 'MVA Score' },
      { metric: 'Lead Time' },
      { metric: 'Weighted Total' }
    ].map(item => {
      const scores: any = { ...item };
      selectedSuppliers.forEach(s => {
        scores[s.supplier_name!] = 
          item.metric === 'Price Score' ? s.price_score :
          item.metric === 'MVA Score' ? s.mva_score :
          item.metric === 'Lead Time' ? s.lead_time_score :
          calculateWeightedScore(s, weightingLens);
      });
      return scores;
    });
  }, [selectedSuppliers, weightingLens]);

  // --- Gemini AI Analysis ---
  const generateAIInsights = async () => {
    setIsAnalyzing(true);
    setAiInsight(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const statsSummary = {
        totalRecords: filteredData.length,
        stakeholders: selectedStakeholders,
        avgPriceScore: (filteredData.reduce((acc, curr) => acc + (curr.price_score || 0), 0) / filteredData.length).toFixed(1),
        topSupplierByMva: [...suppliers].sort((a,b) => (b.sup_max_mva || 0) - (a.sup_max_mva || 0))[0]?.supplier_name,
        marketMidpoint: "USD 47m",
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a senior energy market consultant. Analyze the following summary of Uganda transformer survey data: ${JSON.stringify(statsSummary)}. 
        Provide a 4-point strategic assessment identifying trends, outliers (e.g., Nile Transformers vs Korica), and competitive gaps. 
        Focus on the distinction between the C&I market and utility projects. Format as clean Markdown list.`,
      });
      setAiInsight(response.text || "Insight generation complete.");
    } catch (err) {
      console.error(err);
      setAiInsight("Failed to connect to the intelligence engine.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'share', label: 'Market Share', icon: PieIcon },
    { id: 'compare', label: 'Positioning', icon: Target },
    { id: 'supplier', label: 'Manufacturers', icon: Truck },
    { id: 'ci', label: 'C&I Demand', icon: Factory },
    { id: 'data', label: 'Raw Data', icon: FileText },
  ];

  const toggleSupplierSelection = (id: string) => {
    setSelectedSupplierIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {/* Global Loading Indicator Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100] flex items-center justify-center transition-opacity duration-300">
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="relative">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                <Zap className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto" />
            </div>
            <div className="text-center space-y-1">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Syncing Intelligence</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Optimizing Market Vectors...</p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0 sticky top-0 h-screen z-50">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="p-2 bg-indigo-500 rounded-lg"><Zap className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="font-bold text-lg leading-none">PowerGrid</h1>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Uganda Analytics</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id} onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
          
          <div className="mt-8 px-4 pt-4 border-t border-slate-800">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Market Verticals</h3>
            <div className="space-y-2">
              {(['utility', 'ci', 'supplier', 'epc', 'regulator'] as StakeholderType[]).map(type => {
                const isSelected = selectedStakeholders.includes(type);
                return (
                    <button 
                    key={type}
                    onClick={() => toggleStakeholder(type)}
                    className={`flex items-center gap-3 text-xs w-full px-3 py-2.5 rounded-xl border transition-all ${
                        isSelected 
                        ? 'bg-indigo-500/10 text-indigo-400 font-bold border-indigo-500/40 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-300 border-transparent'
                    }`}
                    >
                    <div className={`p-0.5 rounded ${isSelected ? 'bg-indigo-500 text-slate-900' : 'bg-slate-800'}`}>
                        {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" text-slate-300 />}
                    </div>
                    {type.toUpperCase()}
                    </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-colors">
            <Upload className="w-3.5 h-3.5" /> Import ODK Log
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
          <p className="text-[9px] text-center text-slate-500 uppercase tracking-widest py-2">© PowerGrid 2025</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-1">
              <span className="w-8 h-px bg-indigo-600"></span>
              Competitive Positioning Model v2.4
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">{navItems.find(n => n.id === activeTab)?.label}</h2>
            <p className="text-slate-500 font-medium">Head-to-head benchmarking and scenario modelling.</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl font-bold border transition-all ${
                showFilters ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-sm'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" /> Thresholds
            </button>
            <button 
              onClick={generateAIInsights}
              disabled={isAnalyzing}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI INSIGHTS
            </button>
          </div>
        </header>

        {/* Improved Filter Interface */}
        {showFilters && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl animate-in slide-in-from-top-6 duration-500 ease-out z-20 relative">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
              <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                <Filter className="w-4 h-4 text-indigo-600" /> Active Market Adjustments
              </h3>
              <button onClick={() => setShowFilters(false)} className="text-slate-300 hover:text-slate-600 p-2 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Pricing Floor</span>
                    <span className="text-[10px] text-slate-400 font-medium">Filter by USD annual spend</span>
                  </div>
                  <div className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                    <span className="text-indigo-700 font-mono font-bold text-sm">
                        ${priceRange[0].toLocaleString()} — ${priceRange[1].toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="relative pt-2 group">
                   <input 
                    type="range" min="0" max="200000" step="5000"
                    value={priceRange[1]}
                    onChange={(e) => handleFilterChange(() => setPriceRange([priceRange[0], parseInt(e.target.value)]))}
                    className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 group-hover:bg-slate-200 transition-colors"
                  />
                  <div className="flex justify-between mt-3 px-1 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    <span>$0</span>
                    <span>$200k+</span>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Capacity Ceiling</span>
                    <span className="text-[10px] text-slate-400 font-medium">Filter by MVA rating capability</span>
                  </div>
                  <div className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                    <span className="text-indigo-700 font-mono font-bold text-sm">
                        {mvaRange[0]} — {mvaRange[1]} MVA
                    </span>
                  </div>
                </div>
                <div className="relative pt-2 group">
                  <input 
                    type="range" min="0" max="100" step="1"
                    value={mvaRange[1]}
                    onChange={(e) => handleFilterChange(() => setMvaRange([mvaRange[0], parseInt(e.target.value)]))}
                    className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600 group-hover:bg-slate-200 transition-colors"
                  />
                  <div className="flex justify-between mt-3 px-1 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    <span>0 MVA</span>
                    <span>100 MVA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Insight Panel */}
        {aiInsight && (
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-8 rounded-3xl relative overflow-hidden animate-in slide-in-from-top duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Sparkles className="w-32 h-32 text-indigo-900" /></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg"><Sparkles className="w-5 h-5" /></div>
                <h3 className="font-black text-indigo-900 uppercase tracking-wider text-sm">Strategic Intelligence Brief</h3>
                <button onClick={() => setAiInsight(null)} className="ml-auto text-indigo-400 hover:text-indigo-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="prose prose-indigo max-w-none text-indigo-800/80 leading-relaxed font-medium">
                {aiInsight.split('\n').map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0">{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab Content Mapping */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Qualified Sample', value: filteredData.length, icon: FileText, color: 'indigo' },
                { label: 'Annual Throughput', value: '450-680 Units', icon: BarChart3, color: 'emerald' },
                { label: 'Asset Valuation', value: '$47M Mid', icon: DollarSign, color: 'blue' },
                { label: 'Logistics Score', value: '7.4', icon: Clock, color: 'rose' },
              ].map((kpi, idx) => (
                <div key={idx} className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
                  <div className={`w-12 h-12 rounded-2xl bg-${kpi.color}-50 text-${kpi.color}-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <kpi.icon className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{kpi.label}</p>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{kpi.value}</h4>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <DashboardCard title="Segment Market Share" subtitle="Percentage of market value by transformer tier">
                 <div className="h-[320px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Distribution (≤2.5 MVA)', value: 18 },
                            { name: 'Mid-power (2.5-20 MVA)', value: 14 },
                            { name: 'High-power (>20 MVA)', value: 15 },
                          ]}
                          cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={10} dataKey="value" stroke="none"
                        >
                          {[0,1,2].map((_, i) => <Cell key={i} fill={['#4f46e5', '#818cf8', '#c7d2fe'][i]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 20px' }} />
                        <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '20px', color: '#64748b' }} />
                      </PieChart>
                   </ResponsiveContainer>
                 </div>
               </DashboardCard>
               <DashboardCard title="Regional Density" subtitle="Demand hotspots across Ugandan territory">
                  <div className="h-[320px] bg-slate-50/70 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-slate-200/50">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 text-slate-300 shadow-sm border border-slate-100">
                      <Target className="w-10 h-10 opacity-30" />
                    </div>
                    <p className="text-slate-800 font-black uppercase tracking-widest text-[11px]">GIS Validation Required</p>
                    <p className="text-slate-400 text-xs mt-3 leading-relaxed max-w-[220px]">Regional coordinate datasets are currently undergoing integrity checks before rendering.</p>
                  </div>
               </DashboardCard>
            </div>
          </div>
        )}

        {/* Positioning Tab - Side-by-side Benchmarking */}
        {activeTab === 'compare' && (
          <div className="space-y-10 animate-in slide-in-from-right-8 duration-700 ease-out">
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/30 to-transparent pointer-events-none"></div>
              <div className="space-y-2 relative z-10">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Strategic Benchmarking</h3>
                <p className="text-sm text-slate-500 font-medium">Head-to-head manufacturer analysis across four primary performance vectors.</p>
              </div>
              <div className="flex bg-slate-100 p-2 rounded-2xl relative z-10">
                <button 
                  onClick={() => setWeightingLens('ci')}
                  className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${weightingLens === 'ci' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
                >C&I LENS</button>
                <button 
                  onClick={() => setWeightingLens('utility')}
                  className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${weightingLens === 'utility' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-900'}`}
                >UTILITY LENS</button>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {suppliers.map(sup => {
                const isSelected = selectedSupplierIds.includes(sup.id);
                return (
                    <button
                    key={sup.id}
                    onClick={() => toggleSupplierSelection(sup.id)}
                    className={`flex items-center gap-4 px-6 py-4 rounded-3xl border-2 transition-all duration-300 ${
                        isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:shadow-lg'
                    }`}
                    >
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-slate-50'}`}>
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-300" />}
                    </div>
                    <span className="font-black text-xs uppercase tracking-[0.2em]">{sup.supplier_name}</span>
                    </button>
                );
              })}
            </div>

            {selectedSuppliers.length > 0 ? (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <DashboardCard title="Manufacturer Radar Comparison" subtitle="Score analysis across key metrics (1-10 Scale)">
                    <div className="h-[450px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: 'Price Score', fullMark: 10 },
                          { subject: 'MVA Score', fullMark: 10 },
                          { subject: 'Lead Time', fullMark: 10 },
                          { subject: 'Reliability', fullMark: 10 },
                        ].map(d => ({
                          ...d,
                          ...selectedSuppliers.reduce((acc, s) => ({
                            ...acc,
                            [s.supplier_name!]: d.subject === 'Price Score' ? s.price_score :
                                               d.subject === 'MVA Score' ? s.mva_score :
                                               d.subject === 'Lead Time' ? s.lead_time_score : s.reliability_score
                          }), {})
                        }))}>
                          <PolarGrid stroke="#f1f5f9" strokeWidth={2} />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b', letterSpacing: '0.05em' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 800, padding: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                            formatter={(value: any) => [`${value}/10`, 'Score']}
                          />
                          {selectedSuppliers.map((s, i) => (
                            <Radar 
                              key={s.id} 
                              name={s.supplier_name} 
                              dataKey={s.supplier_name!} 
                              stroke={['#4f46e5', '#10b981', '#f59e0b', '#ec4899'][i % 4]} 
                              fill={['#4f46e5', '#10b981', '#f59e0b', '#ec4899'][i % 4]} 
                              fillOpacity={0.3} 
                              strokeWidth={3}
                            />
                          ))}
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '30px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </DashboardCard>

                  <DashboardCard title="Direct Vector Comparison" subtitle="Side-by-side head-to-head metrics">
                    <div className="h-[450px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="metric" axisLine={false} tickLine={false} className="text-[11px] font-black text-slate-400 uppercase tracking-widest" />
                          <YAxis domain={[0, 10]} axisLine={false} tickLine={false} className="text-[11px] font-mono text-slate-400" />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }} 
                            contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 800, padding: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                          />
                          <Legend iconType="circle" />
                          {selectedSuppliers.map((s, i) => (
                            <Bar 
                              key={s.id} 
                              dataKey={s.supplier_name!} 
                              fill={['#4f46e5', '#10b981', '#f59e0b', '#ec4899'][i % 4]} 
                              radius={[10, 10, 0, 0]} 
                              barSize={24} 
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </DashboardCard>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {selectedSuppliers.map(sup => (
                    <div key={sup.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:scale-105 transition-all duration-300">
                      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-125 transition-transform group-hover:opacity-[0.08]"><Target className="w-20 h-20" /></div>
                      <div className="flex justify-between items-center mb-8">
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-[0.2em]">{sup.supplier_name}</h4>
                        <div className="bg-slate-900 text-white px-4 py-1.5 rounded-2xl font-black text-xl shadow-lg">
                          {calculateWeightedScore(sup, weightingLens)}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing</span>
                          <span className="text-sm font-black text-slate-800">${(sup.sup_price_mid_usd || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capability</span>
                          <span className="text-sm font-black text-slate-800">{sup.sup_max_mva} MVA</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 text-slate-200 shadow-inner">
                  <Search className="w-12 h-12" />
                </div>
                <h4 className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">Comparison Engine Offline</h4>
                <p className="text-slate-300 text-xs mt-3 font-medium tracking-tight">Select manufacturers from the catalog above to initialize direct technical analysis.</p>
              </div>
            )}
          </div>
        )}

        {/* Raw Data Tab Content */}
        {activeTab === 'data' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase tracking-widest">Audit Repository</h3>
                <p className="text-sm text-slate-500 font-medium">Validated field respondent logs and entity submissions.</p>
              </div>
              <button 
                onClick={exportToCSV}
                className="flex items-center gap-3 px-8 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-slate-800 transition-all shadow-xl active:scale-95 group"
              >
                <Download className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" /> 
                EXPORT LEDGER (CSV)
              </button>
            </div>

            <DashboardCard title="Validated Records">
              <div className="overflow-x-auto -mx-6">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-100">
                      <th onClick={() => handleSort('stakeholder_type')} className="p-6 cursor-pointer group hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Vertical <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('util_total_spend_usd')} className="p-6 cursor-pointer group hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Market Valuation <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('sup_max_mva')} className="p-6 cursor-pointer group hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          MVA Cap <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </th>
                      <th onClick={() => handleSort('supplier_composite_score')} className="p-6 cursor-pointer group hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Aggr Score <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Respondent ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row) => (
                      <tr key={row.id} className="border-b border-slate-50 hover:bg-indigo-50/20 transition-colors group">
                        <td className="p-6">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter border ${
                            row.stakeholder_type === 'utility' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            row.stakeholder_type === 'ci' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            row.stakeholder_type === 'supplier' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {row.stakeholder_type}
                          </span>
                        </td>
                        <td className="p-6 text-sm font-mono text-indigo-600 font-bold">
                          ${(row.util_total_spend_usd || row.sup_price_mid_usd || row.ci_budget_mid_usd || 0).toLocaleString()}
                        </td>
                        <td className="p-6 text-sm font-black text-slate-700">
                          {row.sup_max_mva || row.ci_largest_mva || '-'} MVA
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                             <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(row.supplier_composite_score || 0) * 10}%` }}></div>
                             </div>
                             <span className="text-xs font-black text-slate-900">{row.supplier_composite_score || '-'}</span>
                          </div>
                        </td>
                        <td className="p-6 text-[11px] text-slate-300 font-mono group-hover:text-slate-500 transition-colors">{row.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-10 flex flex-col md:flex-row items-center justify-between border-t border-slate-100 pt-10 gap-6">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Index {(currentPage - 1) * itemsPerPage + 1} — {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} Valid Entries
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-500 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" /> PREV
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-slate-500 hover:text-indigo-600 disabled:opacity-30 transition-all shadow-sm active:scale-95"
                  >
                    NEXT <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </DashboardCard>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
