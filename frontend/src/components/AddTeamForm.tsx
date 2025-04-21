import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Typography } from '@mui/material';

interface Team {
  team_id?: number;
  name: string;
  team_code: string;
  region: string;
  status: string;
  record: string;
  logo?: string;
}

interface AddTeamFormProps {
  onSubmit?: (team: Team) => void;
  team?: Team | null;
  isEditing?: Boolean;
  onCancel?: () => void;
}

const AddTeamForm: React.FC<AddTeamFormProps> = ({ 
  onSubmit = () => {}, 
  team = null, 
  isEditing = false, 
  onCancel = () => {} 
}) => {
  const [formData, setFormData] = useState<Team>({
    name: '',
    team_code: '',
    region: '',
    status: 'active',
    record: '0-0',
    logo: ''
  });

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Update form data when editing an existing team
  useEffect(() => {
    if (team && isEditing) {
      setFormData(team);
    } else {
      // Reset form when switching from edit to add mode
      setFormData({
        name: '',
        team_code: '',
        region: '',
        status: 'active',
        record: '0-0',
        logo: ''
      });
    }
  }, [team, isEditing]);

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = "Team name is required";
    }
    
    if (!formData.team_code.trim()) {
      errors.team_code = "Team code is required";
    }
    
    if (!formData.region.trim()) {
      errors.region = "Region is required";
    }
    
    if (!formData.status) {
      errors.status = "Status is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user selects
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (validateForm()) {
      console.log("Submitting form data:", formData);
      onSubmit(formData);
      
      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          name: '',
          team_code: '',
          region: '',
          status: 'active',
          record: '0-0',
          logo: ''
        });
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
      <TextField
        label="Team Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        fullWidth
        error={!!formErrors.name}
        helperText={formErrors.name}
      />
      
      <TextField
        label="Team Code"
        name="team_code"
        value={formData.team_code}
        onChange={handleChange}
        required
        fullWidth
        error={!!formErrors.team_code}
        helperText={formErrors.team_code}
      />
      
      <TextField
        label="Region"
        name="region"
        value={formData.region}
        onChange={handleChange}
        required
        fullWidth
        error={!!formErrors.region}
        helperText={formErrors.region}
      />
      
      <TextField
        label="Record"
        name="record"
        value={formData.record}
        onChange={handleChange}
        fullWidth
        placeholder="0-0"
      />
      
      <TextField
        label="Logo URL"
        name="logo"
        value={formData.logo || ''}
        onChange={handleChange}
        fullWidth
        placeholder="https://example.com/logo.png"
      />
      
      <FormControl fullWidth error={!!formErrors.status}>
        <InputLabel id="status-label">Status</InputLabel>
        <Select
          labelId="status-label"
          name="status"
          value={formData.status}
          label="Status"
          onChange={handleSelectChange}
          required
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
        </Select>
        {formErrors.status && (
          <Typography color="error" variant="caption">
            {formErrors.status}
          </Typography>
        )}
      </FormControl>
      
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button type="submit" variant="contained" color="primary">
          {isEditing ? 'Update Team' : 'Add Team'}
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

export default AddTeamForm;