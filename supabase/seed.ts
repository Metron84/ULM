import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type TeamSeed = {
  name: string;
  short_name: string;
  league_code: string;
};

type PlayerSeed = {
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  nationality: string;
  current_club: string;
  sofascore_id?: string;
  team: string;
};

type FixtureSeed = {
  home: string;
  away: string;
  match_date: string;
};

type Persona = "analyst" | "diehard_fan" | "fantasy_veteran";
type FunctionType = "captain_recommender" | "transfer_suggestion";

type SeedResult = {
  competitionId: string;
  teams: number;
  players: number;
  fixtures: number;
  templates: number;
};

const WORLD_CUP_COMPETITION = {
  name: "World Cup 2026",
  type: "tournament" as const,
  start_date: "2026-06-11",
  end_date: "2026-07-19",
  status: "upcoming" as const,
  roster_size_min: 11,
  roster_size_max: 23,
  scoring_rules: {
    goal: 5,
    assist: 3,
    clean_sheet_gk_def: 4,
    yellow_card: -1,
    red_card: -3,
    captain_multiplier: 2,
  },
};

const teams: TeamSeed[] = [
  { name: "France", short_name: "FRA", league_code: "FRA" },
  { name: "England", short_name: "ENG", league_code: "ENG" },
  { name: "Argentina", short_name: "ARG", league_code: "ARG" },
  { name: "Brazil", short_name: "BRA", league_code: "BRA" },
  { name: "Portugal", short_name: "POR", league_code: "POR" },
  { name: "Spain", short_name: "ESP", league_code: "ESP" },
  { name: "Norway", short_name: "NOR", league_code: "NOR" },
  { name: "Egypt", short_name: "EGY", league_code: "EGY" },
];

