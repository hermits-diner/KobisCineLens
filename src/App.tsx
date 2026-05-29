import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Film, 
  Award,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Tv,
  Info,
  Clapperboard,
  Flame,
  Star
} from "lucide-react";
import { DailyBoxOffice, BoxOfficeResponse } from "./types";
import MovieRow from "./components/MovieRow";
import MovieDetailModal from "./components/MovieDetailModal";

export default function App() {
  // Calculate default of yesterday in Korea Standard Time (KST)
  const getYesterdayKSTString = () => {
    // Current server/UTC date
    const now = new Date();
    // 9 hours offset for Korea Standard Time
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstTime = new Date(now.getTime() + kstOffset);
    // Subtract 1 day to fetch yesterday's box office list
    kstTime.setDate(kstTime.getDate() - 1);
    
    // Format to YYYY-MM-DD
    const yyyy = kstTime.getFullYear();
    const mm = String(kstTime.getMonth() + 1).padStart(2, "0");
    const dd = String(kstTime.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const yesterdayString = getYesterdayKSTString();

  // State
  const [selectedDate, setSelectedDate] = useState<string>(yesterdayString);
  const [movies, setMovies] = useState<DailyBoxOffice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Selected movie for details modal
  const [selectedMovie, setSelectedMovie] = useState<DailyBoxOffice | null>(null);

  // Fetch function
  const fetchBoxOffice = async (dateStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const rawDate = dateStr.replace(/-/g, ""); // "YYYY-MM-DD" -> "YYYYMMDD"
      const res = await fetch(`/api/boxoffice?date=${rawDate}`);
      if (!res.ok) {
        throw new Error("영진위 OpenAPI 연동 중 이상이 발생했습니다.");
      }
      const data: BoxOfficeResponse = await res.json();
      
      const list = data.boxOfficeResult?.dailyBoxOfficeList;
      if (list && Array.isArray(list)) {
        setMovies(list);
      } else {
        setMovies([]);
        setError("지정하신 날짜에는 아직 박스오피스 데이터가 집계되지 않았거나 관객 기록 정보가 존재하지 않습니다.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "데이터 조회를 진행하지 못했습니다. 네크워크 및 서버 설정을 확인해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoxOffice(selectedDate);
  }, [selectedDate]);

  // Handle Date Navigation (Previous Day / Next Day)
  const handleOffsetDate = (offset: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offset);
    
    // Format to YYYY-MM-DD
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, "0");
    const dd = String(current.getDate()).padStart(2, "0");
    const newDateStr = `${yyyy}-${mm}-${dd}`;
    
    // Check if new target exceeds maximum allowable date (yesterdayString)
    if (newDateStr > yesterdayString) {
      return; // Cannot exceed yesterday
    }
    
    setSelectedDate(newDateStr);
  };

  // Safe number formatter
  const formatNumber = (numStr: string) => {
    const num = parseInt(numStr, 10);
    return isNaN(num) ? numStr : num.toLocaleString();
  };

  // Filter movies based on user's query
  const filteredMovies = movies.filter(m => 
    m.movieNm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Identify #1 movie for selected date
  const topMovie = movies.find(m => m.rank === "1");

  // Format date display for headers (e.g., 2026년 05월 28일)
  const formatDisplayDateString = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일`;
    }
    return dateStr;
  };

  return (
    <div 
      id="root-viewport" 
      className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans transition-colors duration-300"
    >
      {/* 1. Header Section */}
      <header 
        id="app-header" 
        className="sticky top-0 z-30 bg-stone-950/85 backdrop-blur-xl border-b border-stone-800 shadow-lg"
      >
        <div id="header-container" className="max-w-6xl mx-auto px-4 py-4 md:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand Title */}
          <div id="brand-logo-area" className="flex items-center gap-2.5">
            <div id="brand-logo-icon" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-stone-950 shadow-md">
              <Clapperboard size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h1 id="brand-title" className="text-xl md:text-2xl font-extrabold font-display tracking-tight text-white flex items-center gap-1.5">
                KOBIS <span className="text-amber-500 font-normal text-lg">씨네 렌즈</span>
              </h1>
              <p id="brand-subtitle" className="text-[10px] md:text-xs text-stone-400 font-light mt-0.5">
                영진위 OpenAPI 실시간 데일리 박스오피스 순위 정보
              </p>
            </div>
          </div>

          {/* Date Picker Controls */}
          <div id="date-picker-controls" className="flex items-center gap-2">
            
            {/* Previous Day btn */}
            <button
              id="prev-date-btn"
              onClick={() => handleOffsetDate(-1)}
              className="p-2.5 bg-stone-900 border border-stone-800 hover:border-stone-700 hover:bg-stone-850 text-stone-300 hover:text-white rounded-xl transition-all"
              aria-label="이전 날짜 조회"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Date Picker wrapper */}
            <div id="date-input-wrapper" className="relative flex items-center bg-stone-900 border border-stone-800 focus-within:border-amber-500/50 rounded-xl px-3.5 py-1.5 transition-all">
              <Calendar size={15} className="text-amber-500 mr-2 shrink-0 pointer-events-none" />
              <input
                id="movie-target-date"
                type="date"
                value={selectedDate}
                max={yesterdayString}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                  }
                }}
                className="bg-transparent text-sm font-semibold font-display text-stone-100 border-none outline-none cursor-pointer focus:ring-0 w-32 [color-scheme:dark]"
              />
            </div>

            {/* Next Day btn */}
            <button
              id="next-date-btn"
              onClick={() => handleOffsetDate(1)}
              disabled={selectedDate >= yesterdayString}
              className={`p-2.5 rounded-xl border transition-all ${
                selectedDate >= yesterdayString 
                  ? "bg-stone-950 border-stone-900 text-stone-700 cursor-not-allowed" 
                  : "bg-stone-900 border-stone-800 hover:border-stone-700 hover:bg-stone-850 text-stone-300 hover:text-white"
              }`}
              aria-label="다음 날짜 조회"
            >
              <ChevronRight size={16} />
            </button>

          </div>
        </div>
      </header>

      {/* 2. Main content container */}
      <main id="app-main-content" className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-10 flex flex-col gap-6 md:gap-10">
        
        {/* Dynamic header summary banner */}
        <div id="current-focus-summary" className="flex flex-col gap-2 select-none md:mb-2">
          <div className="flex items-center gap-1.5 text-xs text-stone-400 font-medium tracking-wide">
            <span>집계 기준일</span>
            <span className="text-stone-600">•</span>
            <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded font-mono">KST</span>
          </div>
          <h2 id="current-focus-date" className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {formatDisplayDateString(selectedDate)} 박스오피스
          </h2>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div id="main-loading-spinner" className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-stone-400 font-medium tracking-wide animate-pulse mt-2">
              가장 최신의 영화 순위를 가져오는 중입니다...
            </p>
          </div>
        )}

        {/* Match Errors */}
        {!loading && error && (
          <div id="main-error-callout" className="p-6 md:p-8 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
            <p className="text-amber-400/90 max-w-md text-sm leading-relaxed font-medium">
              {error}
            </p>
            <button 
              id="retry-fetch-btn"
              onClick={() => fetchBoxOffice(selectedDate)}
              className="mt-2 px-4 py-2 bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 text-xs text-white font-bold rounded-xl transition-all"
            >
              다시 시도하기
            </button>
          </div>
        )}

        {/* Content displays when data loaded */}
        {!loading && !error && (
          <div id="boxoffice-content-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
            
            {/* Left/Main Column: #1 Top Spotlight Card & List */}
            <div id="boxoffice-left-column" className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Highlight Hero Banner for #1 film */}
              {topMovie && (
                <motion.div
                  id="top-spotlight-hero"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 to-stone-900 border border-indigo-950 hover:border-indigo-900/40 p-6 md:p-8 flex flex-col gap-5 shadow-xl transition-all duration-300 text-stone-100 select-none cursor-pointer"
                  onClick={() => setSelectedMovie(topMovie)}
                >
                  <div id="glow-badge" className="absolute -top-10 -right-10 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Title indicator */}
                  <div className="flex justify-between items-start gap-2 z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-[10px] font-extrabold tracking-wider bg-amber-500 text-stone-950 rounded-full">
                        TODAY'S CHAMPION
                      </span>
                    </div>
                    <span className="text-xs text-stone-400 font-mono">영화 상세 가기 →</span>
                  </div>

                  <div className="flex flex-col gap-2 z-10 mt-1">
                    <h3 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-white group-hover:text-amber-400 transition-colors duration-300">
                      {topMovie.movieNm}
                    </h3>
                    <p className="text-xs md:text-sm text-indigo-200/80 leading-relaxed max-w-xl font-light">
                      개봉일 {topMovie.openDt} • 한국 극장가 누적 {formatNumber(topMovie.audiAcc)}번째 관객 신화 작성 중!
                    </p>
                  </div>

                  {/* Highlights statistics row */}
                  <div className="grid grid-cols-3 gap-4 border-t border-indigo-900/40 pt-4 mt-1 z-10">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-stone-400 font-medium">일일 관객 수</span>
                      <span className="text-base md:text-lg font-bold font-display text-white mt-0.5">
                        {formatNumber(topMovie.audiCnt)}명
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-stone-400 font-medium font-sans">매출 점유율</span>
                      <span className="text-base md:text-lg font-bold font-display text-amber-500 mt-0.5">
                        {topMovie.salesShare}%
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-stone-400 font-medium">스크린 회수</span>
                      <span className="text-base md:text-lg font-bold font-display text-stone-300 mt-0.5">
                        {formatNumber(topMovie.scrnCnt)}개관
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Boxoffice Ranking Item List */}
              <div id="boxoffice-ranking-table" className="flex flex-col gap-3">
                <div id="list-header-row" className="flex items-center justify-between px-4 pb-1">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    인기 관람작 랭킹 목록 ({filteredMovies.length}개)
                  </span>
                  
                  {/* Small Search input in list wrapper */}
                  <div className="relative flex items-center bg-stone-900 border border-stone-850 focus-within:border-stone-700/60 rounded-lg px-2 py-1 max-w-[200px] w-full">
                    <Search size={12} className="text-stone-500 mr-1.5 shrink-0" />
                    <input
                      id="search-ranking-input"
                      type="text"
                      placeholder="영화 제목 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-xs text-stone-250 border-none outline-none w-full"
                    />
                  </div>
                </div>

                {filteredMovies.length > 0 ? (
                  <div id="movies-list-grid" className="flex flex-col gap-3">
                    {filteredMovies.map((movie, idx) => (
                      <MovieRow
                        key={movie.movieCd}
                        movie={movie}
                        index={idx}
                        onSelect={setSelectedMovie}
                      />
                    ))}
                  </div>
                ) : (
                  <div id="no-search-results" className="p-12 text-center text-sm text-stone-500 bg-stone-900/25 border border-stone-850 rounded-2xl">
                    "{searchQuery}" 검색 조건에 부합하는 영화 순위가 없습니다.
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Mini Highlights Desk */}
            <div id="boxoffice-right-column" className="flex flex-col gap-6">
              
              {/* Boxoffice Stats overview Desk card */}
              <div id="kobis-analytics-summary" className="p-5 bg-stone-900 border border-stone-800 rounded-3xl flex flex-col gap-4 select-none">
                <div className="flex items-center gap-1.5 text-xs text-stone-400 font-bold tracking-wider">
                  <Award size={15} className="text-amber-500" />
                  KOBIS 종합 스탯 데스크
                </div>

                <div className="flex flex-col gap-3.5 mt-2.5">
                  <div className="flex flex-col p-3 bg-stone-950 rounded-xl border border-stone-850">
                    <span className="text-[10px] text-stone-500">신규 차트인 릴리즈</span>
                    <span className="text-sm font-bold text-stone-100 mt-1">
                      {movies.filter(m => m.rankOldAndNew === "NEW").length}작 진입 완료
                    </span>
                  </div>

                  <div className="flex flex-col p-3 bg-stone-950 rounded-xl border border-stone-850">
                    <span className="text-[10px] text-stone-500">순위 변동 최다 경쟁작</span>
                    <span className="text-sm font-bold text-stone-100 mt-1 text-emerald-500 truncate">
                      {movies.reduce((prev, current) => {
                        const prevDiff = Math.abs(parseInt(prev.rankInten, 10) || 0);
                        const curDiff = Math.abs(parseInt(current.rankInten, 10) || 0);
                        return prevDiff > curDiff ? prev : current;
                      }, movies[0] || {} as DailyBoxOffice)?.movieNm || "N/A"}
                    </span>
                  </div>

                  <div className="flex flex-col p-3 bg-stone-950 rounded-xl border border-stone-850">
                    <span className="text-[10px] text-stone-500">집계 관람 점유율 누계</span>
                    <span className="text-sm font-bold text-stone-100 mt-1">
                      {movies.reduce((sum, current) => sum + parseFloat(current.salesShare || "0"), 0).toFixed(1)}% 점유
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-stone-500 text-center leading-relaxed">
                  본 자료는 영진위(KOBIS) 통합전산망의 데이터를 API로 직접 로드하여 생성하는 안전한 실시간 공식 차트입니다.
                </div>
              </div>

              {/* Quick instructions or Legend card */}
              <div id="rank-guide-panel" className="p-5 bg-stone-900 border border-stone-800 rounded-3xl flex flex-col gap-3">
                <h4 className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
                  <Info size={14} className="text-stone-400" />
                  범례 및 이용 안내
                </h4>
                <div className="flex flex-col gap-2.5 text-xs text-stone-300 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold text-rose-500 bg-rose-500/10 rounded">NEW</span>
                    <span className="text-stone-400">당일 차트에 새로 진입한 영화</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">▲3</span>
                    <span className="text-stone-400">이전 집계 대비 순위 상승 폭</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sky-400 font-bold">▼2</span>
                    <span className="text-stone-400">이전 집계 대비 순위 하강 폭</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 font-bold">-</span>
                    <span className="text-stone-400">변동 없이 순위 제자리 유지</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* 3. Sliding Detail panel Modal */}
      <MovieDetailModal
        movieCd={selectedMovie ? selectedMovie.movieCd : null}
        movieNm={selectedMovie ? selectedMovie.movieNm : ""}
        openDt={selectedMovie ? selectedMovie.openDt : ""}
        rank={selectedMovie ? selectedMovie.rank : ""}
        audiCnt={selectedMovie ? selectedMovie.audiCnt : ""}
        audiAcc={selectedMovie ? selectedMovie.audiAcc : ""}
        onClose={() => setSelectedMovie(null)}
      />

      {/* Footer Branding Area */}
      <footer id="app-footer-brand" className="border-t border-stone-900 bg-stone-950 py-8 select-none mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-550">
          <div className="text-center sm:text-left">
            <p className="font-semibold text-stone-400 text-sm">KOBIS 씨네 렌즈 데스크</p>
            <p className="mt-1">영화진흥위원회 크레딧 연동 • 최경량 풀스택 아키텍처 구축</p>
          </div>
          <div className="text-stone-500 text-center sm:text-right text-[11px]">
            <p>데이터 및 디자인에 대한 안전 보장</p>
            <p className="mt-0.5">Key protection is fully active via server-side proxy layers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
