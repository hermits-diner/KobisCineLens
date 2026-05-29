import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Clock,
  Calendar,
  Users,
  Film,
  Award,
  TrendingUp,
  Coins,
  Sparkles,
  Swords,
  Heart,
  Ghost,
  Flame,
  Shield,
  Globe,
  Compass,
  Clapperboard,
  Tv,
  MessageSquare,
  Send,
  CheckCircle,
  Sparkle
} from "lucide-react";
import { MovieInfo, AIMetadata } from "../types";

// Dynamic map for matching Lucide icons dynamically
const IconMap: { [key: string]: any } = {
  Swords,
  Clapperboard,
  Flame,
  Heart,
  Ghost,
  Sparkles,
  Shield,
  Globe,
  Compass,
  Film,
};

interface MovieDetailModalProps {
  movieCd: string | null;
  movieNm: string;
  openDt: string;
  rank: string;
  audiCnt: string;
  audiAcc: string;
  onClose: () => void;
}

export default function MovieDetailModal({
  movieCd,
  movieNm,
  openDt,
  rank,
  audiCnt,
  audiAcc,
  onClose,
}: MovieDetailModalProps) {
  const [movieInfo, setMovieInfo] = useState<MovieInfo | null>(null);
  const [aiMetadata, setAiMetadata] = useState<AIMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // AI refined review generator states
  const [userOpinion, setUserOpinion] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedReview, setGeneratedReview] = useState<{
    refinedReview: string;
    cinematicTitle: string;
    keywords: string[];
  } | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieCd) return;

    let isMounted = true;
    const fetchMovieDetails = async () => {
      setLoading(true);
      setError(null);
      // Reset review generator states on movie change
      setUserOpinion("");
      setGeneratedReview(null);
      setGenError(null);
      try {
        // 1. Fetch official KOBIS movie info
        const infoRes = await fetch(`/api/movie?movieCd=${movieCd}`);
        if (!infoRes.ok) throw new Error("KOBIS 영화 상세 정보를 가져오는 데 실패했습니다.");
        const infoData = await infoRes.json();
        
        const info: MovieInfo = infoData.movieInfoResult?.movieInfo;
        if (!isMounted) return;
        setMovieInfo(info);

        // 2. Fetch AI-optimized visual metadata (tagline, review, colors, etc)
        const genreText = info?.genres?.map(g => g.genreNm).join(", ") || "";
        const directorText = info?.directors?.map(d => d.peopleNm).join(", ") || "";

        const aiRes = await fetch("/api/movie/ai-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: movieNm,
            genre: genreText,
            director: directorText,
            openDt: openDt || info?.openDt
          })
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          if (isMounted) setAiMetadata(aiData);
        }
      } catch (err: any) {
        console.error("Error fetching detail data:", err);
        if (isMounted) setError(err.message || "Failed to structure movie analysis.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMovieDetails();

    return () => {
      isMounted = false;
    };
  }, [movieCd, movieNm, openDt]);

  // Format numbers to Korean text style (e.g. 1,234,567명)
  const formatNumber = (numStr: string) => {
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return numStr;
    return num.toLocaleString();
  };

  // POST request to generate cinematic review based on user's opinion
  const handleGenerateReview = async () => {
    if (!userOpinion.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenError(null);
    try {
      const genreText = movieInfo?.genres?.map(g => g.genreNm).join(", ") || "";
      const directorText = movieInfo?.directors?.map(d => d.peopleNm).join(", ") || "";

      const res = await fetch("/api/movie/generate-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: movieNm,
          originalReview: userOpinion,
          genre: genreText,
          director: directorText
        })
      });

      if (!res.ok) {
        throw new Error("AI 감상평 생성 중 오류가 발생했습니다.");
      }

      const reviewData = await res.json();
      setGeneratedReview(reviewData);
    } catch (err: any) {
      console.error("Review generate error:", err);
      setGenError(err.message || "리뷰를 생성하지 못했습니다. 다시 한 번 입력을 확인해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Safe backdrop rendering component using selected gradient and icon
  const renderBackdrop = () => {
    if (!aiMetadata) {
      return (
        <div id="backdrop-fallback" className="absolute inset-0 bg-gradient-to-br from-slate-900 to-zinc-950 opacity-90 transition-all duration-300" />
      );
    }

    const { gradientFrom, gradientTo, iconName, genreEmoji } = aiMetadata;
    const SelectedIcon = IconMap[iconName] || Clapperboard;

    // We build classes dynamically depending on what tailwind strings are returned.
    // They are controlled names defined strictly on the backend.
    const gradientClass = `bg-gradient-to-br from-${gradientFrom} to-${gradientTo}`;

    return (
      <div id="movie-dynamic-backdrop" className={`absolute inset-0 ${gradientClass} opacity-95 transition-all duration-500 overflow-hidden`}>
        {/* Abstract design blobs for premium theater overlay mood */}
        <div id="ambient-glow-1" className="absolute -top-12 -left-12 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div id="ambient-glow-2" className="absolute -bottom-16 -right-16 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl" />
        
        {/* Centered abstract motif */}
        <div id="decorative-motif" className="absolute inset-y-0 right-10 flex items-center justify-center opacity-10 select-none pointer-events-none">
          <SelectedIcon size={380} className="transform rotate-12 stroke-[0.5]" />
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {movieCd && (
        <div
          id="detail-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Main Modal body */}
          <motion.div
            id="detail-modal-container"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-4xl bg-stone-900 rounded-3xl overflow-hidden shadow-2xl border border-stone-800 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              id="modal-close-btn"
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 text-white/70 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="상세 정보 닫기"
            >
              <X size={20} />
            </button>

            {/* Banner Area (Height: 300px on desktop) */}
            <div id="modal-banner-area" className="relative h-64 md:h-72 flex flex-col justify-end p-6 md:p-8 shrink-0 select-none">
              {renderBackdrop()}

              {/* Back button option for mobile in case */}
              <div id="banner-content-gradient" className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-stone-900 via-stone-900/60 to-transparent z-10" />

              <div id="banner-text-block" className="relative z-10 flex flex-col gap-2">
                <div id="banner-meta-row" className="flex flex-wrap items-center gap-2">
                  <span id="rank-badge" className="px-2.5 py-1 text-xs font-bold tracking-wider bg-amber-500 text-stone-950 rounded-full">
                    BOX OFFICE NO.{rank}
                  </span>
                  
                  {movieInfo && (
                    <span id="audit-badge" className="px-2.5 py-1 text-xs font-medium bg-white/10 text-white/90 backdrop-blur-md rounded-full">
                      {movieInfo.audits?.[0]?.watchGradeNm || "등급 정보 없음"}
                    </span>
                  )}

                  {aiMetadata && (
                    <span id="ai-rating-badge" className="px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full flex items-center gap-1">
                      <Sparkles size={11} className="fill-amber-300 animate-pulse" />
                      AI 평점 {aiMetadata.aiRating}
                    </span>
                  )}
                </div>

                <h2 id="banner-title" className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mt-1">
                  {movieNm}
                  {aiMetadata && <span id="title-emoji" className="ml-2">{aiMetadata.genreEmoji}</span>}
                </h2>

                {aiMetadata && (
                  <p id="banner-tagline" className="text-sm md:text-base text-stone-300 font-light tracking-wide italic leading-relaxed">
                    "{aiMetadata.tagline}"
                  </p>
                )}
                {!aiMetadata && (
                  <p id="banner-tagline-fallback" className="text-xs text-stone-400 font-light">
                    KOBIS 공식 집계 및 영화 데이터 분석 자료입니다.
                  </p>
                )}
              </div>
            </div>

            {/* Scrollable Content Container */}
            <div id="modal-scroll-area" className="flex-1 overflow-y-auto p-6 md:p-8 bg-stone-900 text-stone-100 flex flex-col gap-6 md:gap-8 scrollbar-thin scrollbar-thumb-stone-800">
              
              {loading && (
                <div id="modal-loading-pane" className="flex flex-col items-center justify-center py-20 gap-4">
                  <span className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-stone-400 font-medium tracking-wide animate-pulse">
                    AI 분석 및 한국 영화진흥위원회 데이터를 조합 중입니다...
                  </p>
                </div>
              )}

              {error && (
                <div id="modal-error-pane" className="p-4 bg-red-900/20 border border-red-500/30 text-red-200 rounded-xl flex items-center gap-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {!loading && !error && movieInfo && (
                <div id="modal-grid-layout" className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                  
                  {/* Left 2 Columns: Base info, AI comments, Casts */}
                  <div id="modal-main-column" className="md:col-span-2 flex flex-col gap-6">
                    
                    {/* 1. Dynamic AI Movie Analysis Summary */}
                    {aiMetadata && (
                      <div id="ai-review-card" className="p-5 bg-stone-800/40 border border-stone-800 rounded-2xl flex flex-col gap-2.5">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm tracking-wider">
                          <Sparkles size={16} className="fill-amber-400 animate-spin-slow" />
                          AI 한줄 추천평
                        </div>
                        <p className="text-sm text-stone-200 leading-relaxed font-normal">
                          {aiMetadata.aiReview}
                        </p>
                      </div>
                    )}

                    {/* 2. Official Movie Information Overview */}
                    <div id="official-info-card" className="flex flex-col gap-4">
                      <h3 className="text-lg font-bold tracking-tight border-b border-stone-800 pb-2 text-stone-200">
                        영화 상세 정보
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Film size={15} className="text-stone-400 shrink-0" />
                          <span className="text-stone-400 font-medium shrink-0">영문명</span>
                          <span className="text-stone-200 truncate" title={movieInfo.movieNmEn}>
                            {movieInfo.movieNmEn || "N/A"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock size={15} className="text-stone-400 shrink-0" />
                          <span className="text-stone-400 font-medium shrink-0">상영시간</span>
                          <span className="text-stone-200">{movieInfo.showTm}분</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar size={15} className="text-stone-400 shrink-0" />
                          <span className="text-stone-400 font-medium shrink-0">개봉일</span>
                          <span className="text-stone-200">
                            {movieInfo.openDt ? `${movieInfo.openDt.substring(0,4)}-${movieInfo.openDt.substring(4,6)}-${movieInfo.openDt.substring(6,8)}` : openDt || "정보 없음"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Award size={15} className="text-stone-400 shrink-0" />
                          <span className="text-stone-400 font-medium shrink-0">장르</span>
                          <span className="text-stone-200">
                            {movieInfo.genres?.map(g => g.genreNm).join(", ") || "정보 없음"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Globe size={15} className="text-stone-400 shrink-0" />
                          <span className="text-stone-400 font-medium shrink-0">제작국가</span>
                          <span className="text-stone-200">
                            {movieInfo.nations?.map(n => n.nationNm).join(", ") || "정보 없음"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Award size={15} className="text-stone-400 shrink-0" />
                          <span className="text-stone-400 font-medium shrink-0">영화구분</span>
                          <span className="text-stone-200">{movieInfo.typeNm || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Cast & Directors */}
                    <div id="cast-info-card" className="flex flex-col gap-4">
                      <h3 className="text-lg font-bold tracking-tight border-b border-stone-800 pb-2 text-stone-200">
                        감독 · 출연 배우
                      </h3>

                      <div className="flex flex-col gap-4">
                        {/* Directors */}
                        <div>
                          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                            감독
                          </h4>
                          <p className="text-sm font-medium text-stone-250">
                            {movieInfo.directors?.map(d => d.peopleNm).join(", ") || "등록된 감독 정보가 없습니다."}
                          </p>
                        </div>

                        {/* Actors */}
                        <div>
                          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                            출연 배우 ({movieInfo.actors?.length || 0}명)
                          </h4>
                          {movieInfo.actors && movieInfo.actors.length > 0 ? (
                            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-800">
                              {movieInfo.actors.map((actor, idx) => (
                                <div
                                  key={`${actor.peopleNm}-${idx}`}
                                  className="px-3 py-1.5 bg-stone-800/60 border border-stone-800/80 rounded-lg text-xs"
                                >
                                  <span className="font-semibold text-stone-200">{actor.peopleNm}</span>
                                  {actor.cast && (
                                    <span className="text-stone-400 ml-1 text-[10px] bg-stone-900/60 px-1.5 py-0.5 rounded">
                                      {actor.cast}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-stone-550 italic">
                              등록된 주연 배우 정보가 없습니다.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 4. 나만의 AI 감상평 평론기 */}
                    <div id="user-ai-review-composer" className="p-5 bg-stone-850/60 border border-stone-800 rounded-2xl flex flex-col gap-4">
                      <div className="flex items-center gap-2.5 text-amber-500 font-bold text-sm tracking-wider">
                        <MessageSquare size={16} className="text-amber-500" />
                        나만의 AI 영화 평론 도우미
                      </div>
                      
                      <p className="text-xs text-stone-400 leading-relaxed font-light">
                        영화에 대해 느낀 주관적 감상이나 소감을 간단하게 한 줄 적어보세요. Gemini 평론가가 당신의 글을 고스란히 반영하여 깊이 있는 전문가 수준의 영화 평문으로 새롭게 작문해 드립니다.
                      </p>

                      <div className="flex flex-col gap-3">
                        <div className="relative">
                          <textarea
                            id="user-opinion-textarea"
                            rows={3}
                            placeholder="예: 영화 스토리가 너무 탄탄하고 마지막 결말 부분에서 연기도 완전 폭발이고 감동 깊었음"
                            value={userOpinion}
                            onChange={(e) => setUserOpinion(e.target.value)}
                            disabled={isGenerating}
                            className="w-full text-xs md:text-sm bg-stone-900 border border-stone-800 focus:border-amber-500/50 rounded-xl p-3 text-stone-100 outline-none placeholder-stone-600 resize-none transition-all disabled:opacity-60"
                          />
                          <span className="absolute bottom-2.5 right-3 text-[10px] text-stone-600">
                            {userOpinion.length}자
                          </span>
                        </div>

                        {genError && (
                          <p className="text-xs text-red-500 bg-red-950/20 border border-red-500/20 px-3 py-2 rounded-lg font-medium">{genError}</p>
                        )}

                        <button
                          id="submit-opinion-btn"
                          onClick={handleGenerateReview}
                          disabled={!userOpinion.trim() || isGenerating}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${
                            !userOpinion.trim() || isGenerating
                              ? "bg-stone-800 text-stone-500 cursor-not-allowed"
                              : "bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-md transform active:scale-98"
                          }`}
                        >
                          {isGenerating ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin shrink-0" />
                              장인의 시선으로 영화평을 승화 및 집필 중...
                            </>
                          ) : (
                            <>
                              <Send size={13} className="shrink-0" />
                              간단한 소감으로 상세 평론문 생성하기
                            </>
                          )}
                        </button>
                      </div>

                      {/* Display generated structured review with high polish */}
                      <AnimatePresence>
                        {generatedReview && (
                          <motion.div
                            id="generated-review-display"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-2 p-5 bg-stone-900 border border-amber-500/20 rounded-xl flex flex-col gap-3 relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-3 text-amber-500/5 pointer-events-none select-none">
                              <Sparkles size={80} className="stroke-[0.8]" />
                            </div>

                            <div className="flex flex-wrap gap-1.5 z-10">
                              {generatedReview.keywords?.map((kw, i) => (
                                <span
                                  key={`${kw}-${i}`}
                                  className="px-2 py-0.5 text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md font-sans"
                                >
                                  #{kw}
                                </span>
                              ))}
                            </div>

                            <div className="flex flex-col gap-1.5 z-10 mt-1">
                              <h4 className="text-sm font-bold text-stone-100 flex items-center gap-1.5">
                                <Sparkle size={13} className="text-amber-500 fill-amber-500 shrink-0" />
                                "{generatedReview.cinematicTitle}"
                              </h4>
                              <p className="text-xs md:text-sm text-stone-300 leading-relaxed font-light italic mt-1 font-sans">
                                {generatedReview.refinedReview}
                              </p>
                            </div>

                            <div className="flex gap-1.5 items-center text-[10px] text-stone-500 mt-2 border-t border-stone-850 pt-2 z-10">
                              <CheckCircle size={11} className="text-emerald-500" />
                              <span>AI 평론가 작문 적용 완료</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>

                  {/* Right 1 Column: Standard Stats & Ranks Information */}
                  <div id="modal-stats-column" className="flex flex-col gap-5 md:pl-4 md:border-l border-stone-800">
                    <h3 className="text-lg font-bold tracking-tight border-b border-stone-800 pb-2 text-stone-200 flex items-center gap-1.5">
                      <Coins size={17} className="text-amber-500" />
                      일일 성적 & 총 스펙
                    </h3>

                    {/* Primary indicators */}
                    <div className="flex flex-col gap-4">
                      {/* Daily Audiences */}
                      <div className="p-4 bg-stone-800/30 rounded-xl flex flex-col gap-1 border border-stone-800/40">
                        <span className="text-xs text-stone-500 font-medium">오늘 관람 관객 수</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xl font-bold text-amber-500 font-display">
                            {formatNumber(audiCnt)}
                          </span>
                          <span className="text-xs text-stone-300">명</span>
                        </div>
                      </div>

                      {/* Cumulative Audiences */}
                      <div className="p-4 bg-stone-800/30 rounded-xl flex flex-col gap-1 border border-stone-800/40">
                        <span className="text-xs text-stone-500 font-medium">누적 최다 관객 수</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xl font-bold text-stone-200 font-display">
                            {formatNumber(audiAcc)}
                          </span>
                          <span className="text-xs text-stone-300">명</span>
                        </div>
                      </div>

                      {/* Side Stats layout */}
                      <div className="flex flex-col gap-2.5 text-xs bg-stone-800/20 p-4 rounded-xl border border-stone-800/20">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-stone-500">신규 진입 여부</span>
                          <span className="text-stone-300 font-medium">
                            {rank === "10" && audiAcc === audiCnt ? "신규 데뷔영화" : "기존 랭킹유지"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-t border-stone-800/30">
                          <span className="text-stone-500">KOBIS 영화코드</span>
                          <span className="text-stone-200 font-mono tracking-wider">{movieCd}</span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-t border-stone-800/30">
                          <span className="text-stone-500">제공 출처</span>
                          <span className="text-stone-400 text-[10px]">영화진흥위원회 KOBIS</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Sticky footer for elegant branding */}
            <div id="modal-footer" className="p-4 bg-stone-950 border-t border-stone-800 shrink-0 text-center select-none text-[10px] text-stone-500 flex justify-between items-center px-6 md:px-8">
              <span>© KOBIS REALTIEST RECONSTRUCTION</span>
              <span className="flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500" />
                DREAMCRAFT AI CO-ORGANIZER
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
