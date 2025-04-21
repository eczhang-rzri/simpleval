import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Box, Typography, Alert } from '@mui/material';
import AddTeamForm from '@/components/AddTeamForm';

// Configure Axios to use your backend server URL
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
axios.defaults.baseURL = apiUrl;

interface Team {
    team_id?: number; // Make optional for new teams
    name: string;
    team_code: string;
    logo?: string; 
    region: string;
    status: string;
    record: string;
}

const Teams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isEditing, setIsEditing] = useState<Boolean>(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTeams = async () => {
        try {
            setLoading(true);
            // Updated URL to match backend
            const response = await axios.get('/teams');
            
            // Map the response data to match our frontend model
            const mappedTeams = Array.isArray(response.data) ? response.data.map((team: any) => ({
                team_id: team.id, // Map id to team_id
                name: team.name, // Map name to name
                team_code: team.team_code,
                logo: team.logo || null, // Default to null if missing
                region: team.region,
                status: team.status,
                record: team.record || '0-0', // Default if missing
            })) : [];
            
            setTeams(mappedTeams);
        } catch (err) {
            if (err instanceof Error) {
                setError(err);
                console.error("Error fetching teams:", err);
            } else {
                console.error("Unknown error:", err);
            }
            setTeams([]);
        } finally {
            setLoading(false);
        }
    };

    fetchTeams();
  }, []);

  const handleAddTeam = async (newTeam: Team) => {
    try {
      console.log("Attempting to add team:", newTeam);
      
      // Transform data to match backend model
      const teamData = {
        name: newTeam.name,
        team_code: newTeam.team_code,
        region: newTeam.region,
        status: newTeam.status,
        logo: newTeam.logo || null,
        // Don't include record as it's not in your backend model
      };
      
      // Updated URL to match backend
      const response = await axios.post('/teams', teamData);
      console.log("Add team response:", response);
      
      // Map the response to match our frontend model
      const addedTeam = {
        team_id: response.data.id,
        name: response.data.name,
        team_code: response.data.team_code,
        region: response.data.region,
        status: response.data.status,
        record: response.data.record || '0-0',
        logo: response.data.logo
      };
      
      setTeams(prevTeams => [...prevTeams, addedTeam]);
      setError(null);
    } catch (error) {
      console.error("Error adding team:", error);
      if (axios.isAxiosError(error)) {
        console.error("API Error Details:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      setError(new Error(`Failed to add team: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };

  const handleEditTeam = (team: Team) => {
    setIsEditing(true);
    setTeamToEdit(team);
  };

  const handleUpdateTeam = async (updatedTeam: Team) => {
    try {
      if (!updatedTeam.team_id) {
        throw new Error("Team ID is required for updates");
      }
      
      // Transform data to match backend model
      const teamData = {
        name: updatedTeam.name,
        team_code: updatedTeam.team_code,
        logo: updatedTeam.logo || null,
        region: updatedTeam.region,
        status: updatedTeam.status,
        record: updatedTeam.record || '0-0', // Default if missing
      };
      
      // Updated URL to match backend
      const response = await axios.put(`/teams/${updatedTeam.team_id}`, teamData);
      
      // Map the response to match our frontend model
      const updatedTeamFromResponse = {
        team_id: response.data.id,
        name: response.data.name,
        team_code: response.data.team_code,
        logo: response.data.logo || null,
        region: response.data.region,
        status: response.data.status,
        record: response.data.record || '0-0',
      };
      
      setTeams(prevTeams => prevTeams.map(team => 
        team.team_id === updatedTeam.team_id ? updatedTeamFromResponse : team
      ));
      setIsEditing(false);
      setTeamToEdit(null);
      setError(null);
    } catch (error) {
      console.error("Error updating team:", error);
      setError(new Error(`Failed to update team: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };

  const handleDeleteTeam = async (team_id: number) => {
    try {
      await axios.delete(`/teams/${team_id}`);
      setTeams(prevTeams => prevTeams.filter(team => team.team_id !== team_id));
    } catch (error) {
      console.error("Error deleting team:", error);
      setError(new Error(`Failed to delete team: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#f9f9f9' }}>
      <Typography variant="h5" gutterBottom>Teams Table</Typography>
      
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}
      
      {loading ? (
        <Typography>Loading teams...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#002147', color: '#f9f9f9' }}>
                <TableCell sx={{color: '#f9f9f9'}}>Team Name</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Team Code</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Region</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Record</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Status</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.length > 0 ? (
                teams.map((team) => (
                  <TableRow key={team.team_id}>
                    <TableCell>{team.name}</TableCell>
                    <TableCell>{team.team_code}</TableCell>
                    <TableCell>{team.region}</TableCell>
                    <TableCell>{team.record}</TableCell>
                    <TableCell>{team.status}</TableCell>
                    <TableCell>
                      <Button variant="contained" onClick={() => handleEditTeam(team)} sx={{ mr: 1 }}>Edit</Button>
                      <Button variant="contained" color="error" onClick={() => handleDeleteTeam(team.team_id!)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">No teams found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>{isEditing ? "Edit Team" : "Add New Team"}</Typography>
        <AddTeamForm
          onSubmit={isEditing ? handleUpdateTeam : handleAddTeam}
          team={teamToEdit}
          isEditing={isEditing}
          onCancel={() => { setIsEditing(false); setTeamToEdit(null); }}
        />
      </Box>
    </Box>
  );
};

export default Teams;