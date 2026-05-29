import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Initialize Gemini Client
const initGemini = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("⚠️ GEMINI_API_KEY is not set. AI-enhanced metadata will be mocked.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const ai = initGemini();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // KOBIS API Key config
  // Standard API key from requested prompt is backup
  const KOBIS_API_KEY = process.env.KOBIS_API_KEY || "5a852c691ced334dd9ffadc9ac8637c5";

  // 1. Box Office API proxy
  app.get("/api/boxoffice", async (req: Request, res: Response) => {
    try {
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ error: "date (YYYYMMDD) is required" });
      }

      const url = `http://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${KOBIS_API_KEY}&targetDt=${date}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`KOBIS API returned status ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("❌ Boxoffice proxy error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch Daily Box Office data." });
    }
  });

  // 2. Movie Info API proxy
  app.get("/api/movie", async (req: Request, res: Response) => {
    try {
      const { movieCd } = req.query;
      if (!movieCd) {
        return res.status(400).json({ error: "movieCd is required" });
      }

      const url = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${KOBIS_API_KEY}&movieCd=${movieCd}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`KOBIS API returned status ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("❌ Movie proxy error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch Movie Info." });
    }
  });

  // 3. Optional: AI Custom Movie Metadata
  app.post("/api/movie/ai-metadata", async (req: Request, res: Response, next) => {
    try {
      const { title, genre, director, openDt } = req.body || {};
      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }

      // If Gemini client isn't available, return mock data fallback immediately
      if (!ai) {
        return res.json(getFallbackMetadata(title, genre, director));
      }

      const prompt = `
        영화 정보를 바탕으로 감각적이고 매력적인 UI 카드 연출용 메타데이터를 한국어로 생성해줘.
        영화 제목: "${title}"
        장르: "${genre || '정보없음'}"
        감독: "${director || '정보없음'}"
        개봉일: "${openDt || '정보없음'}"
      `;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          tagline: {
            type: Type.STRING,
            description: "An evocative and cinematic short tagline in Korean (e.g. '끝나지 않는 복수의 서사시', '어둠 속에서 피어오른 따뜻한 기적'). Max 40 characters.",
          },
          aiRating: {
            type: Type.NUMBER,
            description: "A fun AI-estimated fan recommendation score from 5.0 to 10.0.",
          },
          genreEmoji: {
            type: Type.STRING,
            description: "One single perfect emoji fitting the movie genre or theme.",
          },
          iconName: {
            type: Type.STRING,
            description: "Select exactly ONE of these representing standard Lucide icons: 'Swords', 'Clapperboard', 'Flame', 'Heart', 'Ghost', 'Sparkles', 'Skull', 'Shield', 'Globe', 'Compass'. Default is 'Clapperboard'.",
          },
          gradientFrom: {
            type: Type.STRING,
            description: "Best dark atmospheric Tailwind CSS background color name for the start of a gradient (e.g., 'indigo-950', 'rose-950', 'emerald-950', 'amber-950', 'red-950', 'purple-950', 'cyan-950', 'neutral-950').",
          },
          gradientTo: {
            type: Type.STRING,
            description: "Best atmospheric Tailwind CSS background color name for the end of a gradient (e.g., 'slate-900', 'zinc-900', 'neutral-900', 'stone-900', 'black').",
          },
          aiReview: {
            type: Type.STRING,
            description: "An incredibly intriguing 2-sentence summary or review in Korean that makes you want to watch it immediately. Max 100 characters.",
          },
        },
        required: ["tagline", "aiRating", "genreEmoji", "iconName", "gradientFrom", "gradientTo", "aiReview"],
      };

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert film critic and UI graphic designer. Your goals are to provide deep cinematic insight, generate high-quality taglines and select dark, high-contrast, premium, elegant atmospheric Tailwind colors that make the UI breathtakingly beautiful.",
          responseMimeType: "application/json",
          responseSchema,
        },
      });

      const responseText = result.text?.trim() || "{}";
      const metadata = JSON.parse(responseText);
      res.json(metadata);
    } catch (error: any) {
      console.warn("⚠️ Gemini metadata generation failed, returning fallback:", error.message || error);
      if (error.cause) {
        console.warn("   ↳ Error cause:", error.cause);
      }
      const title = req.body?.title || "영화";
      const genre = req.body?.genre || "";
      const director = req.body?.director || "";
      res.json(getFallbackMetadata(title, genre, director));
    }
  });

  // 4. Generate structured cinematic review from user's short input
  app.post("/api/movie/generate-review", async (req: Request, res: Response) => {
    try {
      const { title, originalReview, genre, director } = req.body || {};
      if (!title || !originalReview) {
        return res.status(400).json({ error: "title and originalReview are required fields" });
      }

      const prompt = `
        사용자가 영화 '${title}'에 대해 작성한 짧은 메모식 감상평을 바탕으로, 전문 영화 평론가가 작성한 듯하고 감성적인 정식 영화 감상평 리뷰를 한국어로 정교하게 완성해줘.
        
        영화 제목: "${title}"
        기존 작성 메모: "${originalReview}"
        장르 정보: "${genre || '정보없음'}"
        감독 정보: "${director || '정보없음'}"
      `;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          refinedReview: {
            type: Type.STRING,
            description: "A beautifully written, poetic, and professional cinematic review in Korean based closely on the user's focus but expanded with elegant film criticism language. Approximately 3-4 sentences (150-200 characters).",
          },
          cinematicTitle: {
            type: Type.STRING,
            description: "A stunning, poetic review title in Korean that captures the soul of this film and response (e.g., '흔들리는 프레임 속에서 피어난 찬란한 이면'). Max 35 characters.",
          },
          keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly three compelling emotional keywords or structural highlights formatted as 2-4 word tags (e.g. ['압도적인 앙상블', '서늘한 감각', '인간 본성에의 질문']).",
          }
        },
        required: ["refinedReview", "cinematicTitle", "keywords"]
      };

      if (!ai) {
        return res.json(getFallbackRefinedReview(title, originalReview));
      }

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a warm, highly perceptive, world-class film critic and literary editor. Your mission is to elevate standard user comments into beautiful, highly readable, heart-warming, or philosophically deep cinema letters, perfectly preserving their original critical intent but magnifying their literary quality.",
          responseMimeType: "application/json",
          responseSchema,
        }
      });

      const responseText = result.text?.trim() || "{}";
      const generatedData = JSON.parse(responseText);
      res.json(generatedData);
    } catch (error: any) {
      console.warn("⚠️ Review generation failed, returning fallback:", error.message || error);
      res.json(getFallbackRefinedReview(req.body?.title || "영화", req.body?.originalReview || "흥미로웠습니다."));
    }
  });

  // Global Error Handler for /api/* to ensure we always return JSON instead of falling back to Vite HTML
  app.use("/api/*", (err: any, req: Request, res: Response, next: any) => {
    console.error("❌ Handled API Error:", err);
    res.status(500).json({ error: err.message || "An unexpected internal server error occurred." });
  });

  // Serve static assets / Vite setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Express Server running on http://localhost:${PORT}`);
  });
}