const players: PlayerSeed[] = [
  { name: "Kylian Mbappe", position: "FWD", nationality: "France", current_club: "Real Madrid", team: "France" },
  { name: "Ousmane Dembele", position: "FWD", nationality: "France", current_club: "Paris Saint-Germain", team: "France" },
  { name: "Antoine Griezmann", position: "MID", nationality: "France", current_club: "Atletico Madrid", team: "France" },
  { name: "Aurelien Tchouameni", position: "MID", nationality: "France", current_club: "Real Madrid", team: "France" },
  { name: "Theo Hernandez", position: "DEF", nationality: "France", current_club: "AC Milan", team: "France" },
  { name: "Dayot Upamecano", position: "DEF", nationality: "France", current_club: "Bayern Munich", team: "France" },
  { name: "Mike Maignan", position: "GK", nationality: "France", current_club: "AC Milan", team: "France" },
  { name: "William Saliba", position: "DEF", nationality: "France", current_club: "Arsenal", team: "France" },

  { name: "Harry Kane", position: "FWD", nationality: "England", current_club: "Bayern Munich", team: "England" },
  { name: "Jude Bellingham", position: "MID", nationality: "England", current_club: "Real Madrid", team: "England" },
  { name: "Bukayo Saka", position: "FWD", nationality: "England", current_club: "Arsenal", team: "England" },
  { name: "Phil Foden", position: "MID", nationality: "England", current_club: "Manchester City", team: "England" },
  { name: "Declan Rice", position: "MID", nationality: "England", current_club: "Arsenal", team: "England" },
  { name: "John Stones", position: "DEF", nationality: "England", current_club: "Manchester City", team: "England" },
  { name: "Kyle Walker", position: "DEF", nationality: "England", current_club: "Manchester City", team: "England" },
  { name: "Jordan Pickford", position: "GK", nationality: "England", current_club: "Everton", team: "England" },

  { name: "Lionel Messi", position: "FWD", nationality: "Argentina", current_club: "Inter Miami", team: "Argentina" },
  { name: "Julian Alvarez", position: "FWD", nationality: "Argentina", current_club: "Atletico Madrid", team: "Argentina" },
  { name: "Lautaro Martinez", position: "FWD", nationality: "Argentina", current_club: "Inter Milan", team: "Argentina" },
  { name: "Alexis Mac Allister", position: "MID", nationality: "Argentina", current_club: "Liverpool", team: "Argentina" },
  { name: "Enzo Fernandez", position: "MID", nationality: "Argentina", current_club: "Chelsea", team: "Argentina" },
  { name: "Cristian Romero", position: "DEF", nationality: "Argentina", current_club: "Tottenham", team: "Argentina" },
  { name: "Nicolas Otamendi", position: "DEF", nationality: "Argentina", current_club: "Benfica", team: "Argentina" },
  { name: "Emiliano Martinez", position: "GK", nationality: "Argentina", current_club: "Aston Villa", team: "Argentina" },

  { name: "Vinicius Junior", position: "FWD", nationality: "Brazil", current_club: "Real Madrid", team: "Brazil" },
  { name: "Rodrygo", position: "FWD", nationality: "Brazil", current_club: "Real Madrid", team: "Brazil" },
  { name: "Raphinha", position: "FWD", nationality: "Brazil", current_club: "Barcelona", team: "Brazil" },
  { name: "Bruno Guimaraes", position: "MID", nationality: "Brazil", current_club: "Newcastle United", team: "Brazil" },
  { name: "Lucas Paqueta", position: "MID", nationality: "Brazil", current_club: "West Ham United", team: "Brazil" },
  { name: "Marquinhos", position: "DEF", nationality: "Brazil", current_club: "Paris Saint-Germain", team: "Brazil" },
  { name: "Eder Militao", position: "DEF", nationality: "Brazil", current_club: "Real Madrid", team: "Brazil" },
  { name: "Alisson Becker", position: "GK", nationality: "Brazil", current_club: "Liverpool", team: "Brazil" },

  { name: "Cristiano Ronaldo", position: "FWD", nationality: "Portugal", current_club: "Al Nassr", team: "Portugal" },
  { name: "Rafael Leao", position: "FWD", nationality: "Portugal", current_club: "AC Milan", team: "Portugal" },
  { name: "Bernardo Silva", position: "MID", nationality: "Portugal", current_club: "Manchester City", team: "Portugal" },
  { name: "Bruno Fernandes", position: "MID", nationality: "Portugal", current_club: "Manchester United", team: "Portugal" },
  { name: "Joao Palhinha", position: "MID", nationality: "Portugal", current_club: "Bayern Munich", team: "Portugal" },
  { name: "Ruben Dias", position: "DEF", nationality: "Portugal", current_club: "Manchester City", team: "Portugal" },
  { name: "Nuno Mendes", position: "DEF", nationality: "Portugal", current_club: "Paris Saint-Germain", team: "Portugal" },
  { name: "Diogo Costa", position: "GK", nationality: "Portugal", current_club: "FC Porto", team: "Portugal" },

  { name: "Lamine Yamal", position: "FWD", nationality: "Spain", current_club: "Barcelona", team: "Spain" },
  { name: "Alvaro Morata", position: "FWD", nationality: "Spain", current_club: "AC Milan", team: "Spain" },
  { name: "Pedri", position: "MID", nationality: "Spain", current_club: "Barcelona", team: "Spain" },
  { name: "Rodri", position: "MID", nationality: "Spain", current_club: "Manchester City", team: "Spain" },
  { name: "Nico Williams", position: "FWD", nationality: "Spain", current_club: "Athletic Club", team: "Spain" },
  { name: "Aymeric Laporte", position: "DEF", nationality: "Spain", current_club: "Al Nassr", team: "Spain" },
  { name: "Dani Carvajal", position: "DEF", nationality: "Spain", current_club: "Real Madrid", team: "Spain" },
  { name: "Unai Simon", position: "GK", nationality: "Spain", current_club: "Athletic Club", team: "Spain" },

  { name: "Erling Haaland", position: "FWD", nationality: "Norway", current_club: "Manchester City", team: "Norway" },
  { name: "Alexander Sorloth", position: "FWD", nationality: "Norway", current_club: "Atletico Madrid", team: "Norway" },
  { name: "Martin Odegaard", position: "MID", nationality: "Norway", current_club: "Arsenal", team: "Norway" },
  { name: "Sander Berge", position: "MID", nationality: "Norway", current_club: "Burnley", team: "Norway" },
  { name: "Patrick Berg", position: "MID", nationality: "Norway", current_club: "Bodo/Glimt", team: "Norway" },
  { name: "Leo Ostigard", position: "DEF", nationality: "Norway", current_club: "Rennes", team: "Norway" },
  { name: "Kristoffer Ajer", position: "DEF", nationality: "Norway", current_club: "Brentford", team: "Norway" },
  { name: "Orjan Nyland", position: "GK", nationality: "Norway", current_club: "Sevilla", team: "Norway" },

  { name: "Mohamed Salah", position: "FWD", nationality: "Egypt", current_club: "Liverpool", team: "Egypt" },
  { name: "Mostafa Mohamed", position: "FWD", nationality: "Egypt", current_club: "Nantes", team: "Egypt" },
  { name: "Omar Marmoush", position: "FWD", nationality: "Egypt", current_club: "Manchester City", team: "Egypt" },
  { name: "Mohamed Elneny", position: "MID", nationality: "Egypt", current_club: "Al Jazira", team: "Egypt" },
  { name: "Trezeguet", position: "MID", nationality: "Egypt", current_club: "Trabzonspor", team: "Egypt" },
  { name: "Ahmed Hegazi", position: "DEF", nationality: "Egypt", current_club: "Al Ittihad", team: "Egypt" },
  { name: "Mohamed Abdelmonem", position: "DEF", nationality: "Egypt", current_club: "Nice", team: "Egypt" },
  { name: "Mohamed El Shenawy", position: "GK", nationality: "Egypt", current_club: "Al Ahly", team: "Egypt" },
];

