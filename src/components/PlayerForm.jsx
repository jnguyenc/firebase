import { useState } from 'react'

function PlayerForm({ isLoading, isSaving, onSubmit }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (await onSubmit(firstName, lastName, gender)) {
      setFirstName('')
      setLastName('')
      setGender('')
    }
  }

  return (
    <form className="player-form" onSubmit={handleSubmit}>
      <label>
        First name
        <input
          autoComplete="given-name"
          maxLength={50}
          name="firstName"
          onChange={(event) => setFirstName(event.target.value)}
          required
          value={firstName}
        />
      </label>
      <label>
        Last name
        <input
          autoComplete="family-name"
          maxLength={50}
          name="lastName"
          onChange={(event) => setLastName(event.target.value)}
          required
          value={lastName}
        />
      </label>
      <label>
        Gender (optional)
        <select
          name="gender"
          onChange={(event) => setGender(event.target.value)}
          value={gender}
        >
          <option value="">Not specified</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </label>
      <button disabled={isLoading || isSaving} type="submit">
        {isSaving ? 'Adding…' : 'Add player'}
      </button>
    </form>
  )
}

export default PlayerForm
