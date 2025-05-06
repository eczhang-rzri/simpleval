import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';

axios.defaults.baseURL = 'https://simpleval-api.azurewebsites.net';

interface Match {
  match_id?: number;
  team_a_id: number;
  team_b_id: number;
  team_a_maps_won?: number | null;
  team_b_maps_won?: number | null;
  date: string;
}

interface Player {
  player_id?: number;
  in_game_name: string;
  real_name: string;
  role?: string;
  country_flag_code: string;
  team_id?: number;
}

interface Team {
  team_id?: number;
  name: string;
  logo?: string; 
}

const MatchPage = () => {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [matchPlayers, setMatchPlayers] = useState<Player[]>([]);
  const [playersA, setPlayersA] = useState<Player[]>([]);
  const [playersB, setPlayersB] = useState<Player[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    // Create an AbortController to cancel requests if component unmounts
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchMatchData = async () => {
      try {
        // Fetch basic match info
        const matchResponse = await axios.get(`/matches/${id}`, { signal });
        
        const mappedMatch: Match = {
          match_id: matchResponse.data.id,
          team_a_id: matchResponse.data.team_a_id,
          team_b_id: matchResponse.data.team_b_id,
          team_a_maps_won: matchResponse.data.team_a_maps_won || null,
          team_b_maps_won: matchResponse.data.team_b_maps_won || null,
          date: matchResponse.data.date,
        };
        
        setMatch(mappedMatch);
        
        // Fetch Team A and Team B details
        const teamAPromise = matchResponse.data.team_a_id ? 
          axios.get(`/teams/${matchResponse.data.team_a_id}`, { signal }) : 
          Promise.resolve({ data: null });
          
        const teamBPromise = matchResponse.data.team_b_id ? 
          axios.get(`/teams/${matchResponse.data.team_b_id}`, { signal }) : 
          Promise.resolve({ data: null });
          
        const [teamAResponse, teamBResponse] = await Promise.all([teamAPromise, teamBPromise]);
        
        if (teamAResponse.data) {
          const mappedTeamA: Team = {
            team_id: teamAResponse.data.id,
            name: teamAResponse.data.name,
            logo: teamAResponse.data.logo || 'https://www.vlr.gg/img/vlr/tmp/vlr.png',
          };
          setTeamA(mappedTeamA);
        }
        
        if (teamBResponse.data) {
          const mappedTeamB: Team = {
            team_id: teamBResponse.data.id,
            name: teamBResponse.data.name,
            logo: teamBResponse.data.logo || 'https://www.vlr.gg/img/vlr/tmp/vlr.png',
          };
          setTeamB(mappedTeamB);
        }
        
        // Fetch Players for this match using the Players association
        if (matchResponse.data.players && Array.isArray(matchResponse.data.players)) {
          // If the backend properly returns players with the match
          const allMatchPlayers = matchResponse.data.players.map((player: any) => ({
            player_id: player.id,
            in_game_name: player.in_game_name,
            real_name: player.real_name,
            role: player.role || 'N/A',
            country_flag_code: player.country_flag_code,
            team_id: player.team_id
          }));
          
          setMatchPlayers(allMatchPlayers);
          
          // Sort players by team
          const teamAPlayers = allMatchPlayers.filter((player: Player) => player.team_id === matchResponse.data.team_a_id).sort((a: Player, b: Player) => a.in_game_name.localeCompare(b.in_game_name));
          const teamBPlayers = allMatchPlayers.filter((player: Player) => player.team_id === matchResponse.data.team_b_id).sort((a: Player, b: Player) => a.in_game_name.localeCompare(b.in_game_name));
          
          setPlayersA(teamAPlayers);
          setPlayersB(teamBPlayers);
        } else {
          // Fallback: Fetch all players and then filter by team_id
          // This is a workaround if the backend doesn't properly include the players with the match
          const allPlayersResponse = await axios.get('/players', { signal });
          
          if (allPlayersResponse.data && Array.isArray(allPlayersResponse.data)) {
            const allPlayers = allPlayersResponse.data.map((player: any) => ({
              player_id: player.id,
              in_game_name: player.in_game_name,
              real_name: player.real_name,
              role: player.role || 'N/A',
              country_flag_code: player.country_flag_code,
              team_id: player.team_id
            }));
            
            // Filter players by team
            const teamAPlayers = allPlayers.filter(player => player.team_id === matchResponse.data.team_a_id);
            const teamBPlayers = allPlayers.filter(player => player.team_id === matchResponse.data.team_b_id);
            
            setPlayersA(teamAPlayers);
            setPlayersB(teamBPlayers);
          }
        }
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Error fetching match data:", error);
        }
      }
    };

    fetchMatchData();

    // Clean up function to cancel any ongoing requests when component unmounts
    return () => {
      controller.abort();
    };
  }, [id]);

  // helpers for converting date and time
  const convertDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: '2-digit',
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
      <Box className="match-card">
        <Typography variant="h6">{match?.date ? convertDate(match.date) : 'Date not available'}</Typography>
        <Typography variant="h6">{match?.date ? convertTime(match.date) : 'Date not available'}</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, pt: 4, pb: 8, pl: 4, pr: 4, mt: 2, justifyContent: 'space-between', postiion: 'relative' }}>
            {/* team A logo and name */}
            <Box 
              sx={{ display: 'flex', alignItems: 'center', gap: 4, pt: 1, pb: 1, pl: 4, pr: 4, cursor: 'pointer', '&:hover': { backgroundColor: '#f0f0f0' }, marginRight: 4, justifyContent: 'flex-end', flex: 1}}
              onClick={() => navigate(`/TeamPage/${teamA?.team_id}`)}> 
              <Typography variant="h4" sx={{fontWeight: 'bold', textAlign: 'right'}}>{teamA?.name}</Typography>
              {teamA?.logo && <img src={teamA.logo} alt={`${teamA.name} logo`} className='img-match'/>}
            </Box>
            
            {/* score - always in the absolute center regardless of teams */}
            <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              {/* team A maps won - green if > team B maps won */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 'bold',
                  color: (match?.team_a_maps_won ?? 0) > (match?.team_b_maps_won ?? 0) ? 'green' : 'inherit',
                  mr: -2
                }}
              >
                {match?.team_a_maps_won}
              </Typography>

              {/* separator (dash) */}
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              &nbsp;–&nbsp; {/* spaces around the separator */}
              </Typography>

              {/* team B maps won - green if > team A maps won */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 'bold',
                  color: (match?.team_b_maps_won ?? 0) > (match?.team_a_maps_won ?? 0) ? 'green' : 'inherit',
                  ml: -2
                }}
              >
                {match?.team_b_maps_won}
              </Typography>
            </Box>

            {/* team b logo and name */}
            <Box 
              sx={{ display: 'flex', alignItems: 'center', gap: 4, pt: 1, pb: 1, pl: 4, pr: 4, cursor: 'pointer', '&:hover': { backgroundColor: '#f0f0f0' }, marginLeft: 4, justifyContent: 'flex-start', flex: 1 }}
              onClick={() => navigate(`/TeamPage/${teamB?.team_id}`)}> 
              {teamB?.logo && <img src={teamB.logo} alt={`${teamB.name} logo`} className='img-match'/>}
              <Typography variant="h4" sx={{fontWeight: 'bold'}} >{teamB?.name}</Typography>
            </Box>
          </Box>
        
          {/* player tables */}
          <Box sx={{ 
            display: 'flex', 
            width: '100%',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            {/* Team A Players */}
            <Box sx={{ width: 'calc(50% - 16px)' }}>
              <Typography variant="h5" gutterBottom>{teamA?.name} Players</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#002147' }}>
                      <TableCell sx={{ color: 'white' }}>Name</TableCell>
                      <TableCell sx={{ color: 'white' }}>Role</TableCell>
                      <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {playersA.length > 0 ? (
                      playersA.map((player) => (
                        <TableRow key={player.player_id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span className={`fi fi-${player.country_flag_code?.toLowerCase()}`} style={{ width: '1.5em', height: '1em' }} />
                              {player.in_game_name}
                            </Box>
                          </TableCell>
                          <TableCell>{player.role}</TableCell>
                          <TableCell>
                            <Button variant="contained" onClick={() => navigate(`/PlayerPage/${Number(player.player_id)}`)} sx={{ mr: 1 }}>View Profile</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} align="center">No players on this team.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            
            {/* Team B Players */}
            <Box sx={{ width: 'calc(50% - 16px)' }}>
              <Typography variant="h5" gutterBottom>{teamB?.name} Players</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#002147' }}>
                      <TableCell sx={{ color: 'white' }}>Name</TableCell>
                      <TableCell sx={{ color: 'white' }}>Role</TableCell>
                      <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {playersB.length > 0 ? (
                      playersB.map((player) => (
                        <TableRow key={player.player_id}>
                          <TableCell>                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span className={`fi fi-${player.country_flag_code?.toLowerCase()}`} style={{ width: '1.5em', height: '1em' }} />
                              {player.in_game_name}
                            </Box>
                          </TableCell>
                          <TableCell>{player.role}</TableCell>
                          <TableCell>
                            <Button variant="contained" onClick={() => navigate(`/PlayerPage/${Number(player.player_id)}`)} sx={{ mr: 1 }}>View Profile</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} align="center">No players on this team.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </Box>
      </Box>
    </div>
  )
};

export default MatchPage;