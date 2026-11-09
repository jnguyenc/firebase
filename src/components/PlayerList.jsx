import { useState } from 'react'
import PlayerName from './PlayerName'

function PlayerRow({ onUpdatePlayer, player }) {
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState(player.firstName)
  const [lastName, setLastName] = useState(player.lastName)
  const [gender, setGender] = useState(player.gender ?? '')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    if (await onUpdatePlayer(player.id, firstName, lastName, gender)) {
      setIsEditing(false)
    }
    setIsSaving(false)
  }

  if (!isEditing) {
    return (
      <li>
        <PlayerName player={player} />
        <button
          className="secondary-button"
          onClick={() => setIsEditing(true)}
          type="button"
        >
          Edit
        </button>
      </li>
    )
  }

  return (
    <li>
      <form className="player-edit-form" onSubmit={handleSubmit}>
        <label>
          First name
          <input
            autoFocus
            maxLength={50}
            onChange={(event) => setFirstName(event.target.value)}
            required
            value={firstName}
          />
        </label>
        <label>
          Last name
          <input
            maxLength={50}
            onChange={(event) => setLastName(event.target.value)}
            required
            value={lastName}
          />
        </label>
        <label>
          Gender
          <select
            onChange={(event) => setGender(event.target.value)}
            value={gender}
          >
            <option value="">Not specified</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>
        <div className="player-edit-actions">
          <button disabled={isSaving} type="submit">
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            className="secondary-button"
            disabled={isSaving}
            onClick={() => setIsEditing(false)}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </li>
  )
}

function PlayerList({ isLoading, onUpdatePlayer, players }) {
  return (
    <section aria-labelledby="player-list-title" className="player-list-section">
      <h2 id="player-list-title">Roster</h2>
      {isLoading ? (
        <p>Loading players…</p>
      ) : players.length === 0 ? (
        <p className="empty-message">No players yet. Add the first player above.</p>
      ) : (
        <ol className="player-list">
          {players.map((player) => (
            <PlayerRow
              key={player.id}
              onUpdatePlayer={onUpdatePlayer}
              player={player}
            />
          ))}
        </ol>
      )}
    </section>
  )
}

export default PlayerList
