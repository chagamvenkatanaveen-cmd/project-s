import * as cheerio from "cheerio";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export function clean(str = "") {
  return String(str)
    .replace(/\s+/g, " ")
    .replace(/[\n\r\t]/g, " ")
    .trim();
}

export function slugify(str = "") {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Clean flag helper
export function getTeamFlag(teamName = "") {
  const n = teamName.toLowerCase();
  if (n.includes("ind") || n.includes("india")) return "🇮🇳";
  if (n.includes("aus") || n.includes("australia")) return "🇦🇺";
  if (n.includes("eng") || n.includes("england")) return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (n.includes("sa") || n.includes("south africa")) return "🇿🇦";
  if (n.includes("nz") || n.includes("new zealand")) return "🇳🇿";
  if (n.includes("pak") || n.includes("pakistan")) return "🇵🇰";
  if (n.includes("wi") || n.includes("west indies")) return "🌴";
  if (n.includes("sl") || n.includes("sri lanka")) return "🇱🇰";
  if (n.includes("ban") || n.includes("bangladesh")) return "🇧🇩";
  if (n.includes("afg") || n.includes("afghanistan")) return "🇦🇫";
  if (n.includes("zim") || n.includes("zimbabwe")) return "🇿🇼";
  if (n.includes("ire") || n.includes("ireland")) return "🇮🇪";
  if (n.includes("sco") || n.includes("scotland")) return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
  if (n.includes("ned") || n.includes("netherlands")) return "🇳🇱";
  if (n.includes("nep") || n.includes("nepal")) return "🇳🇵";
  if (n.includes("uae")) return "🇦🇪";
  if (n.includes("usa")) return "🇺🇸";
  return "🏏";
}

function isExcluded(rawText = "") {
  if (!rawText) return false;
  const t = rawText.toLowerCase().replace(/[-_]/g, " ");

  // 1. Strict Year Filter: Reject any 2027 or beyond
  if (/\b2027\b|\b2028\b|\b27\b|2023-27|2024-27|2025-27|2026-27/i.test(t)) return true;
  if (/202[7-9]/i.test(t)) return true;

  // 2. Reject TBC / TBD placeholders
  if (/\btbc\b|\btbd\b/i.test(t)) return true;

  // 3. Reject U19, youth, junior, unofficial, and 'A' team matches
  if (/\bu19\b|\bu 19\b|under 19|under19|youth|junior|emerging|lions|unofficial/i.test(t)) return true;
  if (/\bengland a\b|\bireland a\b|\bindia a\b|\baustralia a\b|\bnew zealand a\b|\bsouth africa a\b/i.test(t)) return true;
  if (/\beng a\b|\bire a\b|\bind a\b|\baus a\b|\bnz a\b|\bsa a\b/i.test(t)) return true;

  // 4. Reject Domestic state/regional tournaments
  if (/ranji|sheffield|syed mushtaq|vijay hazare|quaid|plunket|marsh cup|elite group|plate group|division|sub regional|regional|chinnaswamy|dharamsala/i.test(t)) return true;

  // 5. Reject low-tier qualifiers / associate challenge leagues
  if (/challenge league|qualifier play off|world cup league 2|wccl/i.test(t)) return true;

  return false;
}

export async function getLiveCricketScores() {
  try {
    const res = await fetch("https://www.cricbuzz.com/cricket-match/live-scores", {
      headers: HEADERS,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Cricbuzz live scores: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const matches = [];
    const seenIds = new Set();

    $('a[href*="/live-cricket-scores/"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      const m = href.match(/\/live-cricket-scores\/(\d+)\/([^/?#]+)/);
      if (!m) return;

      const id = m[1];
      const slug = m[2];

      if (seenIds.has(id)) return;
      seenIds.add(id);

      const titleAttr = $(el).attr("title") || $(el).text().trim() || slug.replace(/-/g, " ");
      const title = clean(titleAttr.split(" - ")[0]);
      const statusNote = clean(titleAttr.split(" - ")[1] || "Match Action");

      // Check exclusion on both slug and title and statusNote
      if (isExcluded(slug) || isExcluded(title) || isExcluded(statusNote)) return;

      const slugParts = slug.split("-");
      const teamA = (slugParts[0] || "T1").toUpperCase();
      const teamB = (slugParts[2] || "T2").toUpperCase();

      const isComplete = /won|draw|tied|no result|complete/i.test(statusNote);
      const isUpcoming = /starts|preview|scheduled|toss|yet to begin/i.test(statusNote);

      let status = "live";
      if (isComplete) status = "completed";
      else if (isUpcoming) status = "upcoming";

      // Detect format
      let format = "Live Match";
      if (/test/i.test(slug) || /test/i.test(title)) format = "Test";
      else if (/odi/i.test(slug) || /odi/i.test(title)) format = "ODI";
      else if (/t20/i.test(slug) || /t20/i.test(title)) format = "T20";
      else if (/t10/i.test(slug) || /t10/i.test(title)) format = "T10";

      // Extract Series Name
      let seriesName = format;
      const seriesMatch = slug.match(/-(.+)-(202\d)$/);
      if (seriesMatch && seriesMatch[1]) {
        seriesName = seriesMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }

      matches.push({
        id,
        slug,
        title,
        teamA,
        teamB,
        team1: teamA,
        team2: teamB,
        flagA: getTeamFlag(teamA),
        flagB: getTeamFlag(teamB),
        statusNote,
        status, // 'live' | 'upcoming' | 'completed'
        format,
        seriesName,
      });
    });

    const live = matches.filter((m) => m.status === "live");
    const upcoming = matches.filter((m) => m.status === "upcoming");
    const completed = matches.filter((m) => m.status === "completed");

    return {
      live,
      upcoming,
      completed,
      totalCount: matches.length,
      lastUpdated: new Date().toLocaleTimeString(),
    };
  } catch (err) {
    console.error("Cricbuzz scraper error:", err.message);
    return { live: [], upcoming: [], completed: [], totalCount: 0, lastUpdated: new Date().toLocaleTimeString() };
  }
}

export async function getMatchScorecard(matchId) {
  const cleanId = String(matchId).trim().replace(/[^\d]/g, "");
  if (!cleanId) throw new Error("Invalid match ID");

  const [scorecardRes, mainRes] = await Promise.all([
    fetch(`https://www.cricbuzz.com/live-cricket-scorecard/${cleanId}`, { headers: HEADERS, cache: "no-store" }),
    fetch(`https://www.cricbuzz.com/live-cricket-scores/${cleanId}`, { headers: HEADERS, cache: "no-store" }),
  ]);

  if (!scorecardRes.ok) throw new Error(`Scorecard fetch failed for ${cleanId}`);

  const [scorecardHtml, mainHtml] = await Promise.all([scorecardRes.text(), mainRes.text()]);
  const $sc = cheerio.load(scorecardHtml);
  const $main = cheerio.load(mainHtml);

  const ogTitle = $main('meta[property="og:title"]').attr("content") || "";
  const pageTitle = $main("title").text().replace(/^Cricket commentary\s*\|\s*/i, "").trim();

  let sportsEvent = null;
  $main('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($main(el).html());
      if (data["@type"] === "SportsEvent") sportsEvent = data;
    } catch (e) {}
  });

  const series = sportsEvent?.superEvent?.name || "International Cricket";
  const venue = sportsEvent?.location?.name || "Cricket Ground";
  const teamAName = sportsEvent?.competitor?.[0]?.name || "Team 1";
  const teamBName = sportsEvent?.competitor?.[1]?.name || "Team 2";

  const scoreParts = ogTitle.split("|");
  const rawScore = clean(scoreParts[0] || "");

  const batRows = [];
  $sc(".scorecard-bat-grid").each((_, el) => {
    const cols = [];
    $sc(el).children().each((_, child) => {
      cols.push(clean($sc(child).text()));
    });

    if (cols.length >= 6 && cols[0] !== "Batter") {
      let rawName = cols[0].split("View match performance")[0];
      batRows.push({
        name: clean(rawName),
        dismissal: clean(cols[0].split("View match performance")[1] || "not out"),
        runs: cols[1] || "0",
        balls: cols[2] || "0",
        fours: cols[3] || "0",
        sixes: cols[4] || "0",
        strikeRate: cols[5] || "0.00",
      });
    }
  });

  const bowlRows = [];
  $sc(".scorecard-bowl-grid").each((_, el) => {
    const cols = [];
    $sc(el).children().each((_, child) => {
      cols.push(clean($sc(child).text()));
    });

    if (cols.length >= 8 && cols[0] !== "Bowler") {
      let rawBowler = cols[0].replace(/View match performance/g, "");
      bowlRows.push({
        name: clean(rawBowler),
        overs: cols[1] || "0",
        maidens: cols[2] || "0",
        runs: cols[3] || "0",
        wickets: cols[4] || "0",
        noBalls: cols[5] || "0",
        wides: cols[6] || "0",
        economy: cols[7] || "0.00",
      });
    }
  });

  return {
    id: cleanId,
    title: pageTitle || `${teamAName} vs ${teamBName}`,
    seriesName: series,
    venue,
    team1: teamAName,
    team2: teamBName,
    status: rawScore || "Live Match Details",
    state: "Live",
    format: "International",
    score1: "",
    score2: "",
    batsmen: batRows,
    bowlers: bowlRows,
    lastUpdated: new Date().toLocaleTimeString(),
  };
}
