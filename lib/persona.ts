export type AssistantPersona = "analyst" | "diehard_fan" | "fantasy_veteran";

export function personaLabel(persona: AssistantPersona) {
  switch (persona) {
    case "analyst":
      return "The Analyst";
    case "diehard_fan":
      return "The Die-Hard Fan";
    case "fantasy_veteran":
      return "The Fantasy Veteran";
  }
}

export function personaEmoji(persona: AssistantPersona) {
  switch (persona) {
    case "analyst":
      return "📊";
    case "diehard_fan":
      return "⚽";
    case "fantasy_veteran":
      return "🏆";
  }
}

export const postMatchReviewFallbacks: Record<AssistantPersona, string[]> = {
  analyst: [
    "Excellent decision profile: your captain returned above expected value and your squad minutes security held.",
    "We gained edge from high-probability assets; next step is improving differential conversion in midfield slots.",
    "Strong week overall. Fixture targeting was efficient, and your risk-adjusted picks preserved rank stability.",
    "Your transfer timing generated positive expected points. We should now optimize captaincy variance for the next round.",
    "Clean structure and disciplined choices today. Marginal gains came from role certainty and matchup quality.",
    "Performance was methodical and effective. Let's compound this by rotating into favorable fixture clusters.",
  ],
  diehard_fan: [
    "We smashed it, boss! That captain pick had me screaming at the TV.",
    "What a matchday! Your squad showed heart, and those points felt electric.",
    "This was pure vibes and results. The momentum is with us now.",
    "Huge energy from your picks today. We rode the wave and cashed in.",
    "You called it beautifully. The crowd would've gone wild for that captain return.",
    "That was a proper statement week. We came to play and delivered.",
  ],
  fantasy_veteran: [
    "Professional matchday management. Floor picks delivered and your upside play landed at the right time.",
    "Solid veteran week: controlled risk, healthy returns, and no unnecessary volatility.",
    "You climbed with discipline. The structure held, and your captaincy call did the heavy lifting.",
    "Sharp, efficient, and rank-conscious. This is how consistent seasons are built.",
    "Great execution. We protected downside and still found enough upside to push forward.",
    "Another composed performance. Keep this process and the ranks will keep moving.",
  ],
};
