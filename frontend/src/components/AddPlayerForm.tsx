import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';

axios.defaults.baseURL = 'https://simpleval-api.azurewebsites.net';

interface Team {
  id: number;
  name: string;
}

interface Player {
  player_id?: number; // Make optional for new players
  in_game_name: string;
  real_name: string;
  role?: string;
  country_name: string;
  country_flag_code: string;
  profile_picture?: string;
  status: string;
  team_id?: number;
}

interface AddPlayerFormProps {
  onSubmit?: (player: Player) => void;
  player?: Player | null;
  isEditing?: boolean;
  onCancel?: () => void;
}

const AddPlayerForm: React.FC<AddPlayerFormProps> = ({
  onSubmit = () => {},
  player = null,
  isEditing = false,
  onCancel = () => {},
}) => {
  const [formData, setFormData] = useState<Player>({
    in_game_name: '',
    real_name: '',
    role: '',
    country_name: '',
    country_flag_code: '',
    profile_picture: '',
    status: 'active',
    team_id: undefined,
  });

  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState<boolean>(true);
  const [teamLoadError, setTeamLoadError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

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
    if (player && isEditing) {
      setFormData(player);
    } else {
      setFormData({
        in_game_name: '',
        real_name: '',
        role: '',
        country_name: '',
        country_flag_code: '',
        profile_picture: '',
        status: 'active',
        team_id: undefined,
      });
    }
  }, [player, isEditing]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.in_game_name.trim()) errors.in_game_name = 'In-game name is required';
    if (!formData.real_name.trim()) errors.real_name = 'Real name is required';
    if (!formData.country_name.trim()) errors.country_name = 'Country name is required';
    if (!formData.country_flag_code.trim()) errors.country_flag_code = 'Country flag code is required';
    if (!formData.status.trim()) errors.status = 'Status is required';
    if (!formData.team_id) errors.team_id = 'Team selection is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      if (!isEditing) {
        setFormData({
          in_game_name: '',
          real_name: '',
          role: '',
          country_name: '',
          country_flag_code: '',
          profile_picture: '',
          status: 'active',
          team_id: undefined,
        });
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
      <TextField
        label="In-Game Name"
        name="in_game_name"
        value={formData.in_game_name}
        onChange={handleChange}
        required
        error={!!formErrors.in_game_name}
        helperText={formErrors.in_game_name}
      />

      <TextField
        label="Real Name"
        name="real_name"
        value={formData.real_name}
        onChange={handleChange}
        required
        error={!!formErrors.real_name}
        helperText={formErrors.real_name}
      />

      <TextField
        label="Role"
        name="role"
        value={formData.role || ''}
        onChange={handleChange}
        placeholder="e.g. Tank, DPS"
      />

      <TextField
        label="Country Name"
        name="country_name"
        value={formData.country_name}
        onChange={handleChange}
        required
        error={!!formErrors.country_name}
        helperText={formErrors.country_name}
      />

      <TextField
        label="Country Flag Code"
        name="country_flag_code"
        value={formData.country_flag_code}
        onChange={handleChange}
        required
        error={!!formErrors.country_flag_code}
        helperText={formErrors.country_flag_code}
      />

      <TextField
        label="Profile Picture URL"
        name="profile_picture"
        value={formData.profile_picture || ''}
        onChange={handleChange}
        placeholder="https://example.com/pic.jpg"
      />

      <FormControl fullWidth error={!!formErrors.status}>
        <InputLabel id="status-label">Status</InputLabel>
        <Select
          labelId="status-label"
          name="status"
          value={formData.status}
          onChange={handleSelectChange}
        >
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Archived">Archived</MenuItem>
        </Select>
        {formErrors.status && (
          <Typography color="error" variant="caption">
            {formErrors.status}
          </Typography>
        )}
      </FormControl>

      <FormControl fullWidth error={!!formErrors.team_id}>
        <InputLabel id="team-label">Team</InputLabel>
        <Select
          labelId="team-label"
          name="team_id"
          value={formData.team_id ?? ''}
          onChange={handleSelectChange}
          disabled={loadingTeams}
        >
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
        {formErrors.team_id && (
          <Typography color="error" variant="caption">
            {formErrors.team_id}
          </Typography>
        )}
      </FormControl>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button type="submit" variant="contained" color="primary">
          {isEditing ? 'Update Player' : 'Add Player'}
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

export default AddPlayerForm;
