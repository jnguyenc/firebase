function TeamColorSwatch({ team }) {
  if (!team?.color) return null

  return (
    <span
      aria-hidden="true"
      className="team-color-swatch"
      style={{ backgroundColor: team.color }}
    />
  )
}

export default TeamColorSwatch
