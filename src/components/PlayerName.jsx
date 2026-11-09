function PlayerName({ player }) {
  return (
    <span>
      {player.firstName} {player.lastName}
      {player.gender && (
        <span
          aria-label={player.gender}
          className="gender-emoji"
          role="img"
        >
          {player.gender === 'Male' ? '👨' : '👩'}
        </span>
      )}
    </span>
  )
}

export default PlayerName
