import React, { useState, useEffect } from 'react';
import { Typography, Box, TextField, MenuItem, Select, InputLabel, FormControl, Button, SelectChangeEvent, FormHelperText } from '@mui/material';
import axios from 'axios';

axios.defaults.baseURL = 'https://simpleval-api.azurewebsites.net';

interface Match {
  match_id?: number;
  team_a_id: number;
  team_b_id: number;
  team_a_maps_won?: number | null;
  team_b_maps_won?: number | null;
  date: string;
}

// Form-level data includes 'time'
interface MatchFormData {
  match_id?: number;
  team_a_id: number;
  team_b_id: number;
  team_a_maps_won?: number | null;
  team_b_maps_won?: number | null;
  date: string;
  time: string; 
}

interface Team {
  id: number;
  name: string;
}

interface AddMatchFormProps {
  match?: MatchFormData | null;
  isEditing: boolean;
  onSubmit: (match: Match) => void; // Include onSubmit prop
  onCancel: () => void; // Include onCancel prop
}

const AddMatchForm: React.FC<AddMatchFormProps> = ({ 
  onSubmit = () => {},
  match = null, 
  isEditing = false, 
  onCancel = () => {}
}) => {
  const [formData, setFormData] = useState<MatchFormData>({
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
      const matchId = match.match_id; // Use match_id if editing
      setFormData({
        ...match,
        date,
        time,
        match_id: matchId
      });
    } else {
      setFormData({
        team_a_id: 0,
        team_b_id: 0,
        team_a_maps_won: null,
        team_b_maps_won: null,
        date: '',
        time: ''
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
    if (formData.team_a_id === formData.team_b_id) newErrors.team_b_id = 'Selected teams must be different';

    // Fetch players if teams are selected
    let teamAPlayers = [];
    let teamBPlayers = [];

    if (formData.team_a_id && formData.team_b_id) {
      try {
        [teamAPlayers, teamBPlayers] = await Promise.all([
          getPlayersForTeam(formData.team_a_id),
          getPlayersForTeam(formData.team_b_id)
        ]);
      } catch {
        newErrors.players = 'Error fetching player counts';
      }
    }

    // check if the selected teams have at exactly 5 players
    const teamAHasEnough = teamAPlayers.length === 5;
    const teamBHasEnough = teamBPlayers.length === 5;

    // Don't allow matches to be set in the future
    if (matchDateTime > now) {
      // compare the dates (ignoring time) 
      let matchDate = new Date(matchDateTime.getFullYear(), matchDateTime.getMonth(), matchDateTime.getDate());
      let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
      // if the dates are the same, check the time
      if (matchDate.getTime() === currentDate.getTime()) {
          if (matchDateTime.getTime() > now.getTime()) {
              newErrors.time = 'Cannot set a match in the future'; //want to attribute error to time only when date is the same
          }
      } else {
          // date is different (future), so attribute error to date
          newErrors.date = 'Cannot set a match in the future';
      }
  } 

    // Teams must 5 players to play a match, but only check when adding, not editing
    if (!isEditing && (!teamAHasEnough || !teamBHasEnough)) {
      newErrors.team_a_id = 'Each team must have exactly 5 players to play a match';
      newErrors.team_b_id = 'Each team must have exactly 5 players to play a match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (await validateForm()) {
      const matchDateTime = new Date(`${formData.date}T${formData.time}`);
      const matchId = isEditing ? formData.match_id : undefined; // Use match_id if editing
      console.log('Match ID:', matchId); // Debugging line 
      const matchData = {
        ...formData,
        date: matchDateTime.toISOString(),
        match_id: matchId
      };
      onSubmit(matchData);

      if (!isEditing) {
        setFormData({
          team_a_id: 0,
          team_b_id: 0,
          team_a_maps_won: null,
          team_b_maps_won: null,
          date: '',
          time: ''
        });
      }
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

      <FormControl fullWidth error={!!errors.team_a_id}>
        <InputLabel id="team-a-label">Team A</InputLabel>
        {/* Disable if loading teams or editing - cannot be edited */}
        <Select
          labelId="team-a-label"
          name="team_a_id"
          value={formData.team_a_id}
          onChange={handleSelectChange}
          fullWidth
          disabled={loadingTeams || isEditing}
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
        {errors.team_a_id && (
          <Typography color="error" variant="caption">
            {errors.team_a_id}
          </Typography>
        )} {/* add error message */}
      </FormControl>

      <FormControl fullWidth error={!!errors.team_id}>
        <InputLabel id="team-b-label">Team B</InputLabel>
        <Select
          labelId="team-b-label"
          name="team_b_id"
          value={formData.team_b_id}
          onChange={handleSelectChange}
          fullWidth
          disabled={loadingTeams || isEditing}
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
        {errors.team_b_id && (
          <Typography color="error" variant="caption">
            {errors.team_b_id}
          </Typography>
        )}
      </FormControl>

      <FormControl fullWidth error={!!errors.team_a_maps_won}>
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
        {errors.team_a_maps_won && (
          <Typography color="error" variant="caption">
            {errors.team_a_maps_won}
          </Typography>
        )}
      </FormControl>

      <FormControl fullWidth error={!!errors.team_b_maps_won}>
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
        {errors.team_b_maps_won && (
          <Typography color="error" variant="caption">
            {errors.team_b_maps_won}
          </Typography>
        )}
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