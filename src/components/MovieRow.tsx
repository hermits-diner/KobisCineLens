import { DailyBoxOffice } from "../types";
import { TrendingUp, Users, ChevronRight } from "lucide-react";

interface MovieRowProps {
  key?: string;
  movie: DailyBoxOffice;
  index: number;
  onSelect: (movie: DailyBoxOffice) => void;
}

export default function MovieRow({ movie, index, onSelect }: MovieRowProps) {
  const isNew = movie.rankOldAndNew === "NEW";
  const rankDiff = parseInt(movie.rankInten, 10);

  // Helper to format rank difference indicators
  const renderRankChange = () => {
    if (isNew) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded uppercase tracking-wider animate-pulse">
          NEW
        </span>
      );
    }
    if (rankDiff > 0) {
      return (
        <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
          ▲{rankDiff}
        </span>
      );
    }
    if (rankDiff < 0) {
      return (
        <span className="text-xs font-semibold text-sky-400 flex items-center gap-0.5">
          ▼{Math.abs(rankDiff)}
        </span>
      );
    }
    return <span className="text-xs text-stone-500 font-bold">-</span>;
  };

  // Safe number formatter
  const formatNumber = (numStr: string) => {
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return numStr;
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}만`;
    }
    return num.toLocaleString();
  };

  return (
    <div
      onClick={() => onSelect(movie)}
      id={`movie-row-${movie.movieCd}`}
      className="group relative flex items-center justify-between p-4 bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 rounded-2xl cursor-pointer transition-all duration-300 md:p-5 select-none"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
        {/* Left: Rank & Changes Indicator block */}
        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-stone-950 border border-stone-800 shrink-0 select-none">
          <span className="text-lg font-bold font-display text-white group-hover:text-amber-400 transition-colors">
            {movie.rank}
          </span>
          <div className="flex items-center justify-center">
            {renderRankChange()}
          </div>
        </div>

        {/* Middle: Title, Opening Date, Sales Share */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-stone-100 truncate group-hover:text-white transition-colors duration-200">
              {movie.movieNm}
            </h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-stone-400">
            <span className="shrink-0 flex items-center gap-1 font-mono">
              개봉 {movie.openDt ? movie.openDt : "미집계"}
            </span>
            <span className="hidden md:inline text-stone-600">•</span>
            <span className="shrink-0 font-medium text-stone-300 flex items-center gap-1">
              <TrendingUp size={12} className="text-amber-500/75 shrink-0" />
              점유율 {movie.salesShare}%
            </span>
          </div>
        </div>
      </div>

      {/* Right: Audiences column & Arrow icon */}
      <div className="flex items-center gap-4 select-none shrink-0 text-right">
        <div className="flex flex-col">
          <div className="flex items-center justify-end gap-1 font-semibold text-sm text-stone-200">
            <Users size={12} className="text-stone-400" />
            <span className="font-display font-medium text-stone-100">{formatNumber(movie.audiCnt)}</span>
            <span className="text-xs text-stone-400 font-normal">명</span>
          </div>
          <span className="text-[10px] text-stone-500 font-light mt-0.5 font-mono">
            누적 {formatNumber(movie.audiAcc)}명
          </span>
        </div>
        
        <div className="text-stone-500 group-hover:text-stone-300 transition-transform duration-300 group-hover:translate-x-1">
          <ChevronRight size={18} />
        </div>
      </div>
    </div>
  );
}