const fixtures: FixtureSeed[] = [
  { home: "France", away: "England", match_date: "2026-06-13T18:00:00Z" },
  { home: "Argentina", away: "Brazil", match_date: "2026-06-14T19:00:00Z" },
  { home: "Portugal", away: "Spain", match_date: "2026-06-15T20:00:00Z" },
  { home: "Norway", away: "Egypt", match_date: "2026-06-16T17:00:00Z" },
  { home: "France", away: "Argentina", match_date: "2026-06-19T19:30:00Z" },
  { home: "England", away: "Brazil", match_date: "2026-06-20T19:30:00Z" },
];

const personaCaptains: Record<Persona, string[]> = {
  analyst: [
    "You are Habermas in Analyst mode. Rank captain options by projected floor and ceiling using form, fixture quality, and expected minutes. Return: primary captain, vice-captain, and one high-upside differential with short reasoning.",
    "As an analyst, evaluate captaincy by weighted factors: xG/xA trend, opponent defensive weakness, set-piece share, and substitution risk. Provide top 3 captain picks with confidence percentages.",
    "Use a risk-adjusted model for captain selection. Prioritize consistency for head-to-head and upside for overall rank chase. Return one safe captain and one aggressive captain with scenario notes.",
    "Compare captain candidates with a concise matrix: goal involvement rate, home/away split, and fixture pace. Recommend captain and vice-captain, then include one avoid warning.",
    "Act as a fantasy analyst assistant. Choose captaincy based on probable points and multiplier impact. Explain in plain language and include a fallback if late lineup news changes.",
    "Generate captain guidance optimized for this roster. Account for role security, penalty duty, and match context. Return final captain call in one sentence, plus two backup options.",
  ],
  diehard_fan: [
    "You are Habermas in Diehard Fan mode. Pick captains with passion and momentum. Blend crowd energy, big-game mentality, and current form. Return captain, vice-captain, and one bold wildcard.",
    "Think like a devoted supporter and fantasy winner. Recommend captaincy from players most likely to seize the spotlight this week. Include a hype meter from 1-10.",
    "Deliver an emotional but credible captain recommendation. Weigh confidence, killer instinct, and fixture drama. Provide top 3 with short fan-style rationale.",
    "Choose captain and vice-captain using narrative edge: rivalry stakes, confidence streak, and attacking freedom. Add one upset pick for dopamine upside.",
    "As a diehard strategist, balance heart and data. Offer captain call, backup plan, and a one-line locker-room speech to justify the decision.",
    "Pick the captain who can define the matchday. Include one safe hero and one chaos hero, with clear triggers for when to choose each.",
  ],
  fantasy_veteran: [
    "You are Habermas in Fantasy Veteran mode. Recommend captaincy with disciplined strategy: expected minutes, role certainty, and historical consistency. Return captain, vice-captain, and contingency.",
    "Act like a seasoned manager protecting rank while hunting edges. Provide safe captain, upside captain, and the pivot plan if starting XI news breaks late.",
    "Use veteran heuristics for captain picks: reliability first, upside second, variance control always. Return top 3 options with concise pros/cons.",
    "Recommend captaincy for long-term fantasy success. Include one conservative option and one calculated differential with probability-based confidence labels.",
    "Prioritize captain choices with strong floor and proven conversion. Mention penalty/set-piece duty and tactical matchup. End with a clear final call.",
    "As a fantasy veteran, build a captain strategy resilient to surprises. Provide captain, vice-captain, and one emergency switch if minutes risk appears.",
  ],
};