// Fallback metadata generator
function getFallbackMetadata(title: string, genre?: string, director?: string) {
  const safeTitle = typeof title === "string" ? title : "영화 정보";
  const hash = safeTitle.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Choose gradient based on genre or title hash
  const gradients = [
    { from: "indigo-950", to: "slate-900", icon: "Clapperboard", emoji: "🎬" },
    { from: "rose-950", to: "zinc-900", icon: "Heart", emoji: "💖" },
    { from: "amber-950", to: "neutral-900", icon: "Sparkles", emoji: "✨" },
    { from: "purple-950", to: "stone-900", icon: "Ghost", emoji: "👾" },
    { from: "red-950", to: "zinc-900", icon: "Flame", emoji: "🔥" },
    { from: "emerald-950", to: "slate-900", icon: "Shield", emoji: "🛡️" },
    { from: "cyan-950", to: "neutral-900", icon: "Globe", emoji: "🌍" },
  ];
  const selected = gradients[hash % gradients.length];

  return {
    tagline: `다채로운 감각을 깨울 영화, '${safeTitle}'`,
    aiRating: Number((7.0 + (hash % 26) / 10).toFixed(1)),
    genreEmoji: selected.emoji,
    iconName: selected.icon,
    gradientFrom: selected.from,
    gradientTo: selected.to,
    aiReview: `세련된 연출과 짜임새 있는 연출력이 돋보이는 수작입니다. ${director ? `${director} 감독의 고유한 예술적 색채` : '영화 본연의 즐거움'}가 스크린 너머 가득히 전해집니다.`
  };
}

function getFallbackRefinedReview(title: string, originalReview: string) {
  return {
    refinedReview: `'${title}'를 관람하고 남겨주신 소중한 감상평 "${originalReview}"에 한결같이 마음이 향합니다. 영화가 지닌 특유의 섬세한 기후와 서사 속 미동을 포착해주셔서, 한층 더 풍부한 의미를 지니게 됩니다. 스크린 너머 담담한 위로와 여운이 고스란히 내려앉길 바랍니다.`,
    cinematicTitle: `짧은 기억 속에 새겨진 짙은 시네마틱 레터`,
    keywords: ["인상적인 시선", "섬세한 감정선", "따뜻한 공감"]
  };
}

startServer();
