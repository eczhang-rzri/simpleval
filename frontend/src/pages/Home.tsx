import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Box, Typography} from '@mui/material';

//configure axios to use backend server URL
const apiUrl = process.env.VITE_API_URL;
axios.defaults.baseURL = apiUrl;

interface Match {
  match_id?: number;
  team_a_id: number;
  team_b_id: number;
  team_a_maps_won?: number | null;
  team_b_maps_won?: number | null;
  date: string;
}

const Home = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [teams, setTeams] = useState<{ team_id: number; name: string; logo: string; }[]>([]);

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
            team_a_maps_won: match.team_a_maps_won || null,
            team_b_maps_won: match.team_b_maps_won || null,
            date: match.date,
            time: match.time,
          }))
        : [];

      const sortedMatches = mappedMatches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending 
      const displayedMatches = sortedMatches.slice(0, 5); // Display only the first 5 matches
      setMatches(displayedMatches);
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

  return (
    <Box>
      <Box sx={{ p: 4, backgroundColor: '#f9f9f9' }}>
        <Typography variant='h3' sx={{ mb: 4 }}>Welcome to SimpleVAL</Typography>
        <Typography variant='h5' sx={{ mb: 1 }}>VALORANT esports tracking made simple.</Typography>
        <Typography variant='h5'>Stay updated with teams, players, the latest matches.</Typography>
      </Box>
      
      <Box sx={{ mt: 4, p: 4, backgroundColor: '#f9f9f9' }}>
        <Typography variant="h4" gutterBottom>Recent Matches</Typography>
        <Button onClick={() => navigate('/Matches')}sx={{ mb: 1 }}>View All Matches</Button>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
                <TableRow sx={{ backgroundColor: '#002147', color: '#f9f9f9' }}>
                    <TableCell sx={{ color: '#f9f9f9'}}>Date</TableCell>
                    <TableCell sx={{color: '#f9f9f9'}}>Time</TableCell>
                    <TableCell sx={{color: '#f9f9f9'}}>Team A</TableCell>
                    <TableCell sx={{color: '#f9f9f9'}}>Team B</TableCell>
                    <TableCell sx={{color: '#f9f9f9'}}>Winner</TableCell>
                    <TableCell sx={{color: '#f9f9f9'}}>Score</TableCell>
                    <TableCell sx={{color: '#f9f9f9'}}></TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {matches.length > 0 ? (
                  matches.map((match) => (
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
                          <Button variant="contained" color="warning" onClick={() => navigate(`/MatchPage/${match.match_id}`)}>Match Page</Button> {/* Add link to match page */}
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
      </Box>
    </Box>

  );
}

export default Home;