const personaTransfers: Record<Persona, string[]> = {
  analyst: [
    "You are Habermas in Analyst mode. Suggest 3 transfer moves ranked by projected net points over the next 3 fixtures. Include buy, sell, and one hold recommendation.",
    "Evaluate transfer options with data-first logic: form trajectory, role stability, fixture difficulty, and opportunity cost. Return best transfer in and transfer out with confidence score.",
    "Run a transfer audit for this roster. Identify weak slots and recommend upgrades by expected value and budget efficiency. Include one low-ownership upside move.",
    "Provide transfer suggestions that optimize both immediate return and medium-term flexibility. Include one aggressive move and one conservative move with trade-offs.",
    "Generate a transfer shortlist with risk labels (low, medium, high). Use upcoming fixtures and expected minutes to justify each recommendation.",
    "Act as tactical analyst for transfers. Recommend exact swap pairs and explain why each improves points potential while preserving squad balance.",
  ],
  diehard_fan: [
    "You are Habermas in Diehard Fan mode. Recommend electrifying transfer moves with momentum and excitement, but keep choices realistic. Provide top 3 moves with hype level.",
    "Pick transfer targets who can swing matchdays. Blend form, confidence, and upcoming spotlight fixtures. Include one bold differential transfer.",
    "Deliver fan-powered transfer advice: who to bring in, who to move out, and why this sparks the squad. Keep rationale short and energetic.",
    "Suggest transfers that maximize dopamine points: explosive attackers, in-form creators, and statement picks. Include one safe and one thrilling option.",
    "As a diehard fantasy voice, propose transfer upgrades with emotional momentum and tactical sense. Return final transfer verdict plus backup plan.",
    "Recommend transfer moves for a manager chasing weekly glory. Include expected impact, confidence, and one wildcard move for high-reward upside.",
  ],
  fantasy_veteran: [
    "You are Habermas in Fantasy Veteran mode. Recommend disciplined transfers prioritizing consistency, minutes, and fixture runway. Include one premium and one value move.",
    "Advise transfers like a long-term winner: avoid hits unless justified, strengthen weak links, and protect captaincy options. Provide top swap pair and why.",
    "Build a veteran transfer plan for the next 3 matchdays. Suggest best in/out moves with floor-ceiling notes and risk control.",
    "Recommend pragmatic transfers that preserve squad structure and future flexibility. Include one immediate points move and one strategic setup move.",
    "Use veteran decision rules for transfers: secure starts, role clarity, and fixture sequencing. Return best transfer in, transfer out, and hold call.",
    "Offer transfer recommendations with measured aggression. Include one rank-protection move and one upside chase move, with clear trigger conditions.",
  ],
};

