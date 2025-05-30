import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { TextField, InputAdornment, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Box, Typography, Alert } from '@mui/material';
import AddTeamForm from '@/components/forms/AddTeamForm';
import ProtectedComponent from '@/components/ProtectedComponent';
import HiddenComponent from '@/components/HiddenComponent';

// Configure Axios to use backend server URL
axios.defaults.baseURL = 'https://simpleval-api.azurewebsites.net';

interface Team {
    team_id?: number; // Make optional for new teams
    name: string;
    team_code: string;
    logo?: string; 
    region: string;
    status: string;
}

const regionImages: { [key: string]: string } = {
  Americas: 'https://owcdn.net/img/640f5ab71dfbb.png',
  EMEA: 'https://owcdn.net/img/65ab59620a233.png',
  Pacific: 'https://owcdn.net/img/640f5ae002674.png',
  China: 'https://owcdn.net/img/65dd97cea9a25.png',
};

const Teams = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isEditing, setIsEditing] = useState<Boolean>(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); //for sort order
  const [searchQuery, setSearchQuery] = useState<string>(''); // for search query

  //table pages
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [teamsPerPage] = useState<number>(10); // number of teams per page

  useEffect(() => {
    const fetchTeams = async () => {
        try {
            setLoading(true);
            // Updated URL to match backend
            const response = await axios.get('/teams');
            
            // Map the response data to match our frontend model
            const mappedTeams = Array.isArray(response.data)
              ? response.data
                  .map((team: any) => ({
                    team_id: team.id,
                    name: team.name,
                    team_code: team.team_code,
                    logo: team.logo || null,
                    region: team.region,
                    status: team.status,
                  }))                
              : [];
            
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

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
      };
      
      const response = await axios.post('/teams', teamData);
      console.log("Add team response:", response);
      
      // Map the response to match frontend model
      const addedTeam = {
        team_id: response.data.id,
        name: response.data.name,
        team_code: response.data.team_code,
        region: response.data.region,
        status: response.data.status,
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
      };
      
      // Updated URL to match backend
      const response = await axios.put(`/teams/${updatedTeam.team_id}`, teamData);
      
      // Map the response to match frontend model
      const updatedTeamFromResponse = {
        team_id: response.data.id,
        name: response.data.name,
        team_code: response.data.team_code,
        logo: response.data.logo || null,
        region: response.data.region,
        status: response.data.status,
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

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // filter teams based on search query - name or code
  const filteredTeams = teams.filter(team =>
    (team.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    team.team_code.toLowerCase().includes(searchQuery.toLowerCase()) ) // case insensitive
  );

  const sortedTeams = [...filteredTeams].sort((a, b) =>
    sortOrder === 'asc'
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
  );

  //helpers for pagination logic
  const indexOfLastTeam = currentPage * teamsPerPage;
  const indexOfFirstTeam = indexOfLastTeam - teamsPerPage;
  const currentTeams = sortedTeams.slice(indexOfFirstTeam, indexOfLastTeam);
  const totalPages = Math.ceil(sortedTeams.length / teamsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#f9f9f9' }}>
      <Typography variant="h4" gutterBottom>All Teams</Typography>
      
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}
      
      {loading ? (
        <Typography>Loading teams...</Typography>
      ) : (
        <>
          {/* Pagination controls + search*/}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography>
                Showing {indexOfFirstTeam + 1} to {Math.min(indexOfLastTeam, teams.length)} of {teams.length} teams
              </Typography>
              
              <Box sx={{ ml: 8,  mr: 20, minWidth: 400, maxWidth: 800 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search teams by name or team code..."
                  value={searchQuery}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        🔍
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                onClick={goToPreviousPage} 
                disabled={currentPage === 1}
                sx={{ color: currentPage === 1 ? 'grey.400' : 'primary.main' }}
              >
                ◄ 
              </IconButton>
              <Typography sx={{ mx: 2 }}>
                Page {currentPage} of {totalPages}
              </Typography>
              <IconButton 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
                sx={{ color: currentPage === totalPages ? 'grey.400' : 'primary.main' }}
              >
                ►
              </IconButton>
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#002147', color: '#f9f9f9' }}>
                  <TableCell sx={{ color: '#f9f9f9', cursor: 'pointer' }} onClick={toggleSortOrder}>
                    Team Name&nbsp;
                    {sortOrder === 'asc' ? '▼' : '▲'}
                  </TableCell>
                  <TableCell sx={{color: '#f9f9f9'}}>Team Code</TableCell>
                  <TableCell sx={{color: '#f9f9f9'}}>Region</TableCell>
                  <TableCell sx={{color: '#f9f9f9'}}>Status</TableCell>
                  <TableCell sx={{color: '#f9f9f9'}}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentTeams.length > 0 ? (
                  currentTeams.map((team) => (
                    <TableRow key={team.team_id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {team.logo && <img src={team.logo} alt={`${team.name} logo`} style={{ width: 30, height: 30, marginRight: 12 }} />}
                          {team.name}
                        </Box>
                      </TableCell>
                      <TableCell>{team.team_code}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <img
                            src={regionImages[team.region]}
                            alt={team.region}
                            style={{ width: 30, height: 30, marginRight: 12 }}
                          />
                          {team.region}
                        </Box>
                      </TableCell>
                      <TableCell>{team.status}</TableCell>
                      <TableCell>
                        <Button variant="contained" color="warning" onClick={() => navigate(`/TeamPage/${team.team_id}`)}  sx={{ mr: 1 }}>Team Page</Button>
                        <HiddenComponent><Button variant="contained" onClick={() => handleEditTeam(team)} sx={{ mr: 1 }}>Edit</Button></HiddenComponent>
                        <HiddenComponent><Button variant="contained" color="error" onClick={() => handleDeleteTeam(team.team_id!)}>Delete</Button></HiddenComponent>
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
        </>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>{isEditing ? "Edit Team" : "Add New Team"}</Typography>
        <ProtectedComponent>
          <AddTeamForm
            onSubmit={isEditing ? handleUpdateTeam : handleAddTeam}
            team={teamToEdit}
            isEditing={isEditing}
            onCancel={() => { setIsEditing(false); setTeamToEdit(null); }}
          />
        </ProtectedComponent>
      </Box>
    </Box>
  );
};

export default Teams;