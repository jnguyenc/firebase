import { getTeamMemberFirstNames } from '../utils/teamName'
import TeamColorSwatch from './TeamColorSwatch'

function TeamName({ team, playersById, showMemberNames = true }) {
  if (!team) return 'Unknown team'

  const memberNames = showMemberNames
    ? getTeamMemberFirstNames(team, playersById)
    : []

  return (
    <span className="team-name">
      <TeamColorSwatch team={team} />
      <span>
        {team.name ?? 'Team'}
        {memberNames.length > 0 && (
          <small className="team-member-suffix">
            {' '}({memberNames.join(' & ')})
          </small>
        )}
      </span>
    </span>
  )
}

export default TeamName