function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function runSeed(): Promise<SeedResult> {
  const supabase = getServiceRoleClient();

  const { data: competitionRow, error: competitionError } = await supabase
    .from("competitions")
    .upsert(WORLD_CUP_COMPETITION, { onConflict: "name,type,start_date" })
    .select("id")
    .single();

  if (competitionError || !competitionRow) {
    throw new Error(`Failed to upsert competition: ${competitionError?.message ?? "Unknown error"}`);
  }

  const competitionId = competitionRow.id as string;

  const teamPayload = teams.map((team) => ({
    competition_id: competitionId,
    name: team.name,
    short_name: team.short_name,
    league_code: team.league_code,
    logo_url: null as string | null,
  }));

  const { data: teamRows, error: teamsError } = await supabase
    .from("real_teams")
    .upsert(teamPayload, { onConflict: "competition_id,name" })
    .select("id,name");

  if (teamsError || !teamRows) {
    throw new Error(`Failed to upsert teams: ${teamsError?.message ?? "Unknown error"}`);
  }

  const teamIdByName = new Map<string, string>(teamRows.map((team) => [team.name as string, team.id as string]));

  const playerPayload = players.map((player) => ({
    competition_id: competitionId,
    real_team_id: teamIdByName.get(player.team) ?? null,
    name: player.name,
    position: player.position,
    nationality: player.nationality,
    current_club: player.current_club,
    sofascore_id: player.sofascore_id ?? null,
    photo_url: null as string | null,
    is_active: true,
  }));

  const { data: playerRows, error: playersError } = await supabase
    .from("players")
    .upsert(playerPayload, { onConflict: "competition_id,name" })
    .select("id,name");

  if (playersError || !playerRows) {
    throw new Error(`Failed to upsert players: ${playersError?.message ?? "Unknown error"}`);
  }

  const fixturePayload = fixtures.map((fixture) => ({
    competition_id: competitionId,
    home_team_id: teamIdByName.get(fixture.home),
    away_team_id: teamIdByName.get(fixture.away),
    match_date: fixture.match_date,
    status: "scheduled" as const,
    score_home: null as number | null,
    score_away: null as number | null,
  }));

  const invalidFixture = fixturePayload.find((fixture) => !fixture.home_team_id || !fixture.away_team_id);
  if (invalidFixture) {
    throw new Error("Fixture seed references a team that does not exist.");
  }

  const { data: fixtureRows, error: fixturesError } = await supabase
    .from("fixtures")
    .upsert(fixturePayload as never[], {
      onConflict: "competition_id,home_team_id,away_team_id,match_date",
      ignoreDuplicates: false,
    })
    .select("id");

  if (fixturesError || !fixtureRows) {
    throw new Error(`Failed to upsert fixtures: ${fixturesError?.message ?? "Unknown error"}`);
  }

  const templatePayload = (Object.keys(personaCaptains) as Persona[]).flatMap((persona) => {
    const captainTemplates = personaCaptains[persona].map((template_text, index) => ({
      persona,
      function_type: "captain_recommender" as FunctionType,
      template_text,
      variation_number: index + 1,
    }));

    const transferTemplates = personaTransfers[persona].map((template_text, index) => ({
      persona,
      function_type: "transfer_suggestion" as FunctionType,
      template_text,
      variation_number: index + 1,
    }));

    return [...captainTemplates, ...transferTemplates];
  });

  const { data: templateRows, error: templatesError } = await supabase
    .from("assistant_templates")
    .upsert(templatePayload, { onConflict: "persona,function_type,variation_number" })
    .select("id");

  if (templatesError || !templateRows) {
    throw new Error(`Failed to upsert assistant templates: ${templatesError?.message ?? "Unknown error"}`);
  }

  return {
    competitionId,
    teams: teamRows.length,
    players: playerRows.length,
    fixtures: fixtureRows.length,
    templates: templateRows.length,
  };
}
