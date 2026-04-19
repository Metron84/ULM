import type { AssistantPersona } from "@/lib/persona";

export type AssistantFunctionType =
  | "draft_advisor"
  | "captain_recommender"
  | "transfer_suggestion"
  | "post_match_review"
  | "roster_health"
  | "quick_chat";

export type AssistantTemplateLibrary = Record<
  AssistantPersona,
  Record<AssistantFunctionType, string[]>
>;

export const assistantTemplates: AssistantTemplateLibrary = {
  analyst: {
    draft_advisor: [
      "Open with role-secure picks in rounds 1-3. Prioritize high-minutes forwards, then stack creators with favorable fixture clusters.",
      "Draft balance first: 2 premium attackers, 2 dependable midfield engines, and one clean-sheet defender anchor.",
      "Your draft edge is probability control. Avoid volatile bench slots until your starting XI floor is secure.",
      "Build around projected minutes and set-piece responsibility. Those two variables consistently outperform hype picks.",
      "If two players are close, take the one with better early fixtures. Short-term return compounds confidence and trade value.",
      "Draft with exit strategy in mind: every pick should have either safe floor or clear resale upside within 3 matchdays.",
    ],
    captain_recommender: [
      "Mbappé edges it statistically — 8.2 average rating, elite shot volume, and stable minutes. Captain him.",
      "By projection, Mbappé is the highest expected return. Vice-captain your secondary penalty taker.",
      "Captain the highest xGI profile with guaranteed minutes. This week, Mbappé remains optimal.",
      "The safest armband is attached to role certainty and fixture quality. Mbappé currently leads both dimensions.",
      "Quant model output: Mbappé first, Salah second, Haaland third. Armband on the top-ranked asset.",
      "For controlled variance, captain Mbappé and place vice on your next-highest set-piece dominant attacker.",
    ],
    transfer_suggestion: [
      "Sell the current asset — 6.8 avg rating and declining involvement. Buy Player X instead for immediate fixture upside.",
      "Transfer out the underperformer with falling expected minutes. Reallocate budget to a stable 90-minute attacker.",
      "Swap low-ceiling midfield volume for a higher xA profile. The opportunity cost is now too high to hold.",
      "Move from noisy form to repeatable output: prioritize players with penalties, corners, or central chance creation.",
      "This is a value reset window. Sell the stagnant pick and buy into a stronger 3-fixture run.",
      "You gain expected points by replacing your weakest starter with a role-secure differential in favorable matchups.",
    ],
    post_match_review: [
      "Strong execution. Your captaincy decision aligned with the highest probability return and protected overall rank.",
      "Good process today. The squad structure maintained floor while still offering selective upside exposure.",
      "You converted expected points efficiently. Next step is improving bench allocation for late substitution volatility.",
      "Your transfer timing worked; matchup targeting was accurate and minutes risk was managed well.",
      "This round was tactically sound. Differential exposure was measured and avoided unnecessary downside.",
      "High-quality management: controlled risk, strong captain return, and consistent point conversion across core slots.",
    ],
    roster_health: [
      "Roster health is stable: 9/11 starters project 75+ minutes. Monitor one defender flagged for rotation risk.",
      "Your squad is structurally healthy. One weak bench slot could hurt in congestion weeks; patch that next.",
      "Fitness outlook is positive, but your midfield depth is thin for short-turnaround fixtures.",
      "Current roster score: 8.4/10. Primary issue is one low-ceiling starter with declining involvement.",
      "Your team has a strong floor. Improve health further by replacing one high-variance bench attacker.",
      "Lineup durability is good overall. I recommend one defensive depth move to reduce clean-sheet volatility.",
    ],
    quick_chat: [
      "Happy to break down anything this week: captaincy, transfers, fixture difficulty, or risk strategy.",
      "Ask me for a quick decision tree and I’ll give you safe and aggressive paths in 30 seconds.",
      "Want a fast edge? Share your three toughest choices and I’ll rank them by expected value.",
      "I can summarize your best move now, plus a fallback plan if lineup news changes.",
      "Drop your dilemma and I’ll return a concise recommendation with confidence levels.",
      "Ready when you are. I can optimize your next move by floor, ceiling, or rank-chase mode.",
    ],
  },
  diehard_fan: {
    draft_advisor: [
      "Start your draft with players who live for big nights. We want stars who thrive when the lights are bright.",
      "Build a team with pulse: one captain monster, one creator artist, and one chaos differential every rival fears.",
      "Don’t draft scared. Lock your core heroes first, then add form players riding matchday energy.",
      "If the crowd can feel it, fantasy can feel it too. Draft confidence, momentum, and attacking intent.",
      "Take players with swagger and upside. This is how matchdays become unforgettable.",
      "Your draft should look dangerous: proven scorers, clutch creators, and one wildcard who can explode.",
    ],
    captain_recommender: [
      "Mate, Mbappé is buzzing right now... Slap the armband on him!",
      "You can feel the electricity — Mbappé is ready to tear this game open. Captain locked.",
      "This has captain haul written all over it. Mbappé gets the armband, no hesitation.",
      "Trust the vibe and the form curve: Mbappé is in full superstar mode this week.",
      "Big game, big moments, big returns. Captain Mbappé and enjoy the fireworks.",
      "If we’re chasing dopamine points, Mbappé is the one. Armband on and let’s fly.",
    ],
    transfer_suggestion: [
      "Bin him, boss — he’s been shocking lately. Bring in a live-wire attacker and watch the points jump.",
      "This is a vibes correction. Out with the flat pick, in with the player who’s actually cooking.",
      "Don’t overthink it — sell the stale asset and buy the one defenders hate facing right now.",
      "That current pick has no spark. Swap to a hot streak player before everyone else catches on.",
      "We need energy in this squad. Make the move and turn your lineup into a highlight reel.",
      "Pull the trigger: drop the passenger, sign the difference-maker, and own the weekend.",
    ],
    post_match_review: [
      "We smashed it, boss! That captain pick had me screaming at the TV.",
      "What a round! Your choices had pure matchday magic all over them.",
      "This was proper football chaos in the best way — and we came out winning.",
      "You managed with heart and it paid off. Big vibes, big points.",
      "That was elite energy from your squad. Keep this momentum rolling.",
      "Absolute scenes. Your decisions changed the whole matchday narrative.",
    ],
    roster_health: [
      "Squad energy is high, but one slot looks cold. Fresh legs there and we’re flying.",
      "Your roster is mostly glowing — just one underperformer is killing the buzz.",
      "Health check says strong core, shaky bench. Upgrade one backup and we’re cooking.",
      "Lineup feels alive right now. Keep the hot hands, drop the passengers.",
      "Most of your team has momentum, but one defender is a red flag for clean-sheet hopes.",
      "Roster vibes: 8/10. One smart swap and this team is terrifying.",
    ],
    quick_chat: [
      "Hit me with your toughest call — we’ll sort it in one clean move.",
      "I’m ready. Captain, transfer, wildcard drama... let’s go.",
      "Ask me anything and I’ll give you the bold play plus the safe backup.",
      "Give me your matchday fear and I’ll turn it into a winning plan.",
      "Need a quick verdict? I’ll keep it sharp and spicy.",
      "You bring the question, I bring the noise and the points path.",
    ],
  },
  fantasy_veteran: {
    draft_advisor: [
      "Draft for structure, not headlines. Secure minutes, role clarity, then selectively add upside.",
      "Prioritize durable starters early, then exploit value pockets in rounds 4-7 for long-term edge.",
      "A winning draft is risk allocation: stable core, two calculated punts, and no dead bench spots.",
      "Anchor your first picks with repeatable production. Variance belongs in late rounds only.",
      "Draft as if you’ll manage this roster for months: flexibility and fixture sequencing matter more than hype.",
      "Your edge is discipline. Build a resilient XI first, then chase differentials with intent.",
    ],
    captain_recommender: [
      "I’m captaining Mbappé in 4 of my leagues... differential gold if rivals overthink it.",
      "Veteran call: captain Mbappé, vice on your safest 90-minute penalty option.",
      "This is a process week — armband on Mbappé for floor and ceiling balance.",
      "Protect rank first, then seek upside. Mbappé remains the optimal captain profile.",
      "I’d avoid cute picks here. Take the premium certainty and move on.",
      "Captain Mbappé; the data and game script both support it. Clean, disciplined decision.",
    ],
    transfer_suggestion: [
      "Classic sell-low, buy-high. Dump him and grab the differential before ownership spikes.",
      "Move out the declining asset now; opportunity cost compounds quickly in this stretch.",
      "This is a timing transfer: sell before price erosion, buy before fixture swing upside is priced in.",
      "Veteran move: upgrade one weak starter, not two bench luxuries. Keep structure intact.",
      "Take the pragmatic swap with proven minutes and favorable next-three run.",
      "Transfer for sustainability: better role, better fixtures, and less captaincy risk downstream.",
    ],
    post_match_review: [
      "Professional matchday management. Floor picks delivered and your upside play landed at the right time.",
      "Solid veteran week: controlled risk, healthy returns, and no unnecessary volatility.",
      "You climbed with discipline. The structure held, and your captaincy call did the heavy lifting.",
      "Sharp, efficient, and rank-conscious. This is how consistent seasons are built.",
      "Great execution. We protected downside and still found enough upside to push forward.",
      "Another composed performance. Keep this process and the ranks will keep moving.",
    ],
    roster_health: [
      "Roster health is strong, but one low-minute slot is a strategic liability next round.",
      "Squad integrity is good: high floor, controlled variance, and one clear upgrade candidate.",
      "Your bench composition needs one dependable 60+ minute option to protect against rotation shocks.",
      "Health audit: 8.7/10. Strength in captain candidates, weakness in defensive depth.",
      "This roster can compete long-term with one simple fix: replace your least reliable starter.",
      "You’re in good shape. One proactive move now prevents two reactive moves later.",
    ],
    quick_chat: [
      "Share the decision and I’ll give you a veteran-safe line plus upside alternative.",
      "I can optimize your move for rank defense, rank attack, or balanced mode.",
      "Need a quick ruling? I’ll give you the move, confidence, and fallback.",
      "Let’s solve this with process: minutes, role, fixtures, and captain impact.",
      "Ask your question and I’ll keep it concise, strategic, and actionable.",
      "Ready for the next edge — what’s the decision point?",
    ],
  },
};

export const assistantFunctionMeta: Record<
  AssistantFunctionType,
  { title: string; description: string; icon: string }
> = {
  draft_advisor: {
    title: "Draft Advisor",
    description: "Build your squad architecture before kickoff.",
    icon: "🧠",
  },
  captain_recommender: {
    title: "Captain & Vice-Captain Recommender",
    description: "Armband calls tailored to your matchday profile.",
    icon: "🎯",
  },
  transfer_suggestion: {
    title: "Transfer / Buy-Sell Suggestions",
    description: "Identify upgrades, exits, and differential windows.",
    icon: "🔄",
  },
  post_match_review: {
    title: "Post-Matchday Review",
    description: "What worked, what missed, and what to improve next.",
    icon: "📈",
  },
  roster_health: {
    title: "Roster Health Check",
    description: "Measure stability, depth, and risk across your team.",
    icon: "🩺",
  },
  quick_chat: {
    title: "Quick Chat",
    description: "Ask anything and get instant persona-style guidance.",
    icon: "💬",
  },
};
