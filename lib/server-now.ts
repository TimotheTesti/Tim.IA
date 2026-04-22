/**
 * Injected on every chat request so the model is not limited to its training
 * notion of "today" (often stuck on 2023/2024).
 */
export function getNowContextForPrompt(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const iso = now.toISOString()
  const paris = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(now)
  const nyc = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/New_York',
  }).format(now)

  return `## Current time (injected by server — trust this, not your training)
- **Current calendar year: ${year}**
- **Europe/Paris:** ${paris}
- **America/New_York:** ${nyc}
- **ISO (UTC):** ${iso}

Rules: Do not claim "we are in 2023" or "in 2024" as *today* for the user. For anything time-sensitive, call **webSearch** and use queries that name the year **${year}** or "latest" / "current" as appropriate. If results look old, run another **webSearch** with a more specific or narrower query.`
}
