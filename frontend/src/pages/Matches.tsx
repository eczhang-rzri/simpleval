import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { TextField, InputAdornment, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Box, Typography, Alert } from '@mui/material';
import AddMatchForm from '@/components/forms/AddMatchForm';
import ProtectedComponent from '@/components/ProtectedComponent';
import HiddenComponent from '@/components/HiddenComponent';

//configure axios to use backend server URL
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
  match_id?: number; // Added match_id as an optional property
  team_a_id: number;
  team_b_id: number;
  team_a_maps_won?: number | null;
  team_b_maps_won?: number | null;
  date: string;
  time: string; 
}

const Matches = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [matchToEdit, setMatchToEdit] = useState<Match | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [teams, setTeams] = useState<{ team_id: number; name: string; logo: string; }[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // for sort order
  const [searchQuery, setSearchQuery] = useState<string>(''); // for search query

  //table pages
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [matchesPerPage] = useState<number>(10); // number of players per page

  const fetchMatches = async () => {
    try {
        setLoading(true);
        const response = await axios.get('/matches');
        
        // Map the response data to match frontend model
        const mappedMatches = Array.isArray(response.data)
          ? response.data.map((match: any) => ({
              match_id: match.id,
              team_a_id: match.team_a_id,
              team_b_id: match.team_b_id,
              team_a_maps_won: match.team_a_maps_won ?? null,
              team_b_maps_won: match.team_b_maps_won ?? null,
              date: match.date,
              time: match.time,
            }))
          : [];

        const sortedMatches = mappedMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending 
        setMatches(sortedMatches);
    } catch (err) {
        if (err instanceof Error) {
            setError(err);
            console.error("Error fetching matches:", err);
        } else {
            console.error("Unknown error:", err);
        }
        setMatches([]);
    } finally {
        setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/teams'); 
      const teamList = Array.isArray(response.data)
        ? response.data.map((team: any) => ({
            team_id: team.id, // Map id to team_id
            name: team.name,
            logo: team.logo || 'https://www.vlr.gg/img/vlr/tmp/vlr.png'
          }))
        : [];
      setTeams(teamList);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchMatches();  // Fetch matches data
      await fetchTeams();    // Fetch teams data
    };
    fetchData();
  }, []);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Helper to get team name
  const getTeamName = (team_id?: number | null): string => {
    if (team_id == null) return 'No team'; // Handles both null and undefined
    const team = teams.find(t => t.team_id === team_id);
    return team ? team.name : 'Unknown Team';
  };

  //Helper to get team logo
  const getTeamLogo = (team_id?: number | null): string => {
    if (team_id == null) return 'https://www.vlr.gg/img/base/ph/sil.png'; // Default logo
    const team = teams.find(t => t.team_id === team_id);
    return team ? team.logo || 'https://www.vlr.gg/img/base/ph/sil.png' : 'https://www.vlr.gg/img/base/ph/sil.png';
  };

  // Helper to get winning team name
  const getWinningTeam = (match: Match): string => {
    // Handle undefined values explicitly
    const teamAMapsWon = match.team_a_maps_won ?? -1; // Default to -1 if undefined
    const teamBMapsWon = match.team_b_maps_won ?? -1; // Default to -1 if undefined
  
    if (teamAMapsWon === -1 || teamBMapsWon === -1) return 'Unknown'; // Handle undefined case
    if (teamAMapsWon === teamBMapsWon) return 'Draw'; // Handle draw case
  
    return teamAMapsWon > teamBMapsWon
      ? getTeamName(match.team_a_id)
      : getTeamName(match.team_b_id);
  };

  // Helper to get winning team's logo
  const getWinningTeamLogo = (match: Match): string => {
    const winningTeamId = match.team_a_maps_won! > match.team_b_maps_won! ? match.team_a_id : match.team_b_id;
    return getTeamLogo(winningTeamId);
  };

  const handleAddMatch = async (newMatch: Match) => {
    try {
      console.log("Attempting to add match:", newMatch);
      
      // Transform data to match backend model
      const matchData = {
        team_a_id: newMatch.team_a_id,
        team_b_id: newMatch.team_b_id,
        team_a_maps_won: newMatch.team_a_maps_won ?? null,
        team_b_maps_won: newMatch.team_b_maps_won ?? null,
        date: newMatch.date,
      };
      
      const response = await axios.post('/matches', matchData);
      console.log("Add match response:", response);
      const match_id = response.data.id; // Get the match ID from the response

      // Get 5 players from each team
      const [teamAPlayersResponse, teamBPlayersResponse] = await Promise.all([
        axios.get(`/players?team_id=${matchData.team_a_id}`),
        axios.get(`/players?team_id=${matchData.team_b_id}`)
      ]);

      const playerIds = [
        ...teamAPlayersResponse.data.slice(0, 5),
        ...teamBPlayersResponse.data.slice(0, 5)
      ].map(player => player.id);

      // Loop and post each match-player relation
      const matchPlayerPromises = playerIds.map(player_id => {
        console.log(`Adding match-player relation: match_id=${match_id}, player_id=${player_id}`);
        return axios.post('/match_players', { match_id, player_id });
      });
      await Promise.all(matchPlayerPromises);
      
      // Map the response to match frontend model
      const addedMatch = {
        match_id: response.data.id,
        team_a_id: response.data.team_a_id,
        team_b_id: response.data.team_b_id,
        team_a_maps_won: response.data.team_a_maps_won ?? null,
        team_b_maps_won: response.data.team_b_maps_won ?? null,
        date: response.data.date,
        time: response.data.time || '', // Ensure the time property is included
      };
      
      setMatches(prevMatches => [...prevMatches, addedMatch]);
      setError(null);
    } catch (error) {
      console.error("Error adding match:", error);
      if (axios.isAxiosError(error)) {
        console.error("API Error Details:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      setError(new Error(`Failed to add match: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };

  const handleEditMatch = (match: Match) => {
    setIsEditing(true);
    setMatchToEdit(match);
  };

  const handleUpdateMatch = async (updatedMatch: Match) => {
    try {
      if (!updatedMatch.match_id) {
        throw new Error("Match ID is required for updates");
      }
      
      // Transform data to match backend model
      const matchData = {
        team_a_id: updatedMatch.team_a_id,
        team_b_id: updatedMatch.team_b_id,
        team_a_maps_won: updatedMatch.team_a_maps_won ?? null,
        team_b_maps_won: updatedMatch.team_b_maps_won ?? null,
        date: updatedMatch.date,
      };
      
      // Updated URL to match backend
      const response = await axios.put(`/matches/${updatedMatch.match_id}`, matchData);
      
      // Map the response to match frontend model
      const updatedMatchFromResponse = {
        match_id: response.data.id,
        team_a_id: response.data.team_a_id,
        team_b_id: response.data.team_b_id,
        team_a_maps_won: response.data.team_a_maps_won ?? null,
        team_b_maps_won: response.data.team_b_maps_won ?? null,
        date: response.data.date,
        time: response.data.time || ''
      };
      
      setMatches(prevMatches => prevMatches.map(match => 
        match.match_id === updatedMatch.match_id ? updatedMatchFromResponse : match
      ));
      setIsEditing(false);
      setMatchToEdit(null);
      setError(null);
    } catch (error) {
      console.error("Error updating match:", error);
      setError(new Error(`Failed to update match: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };

  const handleDeleteMatch = async (match_id: number) => {
    try {
      await axios.delete(`/match_players/${match_id}`); // Delete match-player relations first
      await axios.delete(`/matches/${match_id}`);
      setMatches(prevMatches => prevMatches.filter(match => match.match_id !== match_id));
    } catch (error) {
      console.error("Error deleting match:", error);
      setError(new Error(`Failed to delete match: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };

  const clearError = () => {
    setError(null);
  };

  const convertMatchToFormData = (match: Match): MatchFormData => {
    const dateObj = new Date(match.date);
    const date = dateObj.toISOString().split('T')[0];
    const time = dateObj.toTimeString().split(':').slice(0, 2).join(':');
    
    return {
      match_id: match.match_id,
      team_a_id: match.team_a_id,
      team_b_id: match.team_b_id,
      team_a_maps_won: match.team_a_maps_won ?? null,
      team_b_maps_won: match.team_b_maps_won ?? null,
      date,
      time,
    };
  };

  // helpers for converting date and time
  const convertDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
  
  const convertTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    setCurrentPage(1); // Reset to first page on sort change
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // filter matches based on search query - by team names
  const filteredMatches = matches.filter(match =>
    (getTeamName(match.team_a_id).toLowerCase().includes(searchQuery.toLowerCase()) || 
     getTeamName(match.team_b_id).toLowerCase().includes(searchQuery.toLowerCase())) // case insensitive
  );

  const sortedMatches = [...filteredMatches].sort((a, b) =>
    sortOrder === 'asc'
      ? new Date(a.date).getTime() - new Date(b.date).getTime()
      : new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  //helpers for pagination logic
  const indexOfLastMatch = currentPage * matchesPerPage;
  const indexOfFirstMatch = indexOfLastMatch - matchesPerPage;
  const currentMatches = sortedMatches.slice(indexOfFirstMatch, indexOfLastMatch);
  const totalPages = Math.ceil(matches.length / matchesPerPage);

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
      <Typography variant="h4" gutterBottom>All Matches</Typography>
      
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}
      
      {loading ? (
        <Typography>Loading matches...</Typography>
      ) : (
        <>
          {/* Pagination controls + search */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography>
                Showing {indexOfFirstMatch + 1} to {Math.min(indexOfLastMatch, matches.length)} of {matches.length} matches
              </Typography>

              <Box sx={{ ml: 8,  mr: 20, minWidth: 400, maxWidth: 800 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search matches by team..."
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
                    Date&nbsp;
                    {sortOrder === 'asc' ? '▼' : '▲'}
                  </TableCell>
                  <TableCell sx={{color: '#f9f9f9'}}>Time</TableCell>
                  <TableCell sx={{color: '#f9f9f9'}}>Team A</TableCell>
                  <TableCell sx={{color: '#f9f9f9'}}>Team B</TableCell>
                  <TableCell sx={{color: '#f9f9f9'}}>Winner</TableCell>
                  <TableCell sx={{color: '#f9f9f9'}}>Score</TableCell>
                  <TableCell sx={{color: '#f9f9f9'}}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentMatches.length > 0 ? (
                  currentMatches.map((match) => (
                    <TableRow key={match.match_id}>
                      <TableCell>{convertDate(match.date)}</TableCell>
                      <TableCell>{convertTime(match.date)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTeamLogo(match.team_a_id) && (
                            <img 
                              src={getTeamLogo(match.team_a_id)} 
                              alt={`${getTeamName(match.team_a_id)} logo`} 
                              style={{ width: 30, height: 30, objectFit: 'contain', marginRight: 5 }} 
                            />
                          )}
                          {getTeamName(match.team_a_id)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getTeamLogo(match.team_b_id) && (
                            <img 
                              src={getTeamLogo(match.team_b_id)} 
                              alt={`${getTeamName(match.team_b_id)} logo`} 
                              style={{ width: 30, height: 30, objectFit: 'contain', marginRight: 5 }} 
                            />
                          )}
                          {getTeamName(match.team_b_id)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getWinningTeamLogo(match) && (
                            <img 
                              src={getWinningTeamLogo(match)} 
                              alt={`${getWinningTeam(match)} logo`} 
                              style={{ width: 30, height: 30, objectFit: 'contain', marginRight: 5 }} 
                            />
                          )}
                          {getWinningTeam(match)}
                        </Box>
                      </TableCell>
                      <TableCell>{match.team_a_maps_won}-{match.team_b_maps_won}</TableCell>
                      <TableCell>
                        <Button variant="contained" color="warning" onClick={() => navigate(`/MatchPage/${match.match_id}`)} sx={{ mr: 1 }}>Match Page</Button> {/* Add link to match page */}
                        <HiddenComponent><Button variant="contained" onClick={() => handleEditMatch(match)} sx={{ mr: 1 }}>Edit</Button></HiddenComponent>
                        <HiddenComponent><Button variant="contained" color="error" onClick={() => handleDeleteMatch(match.match_id!)}>Delete</Button></HiddenComponent>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No matches found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
        
      )}
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>{isEditing ? "Edit Match" : "Add New Match"}</Typography>
        <ProtectedComponent>
          <AddMatchForm
              onSubmit={isEditing ? handleUpdateMatch : handleAddMatch}
              match={isEditing && matchToEdit ? convertMatchToFormData(matchToEdit) : null}
              isEditing={isEditing}
              onCancel={() => { setIsEditing(false); setMatchToEdit(null); }}
            />
        </ProtectedComponent>
      </Box>

    </Box>
  );
};

export default Matches;