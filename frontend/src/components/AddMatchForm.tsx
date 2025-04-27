import React, { useState, useEffect } from 'react';
import { Box, TextField, MenuItem, Select, InputLabel, FormControl, Button, SelectChangeEvent } from '@mui/material';
import axios from 'axios';
import { Match } from '@/pages/Matches'

axios.defaults.baseURL = 'https://simpleval-api.azurewebsites.net';

interface Team {
  id: number;
  name: string;
}

interface AddMatchFormProps {
  match?: Match | null;
  isEditing: boolean;
  onSubmit: (match: Match) => void; // Include onSubmit prop
  onCancel: () => void; // Include onCancel prop
}

const AddMatchForm = ({ match, isEditing, onSubmit, onCancel }: AddMatchFormProps) => {
  const [formData, setFormData] = useState<Match>({
    team_a_id: 0,
    team_b_id: 0,
    team_a_maps_won: null,
    team_b_maps_won: null,
    date: '',
    time: ''
  });

  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState<boolean>(true);
  const [teamLoadError, setTeamLoadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get('/teams');
        setTeams(response.data);
        setTeamLoadError(null);
      } catch (error: any) {
        console.error('Error fetching teams:', error);
        setTeamLoadError('Could not load teams');
      } finally {
        setLoadingTeams(false);
      }
    };
  
    fetchTeams();
  }, []);

  useEffect(() => {
    if (isEditing && match) {
      const matchDate = new Date(match.date);
      const date = matchDate.toISOString().split('T')[0];
      const time = matchDate.toTimeString().split(' ')[0];
      setFormData({
        ...match,
        date,
        time
      });
    }
  }, [isEditing, match]);

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<number>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
  };

  const handleScoreChange = (e: SelectChangeEvent<string | number>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name as string]: value === '' ? null : Number(value) 
    }));
  };

  // helper function to fetch players for a selected team
  const getPlayersForTeam = async (team_id: number) => {
    try {
      const response = await axios.get(`/players?team_id=${team_id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching players:', error);
      return [];
    }
  }

  const validateForm = async () => {
    const newErrors: { [key: string]: string } = {};
    const matchDateTime = new Date(`${formData.date}T${formData.time}`);
    const now = new Date();

    // Basic requirements
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.team_a_id) newErrors.team_a_id = 'Team A is required';
    if (!formData.team_b_id) newErrors.team_b_id = 'Team B is required';
    if (formData.team_a_id === formData.team_b_id) newErrors.team_b_id = 'Teams must be different';

    // Fetch players if teams are selected
    let teamAPlayers = [];
    let teamBPlayers = [];

    if (formData.team_a_id && formData.team_b_id) {
      try {
        const [a, b] = await Promise.all([
          getPlayersForTeam(formData.team_a_id),
          getPlayersForTeam(formData.team_b_id)
        ]);
        teamAPlayers = a.data;
        teamBPlayers = b.data;
      } catch {
        newErrors.players = 'Error fetching player counts';
      }
    }

    const teamAHasEnough = teamAPlayers.length >= 5;
    const teamBHasEnough = teamBPlayers.length >= 5;
    const hasScore = formData.team_a_maps_won !== null || formData.team_b_maps_won !== null;

    // Don't allow setting a score if match is in the future
    if (matchDateTime > now && hasScore) {
      newErrors.team_a_maps_won = 'Cannot set a score for a future match';
      newErrors.team_b_maps_won = 'Cannot set a score for a future match';
    }

    // Don't allow setting a score if not enough players
    if ((!teamAHasEnough || !teamBHasEnough) && hasScore) {
      newErrors.team_a_maps_won = 'Each team must have at least 5 players to record a score';
      newErrors.team_b_maps_won = 'Each team must have at least 5 players to record a score';
    }

    // Prevent setting a match with existing score to a future date
    if (isEditing && match && matchDateTime > now) {
      const matchHadScore = match.team_a_maps_won !== null || match.team_b_maps_won !== null;
      if (matchHadScore) {
        newErrors.date = 'Cannot move a completed match into the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = await validateForm();
    if (!isValid) return;

    const fullDatetime = `${formData.date}T${formData.time}`;
    const matchToSubmit = {
      ...formData,
      date: fullDatetime
    };

    // api calls to submit match data
    try {
      if (isEditing && match) {
        await axios.put(`/matches/${match.match_id}`, matchToSubmit);
        onSubmit(matchToSubmit); // Call the onSubmit prop with the match data
      } 
      else {
        // Create the match and get the new match_id
        const response = await axios.post('/matches', matchToSubmit);
        const createdMatch = response.data;
        const match_id = createdMatch.match_id;

        // Get 5 players from each team
        const [teamAPlayersResponse, teamBPlayersResponse] = await Promise.all([
          axios.get(`/players?team_id=${formData.team_a_id}`),
          axios.get(`/players?team_id=${formData.team_b_id}`)
        ]);

        const teamAPlayerIds = teamAPlayersResponse.data.slice(0, 5).map((player: any) => player.player_id);
        const teamBPlayerIds = teamBPlayersResponse.data.slice(0, 5).map((player: any) => player.player_id);

        // Loop and post each match-player relation
        for (const player_id of [...teamAPlayerIds, ...teamBPlayerIds]) {
          await axios.post('/match_players', {
            match_id,
            player_id
          });
        }     
        onSubmit(createdMatch);
    }
    } catch (error) {
      console.error('Error submitting match:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
      <TextField
        type="date"
        label="Date"
        name="date"
        value={formData.date}
        onChange={handleTextFieldChange}
        fullWidth
        required
        error={!!errors.date}
        helperText={errors.date}
      />

      <TextField
        type="time"
        label="Time"
        name="time"
        value={formData.time}
        onChange={handleTextFieldChange}
        fullWidth
        required
        error={!!errors.time}
        helperText={errors.time}
      />

      <FormControl fullWidth>
        <InputLabel id="team-a-label">Team A</InputLabel>
        <Select
          labelId="team-a-label"
          name="team_a_id"
          value={formData.team_a_id}
          onChange={handleSelectChange}
          fullWidth
          disabled={loadingTeams}
          error={!!errors.team_a_id}
        >
          <MenuItem value={0}>Select Team A</MenuItem>
          {loadingTeams ? (
            <MenuItem value="">
              <em>Loading teams...</em>
            </MenuItem>
          ) : teamLoadError ? (
            <MenuItem value="">
              <em>{teamLoadError}</em>
            </MenuItem>
          ) : (
            teams.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="team-b-label">Team B</InputLabel>
        <Select
          labelId="team-b-label"
          name="team_b_id"
          value={formData.team_b_id}
          onChange={handleSelectChange}
          fullWidth
          error={!!errors.team_b_id}
        >
          <MenuItem value={0}>Select Team B</MenuItem>
          {loadingTeams ? (
            <MenuItem value="">
              <em>Loading teams...</em>
            </MenuItem>
          ) : teamLoadError ? (
            <MenuItem value="">
              <em>{teamLoadError}</em>
            </MenuItem>
          ) : (
            teams.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="team-a-score-label">Team A Maps Won</InputLabel>
        <Select
          labelId="team-a-score-label"
          name="team_a_maps_won"
          value={formData.team_a_maps_won ?? ''}
          onChange={handleScoreChange}
        >
          <MenuItem value="">N/A</MenuItem>
          {[0, 1, 2, 3].map(score => (
            <MenuItem key={score} value={score}>{score}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="team-b-score-label">Team B Maps Won</InputLabel>
        <Select
          labelId="team-b-score-label"
          name="team_b_maps_won"
          value={formData.team_b_maps_won ?? ''}
          onChange={handleScoreChange}
        >
          <MenuItem value="">N/A</MenuItem>
          {[0, 1, 2, 3].map(score => (
            <MenuItem key={score} value={score}>{score}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button type="submit" variant="contained" color="primary">
          {isEditing ? 'Update Match' : 'Add Match'}
        </Button>
        {isEditing && (
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default AddMatchForm;