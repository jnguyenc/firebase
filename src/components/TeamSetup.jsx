import { useState } from 'react'
import { getTeamDisplayName } from '../utils/teamName'
import TeamName from './TeamName'

const teamColors = [
  { name: 'Red', value: '#dc2626', swatch: '🟥' },
  { name: 'Orange', value: '#ea580c', swatch: '🟧' },
  { name: 'Amber', value: '#d97706', swatch: '🟨' },
  { name: 'Yellow', value: '#ca8a04', swatch: '🟨' },
  { name: 'Green', value: '#16a34a', swatch: '🟩' },
  { name: 'Teal', value: '#0d9488', swatch: '🟩' },
  { name: 'Blue', value: '#2563eb', swatch: '🟦' },
  { name: 'Navy', value: '#1e3a8a', swatch: '🟦' },
  { name: 'Purple', value: '#7c3aed', swatch: '🟪' },
  { name: 'Pink', value: '#db2777', swatch: '🟪' },
  { name: 'Black', value: '#1f2937', swatch: '⬛' },
  { name: 'Gray', value: '#6b7280', swatch: '⬜' },
  { name: 'Light gray', value: '#d1d5db', swatch: '⬜' },
]

const defaultTeamColor = '#d1d5db'

function TeamSetup({
  isLoading,
  isSaving,
  onCreateTeam,
  onRemoveTeam,
  onUpdateTeam,
  allowPlayersOnMultipleTeams,
  onAllowPlayersOnMultipleTeamsChange,
  players,
  teams,
}) {
  const [firstPlayerId, setFirstPlayerId] = useState('')
  const [secondPlayerId, setSecondPlayerId] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamColor, setTeamColor] = useState(defaultTeamColor)
  const [editingTeamId, setEditingTeamId] = useState('')
  const [editedTeamName, setEditedTeamName] = useState('')
  const [editedTeamColor, setEditedTeamColor] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [removingTeamId, setRemovingTeamId] = useState('')
  const assignedPlayerIds = new Set(
    teams.flatMap((team) => team.playerIds ?? []),
  )
  const availablePlayers = allowPlayersOnMultipleTeams
    ? players
    : players.filter((player) => !assignedPlayerIds.has(player.id))
  const playerById = new Map(players.map((player) => [player.id, player]))

  async function handleSubmit(event) {
    event.preventDefault()
    if (!firstPlayerId || !secondPlayerId || firstPlayerId === secondPlayerId) {
      return
    }

    if (
      await onCreateTeam([firstPlayerId, secondPlayerId], teamName, teamColor)
    ) {
      setFirstPlayerId('')
      setSecondPlayerId('')
      setTeamName('')
      setTeamColor(defaultTeamColor)
    }
  }

  async function handleUpdateTeam(event, teamId) {
    event.preventDefault()
    const name = editedTeamName.trim()
    if (!name) return

    setIsSavingEdit(true)
    if (await onUpdateTeam(teamId, name, editedTeamColor)) {
      setEditingTeamId('')
    }
    setIsSavingEdit(false)
  }

  async function handleRemoveTeam(team) {
    if (
      !window.confirm(
        `Remove ${getTeamDisplayName(team, playerById)}? This cannot be undone.`,
      )
    ) return

    setRemovingTeamId(team.id)
    await onRemoveTeam(team.id)
    setRemovingTeamId('')
  }

  const sortedTeams = [...teams].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  )
  return (
    <section aria-labelledby="team-setup-title" className="team-section">
      <h2 id="team-setup-title">Set up teams</h2>
      <p className="section-description">
        Choose two different players for each team.
      </p>
      <label className="team-membership-toggle">
        <span>
          Allow players on multiple teams
          <small>
            {allowPlayersOnMultipleTeams
              ? 'Players already in a team can be selected again.'
              : 'Players already in a team are unavailable.'}
          </small>
        </span>
        <input
          checked={allowPlayersOnMultipleTeams}
          onChange={(event) => {
            const allowMultipleTeams = event.target.checked
            onAllowPlayersOnMultipleTeamsChange(allowMultipleTeams)
            if (!allowMultipleTeams) {
              setFirstPlayerId('')
              setSecondPlayerId('')
            }
          }}
          role="switch"
          type="checkbox"
        />
        <span aria-hidden="true" className="switch-track" />
      </label>
      <form className="team-form" onSubmit={handleSubmit}>
        <label>
          First player
          <select
            onChange={(event) => setFirstPlayerId(event.target.value)}
            required
            value={firstPlayerId}
          >
            <option value="">Select a player</option>
            {availablePlayers.map((player) => (
              <option key={player.id} value={player.id}>
                {player.firstName} {player.lastName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Second player
          <select
            onChange={(event) => setSecondPlayerId(event.target.value)}
            required
            value={secondPlayerId}
          >
            <option value="">Select a player</option>
            {availablePlayers
              .filter((player) => player.id !== firstPlayerId)
              .map((player) => (
                <option key={player.id} value={player.id}>
                  {player.firstName} {player.lastName}
                </option>
              ))}
          </select>
        </label>
        <label>
          Team name (optional)
          <input
            maxLength={50}
            onChange={(event) => setTeamName(event.target.value)}
            value={teamName}
          />
        </label>
        <label>
          Team color (optional)
          <select
            onChange={(event) => setTeamColor(event.target.value)}
            value={teamColor}
          >
            <option value="">No color</option>
            {teamColors.map((color) => (
              <option key={color.value} value={color.value}>
                {color.swatch} {color.name}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={isLoading || isSaving || availablePlayers.length < 2}
          type="submit"
        >
          {isSaving ? 'Creating…' : 'Create team'}
        </button>
      </form>

      <h3 className="subsection-title">Teams ({teams.length})</h3>
      {isLoading ? (
        <p>Loading teams…</p>
      ) : teams.length === 0 ? (
        <p className="empty-message">No teams yet.</p>
      ) : (
        <ol className="team-list">
          {sortedTeams.map((team) => (
            <li key={team.id}>
              {editingTeamId === team.id ? (
                <form
                  className="team-rename-form"
                  onSubmit={(event) => handleUpdateTeam(event, team.id)}
                >
                  <label>
                    Team name
                    <input
                      autoFocus
                      maxLength={50}
                      onChange={(event) => setEditedTeamName(event.target.value)}
                      required
                      value={editedTeamName}
                    />
                  </label>
                  <label>
                    Team color
                    <select
                      onChange={(event) =>
                        setEditedTeamColor(event.target.value)
                      }
                      value={editedTeamColor}
                    >
                      <option value="">No color</option>
                      {teamColors.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.swatch} {color.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button disabled={isSavingEdit} type="submit">
                    {isSavingEdit ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setEditingTeamId('')
                      setEditedTeamName('')
                      setEditedTeamColor('')
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <strong>
                  <TeamName playersById={playerById} showMemberNames={false} team={team} />
                </strong>
              )}
              <span className="team-members">
                {(team.playerIds ?? []).map((id, index) => (
                  <span key={id}>
                    {index > 0 && ' & '}
                    {playerById.has(id) ? (
                      `${playerById.get(id).firstName} ${playerById.get(id).lastName}`
                    ) : (
                      'Unknown player'
                    )}
                  </span>
                ))}
              </span>
              {editingTeamId !== team.id && (
                <div className="team-actions">
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setEditingTeamId(team.id)
                      setEditedTeamName(team.name)
                      setEditedTeamColor(team.color ?? '')
                    }}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="secondary-button remove-button"
                    disabled={removingTeamId === team.id}
                    onClick={() => handleRemoveTeam(team)}
                    type="button"
                  >
                    {removingTeamId === team.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default TeamSetup
