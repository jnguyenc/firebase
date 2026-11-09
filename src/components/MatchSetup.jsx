import { useState } from 'react'
import { getTeamColorSymbol, getTeamDisplayName } from '../utils/teamName'
import TeamName from './TeamName'

const statuses = ['queue', 'in progress', 'final']
const matchTypes = [
  'unspecified',
  'friendly',
  'round-robin',
  'play-off',
  'pre-final',
  'final',
]

function MatchCard({ match, playersById, teamsById, onUpdateMatch }) {
  const [team1Score, setTeam1Score] = useState(match.team1Score ?? 0)
  const [team2Score, setTeam2Score] = useState(match.team2Score ?? 0)
  const [status, setStatus] = useState(match.status ?? 'queue')
  const [matchType, setMatchType] = useState(match.matchType ?? 'unspecified')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    await onUpdateMatch(match.id, {
      team1Score: Number(team1Score),
      team2Score: Number(team2Score),
      status,
      matchType,
    })
    setIsSaving(false)
  }

  const team1 = teamsById.get(match.team1Id)
  const team2 = teamsById.get(match.team2Id)
  return (
    <form className="match-card" onSubmit={handleSubmit}>
      <div className="match-teams">
        <strong>
          <TeamName playersById={playersById} team={team1} />
        </strong>
        <span>vs</span>
        <strong>
          <TeamName playersById={playersById} team={team2} />
        </strong>
      </div>
      <div className="match-fields">
        <label>
          {team1?.name ?? 'Team 1'} score
          <input
            min="0"
            onChange={(event) => setTeam1Score(event.target.value)}
            required
            step="1"
            type="number"
            value={team1Score}
          />
        </label>
        <label>
          {team2?.name ?? 'Team 2'} score
          <input
            min="0"
            onChange={(event) => setTeam2Score(event.target.value)}
            required
            step="1"
            type="number"
            value={team2Score}
          />
        </label>
        <label>
          Match type
          <select
            onChange={(event) => setMatchType(event.target.value)}
            value={matchType}
          >
            {matchTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select onChange={(event) => setStatus(event.target.value)} value={status}>
            {statuses.map((matchStatus) => (
              <option key={matchStatus} value={matchStatus}>
                {matchStatus === 'in progress'
                  ? 'In progress'
                  : matchStatus[0].toUpperCase() + matchStatus.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <button disabled={isSaving} type="submit">
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function MatchSetup({
  isLoading,
  matches,
  onCreateMatch,
  onUpdateMatch,
  players,
  teams,
}) {
  const [team1Id, setTeam1Id] = useState('')
  const [team2Id, setTeam2Id] = useState('')
  const [matchType, setMatchType] = useState('unspecified')
  const [isCreating, setIsCreating] = useState(false)
  const [selectedMatchTab, setSelectedMatchTab] = useState('upcoming')
  const [selectedTeamId, setSelectedTeamId] = useState('')

  function hasFourDifferentPlayers(firstTeamId, secondTeamId) {
    const firstTeam = teams.find((team) => team.id === firstTeamId)
    const secondTeam = teams.find((team) => team.id === secondTeamId)
    const firstPlayerIds = firstTeam?.playerIds ?? []
    const secondPlayerIds = secondTeam?.playerIds ?? []

    return (
      firstPlayerIds.length === 2 &&
      secondPlayerIds.length === 2 &&
      new Set([...firstPlayerIds, ...secondPlayerIds]).size === 4
    )
  }

  function handleFirstTeamChange(event) {
    const nextTeamId = event.target.value
    setTeam1Id(nextTeamId)
    if (team2Id && !hasFourDifferentPlayers(nextTeamId, team2Id)) {
      setTeam2Id('')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsCreating(true)
    const created = await onCreateMatch({
      team1Id,
      team2Id,
      matchType,
      team1Score: 0,
      team2Score: 0,
      status: 'queue',
    })
    setIsCreating(false)
    if (created) {
      setTeam1Id('')
      setTeam2Id('')
      setMatchType('unspecified')
    }
  }

  const teamsById = new Map(teams.map((team) => [team.id, team]))
  const playersById = new Map(players.map((player) => [player.id, player]))
  const matchesForTeam = (matchList, teamId) =>
    teamId
      ? matchList.filter(
          (match) =>
            match.team1Id === teamId || match.team2Id === teamId,
        )
      : matchList
  const upcomingMatches = matchesForTeam(
    matches.filter(
      (match) => match.status !== 'final' && match.status !== 'in progress',
    ),
    selectedTeamId,
  )
  const inProgressMatches = matchesForTeam(
    matches.filter((match) => match.status === 'in progress'),
    selectedTeamId,
  )
  const finalMatches = matchesForTeam(
    matches.filter((match) => match.status === 'final'),
    selectedTeamId,
  )
  const visibleMatches = {
    upcoming: upcomingMatches,
    inProgress: inProgressMatches,
    final: finalMatches,
  }[selectedMatchTab]
  const matchTabs = [
    {
      id: 'upcoming',
      label: 'Upcoming',
      emptyLabel: 'upcoming matches',
      matches: upcomingMatches,
    },
    {
      id: 'inProgress',
      label: 'In progress',
      emptyLabel: 'in-progress matches',
      matches: inProgressMatches,
    },
    {
      id: 'final',
      label: 'Final',
      emptyLabel: 'final matches',
      matches: finalMatches,
    },
  ]
  const sortedTeams = [...teams].sort((a, b) =>
    getTeamDisplayName(a, playersById).localeCompare(
      getTeamDisplayName(b, playersById),
      undefined,
      { sensitivity: 'base' },
    ),
  )

  function renderMatches(matchList) {
    return matchList.map((match) => (
      <MatchCard
        key={match.id}
        match={match}
        onUpdateMatch={onUpdateMatch}
        playersById={playersById}
        teamsById={teamsById}
      />
    ))
  }

  return (
    <section aria-labelledby="match-setup-title" className="match-section">
      <h2 id="match-setup-title">Set up matches</h2>
      <p className="section-description">
        Choose two teams to create a queued match.
      </p>
      <form className="match-create-form" onSubmit={handleSubmit}>
        <label>
          First team
          <select
            onChange={handleFirstTeamChange}
            required
            value={team1Id}
          >
            <option value="">Select a team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {getTeamColorSymbol(team.color)}{' '}
                {getTeamDisplayName(team, playersById)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Second team
          <select
            onChange={(event) => setTeam2Id(event.target.value)}
            required
            value={team2Id}
          >
            <option value="">Select a team</option>
            {teams
              .filter(
                (team) =>
                  team.id !== team1Id &&
                  (!team1Id || hasFourDifferentPlayers(team1Id, team.id)),
              )
              .map((team) => (
                <option key={team.id} value={team.id}>
                  {getTeamColorSymbol(team.color)}{' '}
                  {getTeamDisplayName(team, playersById)}
                </option>
              ))}
          </select>
        </label>
        <label>
          Match type (optional)
          <select
            onChange={(event) => setMatchType(event.target.value)}
            value={matchType}
          >
            {matchTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <button disabled={isLoading || isCreating || teams.length < 2} type="submit">
          {isCreating ? 'Creating…' : 'Create match'}
        </button>
      </form>

      <h3 className="subsection-title">Matches ({matches.length})</h3>
      {isLoading ? (
        <p>Loading matches…</p>
      ) : matches.length === 0 ? (
        <p className="empty-message">No matches yet.</p>
      ) : (
        <>
          <div className="results-filter-row">
            <label className="results-team-filter">
              Filter by team
              <select
                onChange={(event) => setSelectedTeamId(event.target.value)}
                value={selectedTeamId}
              >
                <option value="">All teams</option>
                {sortedTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {getTeamColorSymbol(team.color)}{' '}
                    {getTeamDisplayName(team, playersById)}
                  </option>
                ))}
              </select>
            </label>
            </div>
          <div aria-label="Match status" className="tabs" role="tablist">
            {matchTabs.map((tab) => (
              <button
                aria-controls={`matches-panel-${tab.id}`}
                aria-selected={selectedMatchTab === tab.id}
                className={`tab${selectedMatchTab === tab.id ? ' active' : ''}`}
                id={`matches-tab-${tab.id}`}
                key={tab.id}
                onClick={() => setSelectedMatchTab(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label} ({tab.matches.length})
              </button>
            ))}
          </div>
          <div
            aria-labelledby={`matches-tab-${selectedMatchTab}`}
            className="tab-panel"
            id={`matches-panel-${selectedMatchTab}`}
            role="tabpanel"
          >
            {visibleMatches.length > 0 ? (
              <div className="match-list">{renderMatches(visibleMatches)}</div>
            ) : (
              <p className="empty-message">
                {selectedTeamId
                  ? `No ${matchTabs.find((tab) => tab.id === selectedMatchTab).emptyLabel} for this team.`
                  : `No ${matchTabs.find((tab) => tab.id === selectedMatchTab).emptyLabel}.`}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export default MatchSetup
