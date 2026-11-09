import { useState } from 'react'
import { getTeamColorSymbol, getTeamDisplayName } from '../utils/teamName'
import TeamName from './TeamName'

function Results({ isLoading, matches, players, teams }) {
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const finalMatches = matches.filter((match) => match.status === 'final')
  const playersById = new Map(players.map((player) => [player.id, player]))
  const teamsById = new Map(teams.map((team) => [team.id, team]))
  const finalizedTeamIds = new Set(
    finalMatches.flatMap((match) => [match.team1Id, match.team2Id]),
  )
  const standingsById = new Map(
    teams
      .filter((team) => finalizedTeamIds.has(team.id))
      .map((team) => [team.id, { team, wins: 0, winningMargin: 0 }]),
  )

  for (const match of finalMatches) {
    const team1Standing = standingsById.get(match.team1Id)
    const team2Standing = standingsById.get(match.team2Id)
    if (!team1Standing || !team2Standing) continue

    const score1 = Number(match.team1Score ?? 0)
    const score2 = Number(match.team2Score ?? 0)

    if (score1 > score2) {
      team1Standing.wins += 1
      team1Standing.winningMargin += score1 - score2
    } else if (score2 > score1) {
      team2Standing.wins += 1
      team2Standing.winningMargin += score2 - score1
    }
  }

  const standings = [...standingsById.values()].sort(
    (a, b) =>
      b.wins - a.wins ||
      b.winningMargin - a.winningMargin ||
      getTeamDisplayName(a.team, playersById).localeCompare(
        getTeamDisplayName(b.team, playersById),
        undefined,
        { sensitivity: 'base' },
      ),
  )
  const sortedFinalMatches = [...finalMatches].sort((a, b) => {
    const namesForMatch = (match) =>
      [match.team1Id, match.team2Id]
        .map((id) =>
          teamsById.has(id)
            ? getTeamDisplayName(teamsById.get(id), playersById)
            : 'Unknown team',
        )
        .sort((nameA, nameB) =>
          nameA.localeCompare(nameB, undefined, { sensitivity: 'base' }),
        )
    const [aFirst, aSecond] = namesForMatch(a)
    const [bFirst, bSecond] = namesForMatch(b)

    return (
      aFirst.localeCompare(bFirst, undefined, { sensitivity: 'base' }) ||
      aSecond.localeCompare(bSecond, undefined, { sensitivity: 'base' })
    )
  })
  const filteredFinalMatches = selectedTeamId
    ? sortedFinalMatches.filter(
        (match) =>
          match.team1Id === selectedTeamId || match.team2Id === selectedTeamId,
      )
    : sortedFinalMatches
  const sortedTeams = [...teams].sort((a, b) =>
    getTeamDisplayName(a, playersById).localeCompare(
      getTeamDisplayName(b, playersById),
      undefined,
      { sensitivity: 'base' },
    ),
  )

  return (
    <section aria-labelledby="results-title" className="results-section">
      <h2 id="results-title">Final results</h2>
      {isLoading ? (
        <p>Loading results…</p>
      ) : teams.length === 0 ? (
        <p className="empty-message">No teams to rank yet.</p>
      ) : (
        <>
          <h3 className="subsection-title">Standings</h3>
          {standings.length === 0 ? (
            <p className="empty-message">
              Standings will appear after matches are finalized.
            </p>
          ) : (
            <ol className="standings-list">
              {standings.map(({ team, wins, winningMargin }, index) => (
                <li key={team.id}>
                  <span className="standing-rank">{index + 1}</span>
                  <span>
                    <TeamName playersById={playersById} team={team} />
                    {index < 2 && (
                      <span
                        aria-label={
                          index === 0 ? 'Top-ranked team' : 'Second-ranked team'
                        }
                        className="winner-medal"
                        role="img"
                      >
                        {index === 0 ? '🏆' : '🥈'}
                      </span>
                    )}
                  </span>
                  <span>{wins} {wins === 1 ? 'win' : 'wins'}</span>
                  <span>{winningMargin} winning points</span>
                </li>
              ))}
            </ol>
          )}
          <h3 className="subsection-title">Final matches</h3>
          {finalMatches.length === 0 ? (
            <p className="empty-message">
              No matches have been finalized yet.
            </p>
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
                <p aria-live="polite" className="results-filter-count">
                  {filteredFinalMatches.length}{' '}
                  {filteredFinalMatches.length === 1 ? 'result' : 'results'}
                </p>
              </div>
              {filteredFinalMatches.length === 0 ? (
                <p className="empty-message">
                  No final matches for this team.
                </p>
              ) : (
                <ol className="results-list">
                  {filteredFinalMatches.map((match) => {
                const team1 = teamsById.get(match.team1Id)
                const team2 = teamsById.get(match.team2Id)
                const score1 = Number(match.team1Score ?? 0)
                const score2 = Number(match.team2Score ?? 0)
                const team1Won = score1 > score2
                const team2Won = score2 > score1
                const winningPoints = Math.abs(score1 - score2)

                return (
                  <li key={match.id}>
                    <div className="result-score">
                      <span className="result-team">
                        <span className="result-team-name">
                          {team1
                            ? <TeamName playersById={playersById} team={team1} />
                            : 'Unknown team'}
                          {team1Won && (
                            <span aria-label="Winner" className="winner-medal" role="img">
                              🥇
                            </span>
                          )}
                        </span>
                        {team1Won && (
                          <small className="result-winning-points">
                            +{winningPoints} winning points
                          </small>
                        )}
                      </span>
                      <span className="result-score-value">
                        <strong>{score1} – {score2}</strong>
                        <small className="result-match-type">
                          {match.matchType ?? 'unspecified'}
                        </small>
                      </span>
                      <span className="result-team result-team-right">
                        <span className="result-team-name">
                          {team2Won && (
                            <span aria-label="Winner" className="winner-medal" role="img">
                              🥇
                            </span>
                          )}
                          {team2
                            ? <TeamName playersById={playersById} team={team2} />
                            : 'Unknown team'}
                        </span>
                        {team2Won && (
                          <small className="result-winning-points">
                            +{winningPoints} winning points
                          </small>
                        )}
                      </span>
                    </div>
                    {score1 === score2 && (
                      <p className="result-winner">Draw</p>
                    )}
                  </li>
                )
                  })}
                </ol>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}

export default Results
