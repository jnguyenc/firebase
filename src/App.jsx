import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { getDb } from './firebase'
import PlayerForm from './components/PlayerForm'
import PlayerList from './components/PlayerList'
import TeamSetup from './components/TeamSetup'
import MatchSetup from './components/MatchSetup'
import Results from './components/Results'
import './App.css'

const tabs = ['Players', 'Teams', 'Matches', 'Results']

function sortPlayers(players) {
  return players.sort((a, b) =>
    `${a.firstName} ${a.lastName}`.localeCompare(
      `${b.firstName} ${b.lastName}`,
    ),
  )
}

function App() {
  const [players, setPlayers] = useState([])
  const [teams, setTeams] = useState([])
  const [matches, setMatches] = useState([])
  const [allowPlayersOnMultipleTeams, setAllowPlayersOnMultipleTeams] =
    useState(false)
  const [activeTab, setActiveTab] = useState('Players')
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingPlayer, setIsSavingPlayer] = useState(false)
  const [isSavingTeam, setIsSavingTeam] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true

    async function loadTournamentData() {
      try {
        const db = getDb()
        const [playersSnapshot, teamsSnapshot, matchesSnapshot] = await Promise.all([
          getDocs(collection(db, 'players')),
          getDocs(collection(db, 'teams')),
          getDocs(collection(db, 'matches')),
        ])

        if (isCurrent) {
          setPlayers(
            sortPlayers(
              playersSnapshot.docs.map((playerDoc) => ({
                id: playerDoc.id,
                ...playerDoc.data(),
              })),
            ),
          )
          setTeams(
            teamsSnapshot.docs.map((teamDoc) => ({
              id: teamDoc.id,
              ...teamDoc.data(),
            })),
          )
          setMatches(
            matchesSnapshot.docs.map((matchDoc) => ({
              id: matchDoc.id,
              ...matchDoc.data(),
            })),
          )
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load tournament data.',
          )
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadTournamentData()
    return () => {
      isCurrent = false
    }
  }, [])

  async function addPlayer(firstName, lastName, gender) {
    setError('')
    setIsSavingPlayer(true)
    try {
      const player = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(gender && { gender }),
      }
      const playerRef = await addDoc(collection(getDb(), 'players'), player)
      setPlayers((currentPlayers) =>
        sortPlayers([...currentPlayers, { id: playerRef.id, ...player }]),
      )
      return true
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to add player.',
      )
      return false
    } finally {
      setIsSavingPlayer(false)
    }
  }

  async function updatePlayer(playerId, firstName, lastName, gender) {
    setError('')
    const player = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender: gender || deleteField(),
    }

    try {
      await updateDoc(doc(getDb(), 'players', playerId), player)
      setPlayers((currentPlayers) =>
        sortPlayers(
          currentPlayers.map((currentPlayer) => {
            if (currentPlayer.id !== playerId) return currentPlayer
            const updatedPlayer = {
              ...currentPlayer,
              firstName: player.firstName,
              lastName: player.lastName,
            }
            if (gender) updatedPlayer.gender = gender
            else delete updatedPlayer.gender
            return updatedPlayer
          }),
        ),
      )
      return true
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to update player.',
      )
      return false
    }
  }

  async function createTeam(playerIds, name, color) {
    setError('')
    if (playerIds.length !== 2 || new Set(playerIds).size !== 2) {
      setError('A team must have two different players.')
      return false
    }
    if (!allowPlayersOnMultipleTeams) {
      const assignedPlayerIds = new Set(
        teams.flatMap((team) => team.playerIds ?? []),
      )
      if (playerIds.some((id) => assignedPlayerIds.has(id))) {
        setError('These players already belong to a team.')
        return false
      }
    }

    setIsSavingTeam(true)
    try {
      const team = {
        name: name.trim() || `Team ${teams.length + 1}`,
        playerIds,
        ...(color ? { color } : {}),
        createdAt: serverTimestamp(),
      }
      const teamRef = await addDoc(collection(getDb(), 'teams'), team)
      setTeams((currentTeams) => [...currentTeams, { id: teamRef.id, ...team }])
      return true
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to create team.',
      )
      return false
    } finally {
      setIsSavingTeam(false)
    }
  }

  async function updateTeam(teamId, name, color) {
    setError('')
    try {
      const updates = { name, color }
      await updateDoc(doc(getDb(), 'teams', teamId), updates)
      setTeams((currentTeams) =>
        currentTeams.map((team) =>
          team.id === teamId ? { ...team, ...updates } : team,
        ),
      )
      return true
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to update team.',
      )
      return false
    }
  }

  async function removeTeam(teamId) {
    setError('')
    if (
      matches.some(
        (match) => match.team1Id === teamId || match.team2Id === teamId,
      )
    ) {
      setError('This team is in a match and cannot be removed.')
      return false
    }

    try {
      await deleteDoc(doc(getDb(), 'teams', teamId))
      setTeams((currentTeams) =>
        currentTeams.filter((team) => team.id !== teamId),
      )
      return true
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to remove team.',
      )
      return false
    }
  }

  async function createMatch(matchData) {
    setError('')
    if (
      !matchData.team1Id ||
      !matchData.team2Id ||
      matchData.team1Id === matchData.team2Id
    ) {
      setError('Select two different teams for the match.')
      return false
    }

    const team1 = teams.find((team) => team.id === matchData.team1Id)
    const team2 = teams.find((team) => team.id === matchData.team2Id)
    const team1PlayerIds = team1?.playerIds ?? []
    const team2PlayerIds = team2?.playerIds ?? []
    if (
      team1PlayerIds.length !== 2 ||
      team2PlayerIds.length !== 2 ||
      new Set([...team1PlayerIds, ...team2PlayerIds]).size !== 4
    ) {
      setError('Each match must have four different players across both teams.')
      return false
    }

    try {
      const match = { ...matchData, createdAt: serverTimestamp() }
      const matchRef = await addDoc(collection(getDb(), 'matches'), match)
      setMatches((currentMatches) => [
        ...currentMatches,
        { id: matchRef.id, ...match },
      ])
      return true
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to create match.',
      )
      return false
    }
  }

  async function updateMatch(matchId, changes) {
    setError('')
    try {
      await updateDoc(doc(getDb(), 'matches', matchId), changes)
      setMatches((currentMatches) =>
        currentMatches.map((match) =>
          match.id === matchId ? { ...match, ...changes } : match,
        ),
      )
      return true
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to update match.',
      )
      return false
    }
  }

  const tabCounts = {
    Players: players.length,
    Teams: teams.length,
    Matches: matches.length,
    Results: matches.filter((match) => match.status === 'final').length,
  }

  return (
    <main className="roster">
      <header className="roster-header">
        <p className="eyebrow">Tournament management</p>
        <h1>{activeTab}</h1>
        <p className="roster-count">
          {tabCounts[activeTab]} {activeTab.toLowerCase()}
        </p>
      </header>

      <nav aria-label="Tournament sections" className="tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            aria-selected={activeTab === tab}
            className={activeTab === tab ? 'tab active' : 'tab'}
            id={`tab-${tab.toLowerCase()}`}
            key={tab}
            onKeyDown={(event) => {
              const direction =
                event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
              if (!direction) return
              event.preventDefault()
              const nextIndex =
                (tabs.indexOf(tab) + direction + tabs.length) % tabs.length
              const nextTab = tabs[nextIndex]
              setActiveTab(nextTab)
              event.currentTarget.parentElement
                .querySelectorAll('[role="tab"]')
                [nextIndex].focus()
            }}
            onClick={() => setActiveTab(tab)}
            role="tab"
            tabIndex={activeTab === tab ? 0 : -1}
            type="button"
          >
            {tab}
          </button>
        ))}
      </nav>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      <section
        aria-labelledby={`tab-${activeTab.toLowerCase()}`}
        className="tab-panel"
        id={`panel-${activeTab.toLowerCase()}`}
        role="tabpanel"
      >
        {activeTab === 'Players' && (
          <>
            <PlayerForm
              isLoading={isLoading}
              isSaving={isSavingPlayer}
              onSubmit={addPlayer}
            />
            <PlayerList
              isLoading={isLoading}
              onUpdatePlayer={updatePlayer}
              players={players}
            />
          </>
        )}
        {activeTab === 'Teams' && (
          <TeamSetup
            isLoading={isLoading}
            isSaving={isSavingTeam}
            onCreateTeam={createTeam}
            onRemoveTeam={removeTeam}
            allowPlayersOnMultipleTeams={allowPlayersOnMultipleTeams}
            onAllowPlayersOnMultipleTeamsChange={
              setAllowPlayersOnMultipleTeams
            }
            onUpdateTeam={updateTeam}
            players={players}
            teams={teams}
          />
        )}
        {activeTab === 'Matches' && (
          <MatchSetup
            isLoading={isLoading}
            matches={matches}
            onCreateMatch={createMatch}
            onUpdateMatch={updateMatch}
            players={players}
            teams={teams}
          />
        )}
        {activeTab === 'Results' && (
          <Results
            isLoading={isLoading}
            matches={matches}
            players={players}
            teams={teams}
          />
        )}
      </section>
    </main>
  )
}

export default App
