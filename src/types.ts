export interface DailyBoxOffice {
  rnum: string;
  rank: string;
  rankInten: string;
  rankOldAndNew: "OLD" | "NEW";
  movieCd: string;
  movieNm: string;
  openDt: string;
  salesAmt: string;
  salesShare: string;
  salesInten: string;
  salesChange: string;
  salesAcc: string;
  audiCnt: string;
  audiInten: string;
  audiChange: string;
  audiAcc: string;
  scrnCnt: string;
  showCnt: string;
}

export interface BoxOfficeResult {
  boxofficeType: string;
  showRange: string;
  dailyBoxOfficeList: DailyBoxOffice[];
}

export interface BoxOfficeResponse {
  boxOfficeResult: BoxOfficeResult;
}

export interface MovieInfoActor {
  peopleNm: string;
  peopleNmEn: string;
  cast: string;
  castEn: string;
}

export interface MovieInfoAudits {
  auditNo: string;
  watchGradeNm: string;
}

export interface MovieInfoDirector {
  peopleNm: string;
  peopleNmEn: string;
}

export interface MovieInfoGenre {
  genreNm: string;
}

export interface MovieInfoNation {
  nationNm: string;
}

export interface MovieInfo {
  movieCd: string;
  movieNm: string;
  movieNmEn: string;
  showTm: string;
  openDt: string;
  typeNm: string;
  nations: MovieInfoNation[];
  genres: MovieInfoGenre[];
  directors: MovieInfoDirector[];
  actors: MovieInfoActor[];
  audits: MovieInfoAudits[];
}

export interface MovieInfoResult {
  movieInfo: MovieInfo;
  source: string;
}

export interface MovieInfoResponse {
  movieInfoResult: MovieInfoResult;
}

export interface AIMetadata {
  tagline: string;
  aiRating: number;
  genreEmoji: string;
  iconName: string;
  gradientFrom: string;
  gradientTo: string;
  aiReview: string;
}
