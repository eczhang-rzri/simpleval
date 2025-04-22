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
  record: string;
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


const TeamPage = () => {
  const { id } = useParams<{ id: string }>(); // Get the team ID from the URL
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
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
          status: response.data.status,
          record: response.data.record || '0-0',
        };

        setTeam(mappedTeam);

        const playersResponse = await axios.get('/players'); // Fetch all players
        const teamPlayers = playersResponse.data.filter((player: any) => { // Filter players by team_id
          return parseInt(player.team_id) === parseInt(id);  // Convert `id` to a number
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

      } catch (error) {
        console.error("Error fetching team and players:", error);
      }
    };

    fetchTeam();
  }, [id]);

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
          <Typography variant="h5">{team?.region}</Typography>
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
    </div>

  );
};

export default TeamPage;

