import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Button } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

axios.defaults.baseURL = 'https://simpleval-api.azurewebsites.net';

interface Team {
  team_id?: number;
  name: string;
  team_code: string;
  logo?: string; 
  region: string;
  status: string;
}

interface Player {
  player_id: number;
  in_game_name: string;
  real_name: string;
  role?: string;
  profile_picture?: string;
  status: string;
  country_name: string;
  country_flag_code: string;
  team_id?: number;
}

interface Match {
  match_id?: number;
  team_a_id: number;
  team_b_id: number;
  team_a_maps_won?: number | null;
  team_b_maps_won?: number | null;
  date: string;
}

const regionImages: { [key: string]: string } = {
  Americas: 'https://owcdn.net/img/640f5ab71dfbb.png',
  EMEA: 'https://owcdn.net/img/65ab59620a233.png',
  Pacific: 'https://owcdn.net/img/640f5ae002674.png',
  China: 'https://owcdn.net/img/65dd97cea9a25.png',
};


const TeamPage = () => {
  const { id } = useParams<{ id: string }>(); // Get the team ID from the URL
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchTeams, setMatchTeams] = useState<{ team_id: number; name: string; logo: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const fetchTeam = async () => {
      try {
        const response = await axios.get(`/teams/${id}`); 

        // Map the response data to match our frontend model
        const mappedTeam: Team = {
          team_id: response.data.id,
          name: response.data.name,
          team_code: response.data.team_code,
          logo: response.data.logo || 'https://www.vlr.gg/img/vlr/tmp/vlr.png',
          region: response.data.region,
          status: response.data.status
        };

        setTeam(mappedTeam);

        // Get players for this team
        const playersResponse = await axios.get('/players'); // Fetch all players
        const teamPlayers = playersResponse.data.filter((player: any) => { // Filter players by team_id
          return parseInt(player.team_id) === parseInt(id);  // Convert id to a number so comparison works
        });
        
        const mappedPlayers = teamPlayers.map((player: any) => {
          return {
            player_id: player.player_id ?? player.id, // support either
            in_game_name: player.in_game_name,
            real_name: player.real_name,
            role: player.role || 'N/A',
            profile_picture: player.profile_picture || 'https://www.vlr.gg/img/base/ph/sil.png',
            status: player.status,
            country_name: player.country_name,
            country_flag_code: player.country_flag_code,
            team_id: player.team_id || null,
          };
        }).sort((a: Player, b: Player) => a.in_game_name.localeCompare(b.in_game_name)); // Sort by in_game_name
        
        setPlayers(mappedPlayers);

        // Get matches for this team
        const matchesResponse = await axios.get('/matches'); // Fetch all matches
        const matches = matchesResponse.data.filter((match: any) => {
          return parseInt(match.team_a_id) === parseInt(id) || parseInt(match.team_b_id) === parseInt(id);
        });

        const mappedMatches = matches.map((match: any) => {
          return {
            match_id: match.match_id ?? match.id, // support either
            team_a_id: match.team_a_id,
            team_b_id: match.team_b_id,
            team_a_maps_won: match.team_a_maps_won || null,
            team_b_maps_won: match.team_b_maps_won || null,
            date: match.date,
          };
        }).sort((a: Match, b: Match) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending
        setMatches(mappedMatches);

        // Get teams for matches
        if (matches.length > 0) {
          const matchTeamsResponse = await axios.get('/teams'); // Fetch all teams
          const matchTeams = matchTeamsResponse.data.filter((team: any) => {
            return matches.some((match: any) => {
              return parseInt(match.team_a_id) === parseInt(team.id) || parseInt(match.team_b_id) === parseInt(team.id);
            });
          }).map((team: any) => {
            return {
              team_id: team.id,
              name: team.name,
              logo: team.logo || 'https://www.vlr.gg/img/vlr/tmp/vlr.png',
            };
          });
          setMatchTeams(matchTeams);
        }

      } catch (error) {
        console.error("Error fetching team / players / matches:", error);
      }
    };

    fetchTeam();
  }, [id]);

    // Helper to get team name
    const getTeamName = (team_id?: number | null): string => {
      if (team_id == null) return 'No team'; // Handles both null and undefined
      const team = matchTeams.find(t => t.team_id === team_id);
      return team ? team.name : 'Unknown Team';
    };
  
    //Helper to get team logo
    const getTeamLogo = (team_id?: number | null): string => {
      if (team_id == null) return 'https://www.vlr.gg/img/vlr/tmp/vlr.png'; // Default logo
      const team = matchTeams.find(t => t.team_id === team_id);
      return team?.logo || 'https://www.vlr.gg/img/vlr/tmp/vlr.png';
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
    <div>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, padding: 2 }}>
        {team?.logo && (
          <Box mt={2}>
            <img src={team?.logo} alt={`${team.name} logo`} className='img-profile' />
          </Box>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{team?.name}</Typography>
          <Typography variant="h5" sx={{ color: 'gray'}}>{team?.team_code}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {team?.region && (
              <>
                {regionImages[team.region] && (
                  <img
                    src={regionImages[team.region]}
                    alt={team.region}
                    style={{ width: '24px', height: '24px' }}
                  />
                )}
                <Typography variant="h5">{team.region}</Typography>
              </>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>Players</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#002147' }}>
                <TableCell sx={{ color: 'white' }}>Name</TableCell>
                <TableCell sx={{ color: 'white' }}>Role</TableCell>
                <TableCell sx={{ color: 'white' }}>Country</TableCell>
                <TableCell sx={{ color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {players.length > 0 ? (
                players.map((player) => (
                  <TableRow key={player.player_id}>
                    <TableCell>{player.in_game_name}</TableCell>
                    <TableCell>{player.role}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span className={`fi fi-${player.country_flag_code?.toLowerCase()}`} style={{ width: '1.5em', height: '1em' }} />
                        {player.country_name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button variant="contained" onClick={() => navigate(`/PlayerPage/${Number(player.player_id)}`)} sx={{ mr: 1 }}>View Profile</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No players on this team.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>Recent Matches</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#002147', color: '#f9f9f9' }}>
                <TableCell sx={{color: '#f9f9f9'}}>Date</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Time</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Team A</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Team B</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Winner</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Score</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Actions</TableCell>
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
                      <Button variant="contained" color="primary" onClick={() => navigate(`/MatchPage/${match.match_id}`)} sx={{ mr: 1 }}>Match Page</Button> {/* Add link to match page */}
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
    </div>
  )};

export default TeamPage;

