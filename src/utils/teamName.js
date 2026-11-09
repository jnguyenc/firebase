const teamColorSymbols = {
  '#dc2626': '🟥',
  '#ea580c': '🟧',
  '#d97706': '🟧',
  '#ca8a04': '🟨',
  '#16a34a': '🟩',
  '#0d9488': '🟩',
  '#2563eb': '🟦',
  '#1e3a8a': '🟦',
  '#7c3aed': '🟪',
  '#db2777': '🟪',
  '#1f2937': '⬛',
  '#6b7280': '⬜',
  '#d1d5db': '⬜',
}

export function getTeamColorSymbol(color) {
  return teamColorSymbols[color?.toLowerCase()] ?? ''
}

export function getTeamMemberFirstNames(team, playersById) {
  return (team?.playerIds ?? [])
    .map((id) => {
      const player = playersById.get(id)
      if (!player) return null
      return player.firstName
    })
    .filter(Boolean)
}

export function getTeamDisplayName(team, playersById) {
  if (!team) return 'Unknown team'
  const memberNames = getTeamMemberFirstNames(team, playersById)
  return memberNames.length > 0
    ? `${team.name} (${memberNames.join(' & ')})`
    : team.name ?? 'Team'
}
