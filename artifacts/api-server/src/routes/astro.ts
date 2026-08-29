import { Router, type IRouter, type Request } from "express";
import { z } from "zod";

const router: IRouter = Router();

const birthDateSchema = z.object({
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const providerResponseSchema = z.object({
  prediction: z.object({
    personal_life: z.string().default(""),
    profession: z.string().default(""),
    health: z.string().default(""),
    emotions: z.string().default(""),
    travel: z.string().default(""),
    luck: z.string().default(""),
  }),
});

type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

function getSunSign(month: number, day: number): ZodiacSign {
  const boundary: Array<[number, ZodiacSign, ZodiacSign]> = [
    [20, "capricorn", "aquarius"],
    [19, "aquarius", "pisces"],
    [21, "pisces", "aries"],
    [20, "aries", "taurus"],
    [21, "taurus", "gemini"],
    [21, "gemini", "cancer"],
    [23, "cancer", "leo"],
    [23, "leo", "virgo"],
    [23, "virgo", "libra"],
    [23, "libra", "scorpio"],
    [22, "scorpio", "sagittarius"],
    [22, "sagittarius", "capricorn"],
  ];
  const [cutoff, before, after] = boundary[month - 1];
  return day < cutoff ? before : after;
}

function parseBirthDate(value: string): { month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getTime() > Date.now()
  ) {
    return null;
  }
  return { month, day };
}

function safeHeader(req: Request, name: string): string | undefined {
  const value = req.header(name);
  return value && value.length <= 200 ? value : undefined;
}

function getEdgeContext(req: Request) {
  // Cloudflare Worker should copy request.cf values into these trusted headers after stripping
  // client-supplied versions. They describe CURRENT location only, never birthplace.
  const latitude = Number(safeHeader(req, "x-cf-latitude"));
  const longitude = Number(safeHeader(req, "x-cf-longitude"));
  const context = {
    city: safeHeader(req, "x-cf-city"),
    region: safeHeader(req, "x-cf-region"),
    country: safeHeader(req, "cf-ipcountry"),
    timezone: safeHeader(req, "x-cf-timezone"),
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
  };
  return Object.fromEntries(Object.entries(context).filter(([, value]) => value !== undefined));
}

router.get("/astro/intro", (_req, res) => {
  res.json({
    enabled: true,
    requiresBirthday: true,
    personalizationLocked: true,
    personalizationUnlockMethod: "rewarded_ad",
    message: "Add your birthday for a daily zodiac reading. Personalized birth-chart readings unlock after a rewarded ad.",
  });
});

router.post("/astro/basic", async (req, res) => {
  const body = birthDateSchema.safeParse(req.body);
  const birthDate = body.success ? parseBirthDate(body.data.dateOfBirth) : null;
  if (!birthDate) {
    res.status(400).json({ code: "INVALID_BIRTH_DATE", message: "Provide a valid birth date in YYYY-MM-DD format." });
    return;
  }

  const apiUrl = process.env.ASTRO_API_URL ?? "https://json.astrologyapi.com/v1";
  const apiKey = process.env.ASTRO_API_KEY;
  if (!apiKey) {
    req.log?.error({ service: "astrologyapi", reason: "missing_configuration" }, "Astrology service is not configured");
    res.status(503).json({ code: "ASTRO_NOT_CONFIGURED", message: "Astrology service is not configured." });
    return;
  }

  const sign = getSunSign(birthDate.month, birthDate.day);
  try {
    const providerResponse = await fetch(`${apiUrl.replace(/\/$/, "")}/sun_sign_prediction/daily/${sign}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-astrologyapi-key": apiKey,
      },
      body: "{}",
    });

    if (providerResponse.status === 401 || providerResponse.status === 403) {
      req.log?.error({ service: "astrologyapi", status: providerResponse.status }, "Astrology provider authentication failed");
      res.status(503).json({ code: "ASTRO_AUTH_FAILED", message: "Astrology service authentication failed." });
      return;
    }
    if (!providerResponse.ok) {
      req.log?.warn({ service: "astrologyapi", status: providerResponse.status }, "Astrology provider request failed");
      res.status(503).json({ code: "ASTRO_UNAVAILABLE", message: "Astrology service is temporarily unavailable." });
      return;
    }

    const parsed = providerResponseSchema.safeParse(await providerResponse.json());
    if (!parsed.success) {
      req.log?.warn({ service: "astrologyapi", reason: "invalid_response" }, "Astrology provider returned an unexpected response");
      res.status(503).json({ code: "ASTRO_INVALID_RESPONSE", message: "Astrology service returned an unexpected response." });
      return;
    }

    const prediction = parsed.data.prediction;
    const sections = {
      personalLife: prediction.personal_life,
      profession: prediction.profession,
      health: prediction.health,
      emotions: prediction.emotions,
      travel: prediction.travel,
      luck: prediction.luck,
    };
    const dailyMessage = prediction.personal_life || prediction.emotions || prediction.luck;

    res.json({
      sign,
      greeting: `Your ${sign.charAt(0).toUpperCase()}${sign.slice(1)} reading`,
      dailyMessage,
      sections,
      edgeContext: getEdgeContext(req),
      source: "astrologyapi",
    });
  } catch (error) {
    req.log?.error({ service: "astrologyapi", errorType: error instanceof Error ? error.name : "unknown" }, "Astrology provider request errored");
    res.status(503).json({ code: "ASTRO_UNAVAILABLE", message: "Astrology service is temporarily unavailable." });
  }
});

// TODO(personalized-astro): Add an authenticated, rewarded-ad-gated endpoint only after the
// project defines its user identity/session contract and a server-verifiable rewarded-ad proof.
// That endpoint may then collect birth time and birthplace, resolve birthplace coordinates and
// historical timezone server-side, and call birth-chart/personalized AstrologyAPI endpoints.

export default router;
