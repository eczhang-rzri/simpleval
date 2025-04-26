import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button } from '@mui/material';
import { useParams } from 'react-router-dom';
import 'flag-icons/css/flag-icons.min.css'; // Import flag icons CSS - flag codes repo: https://github.com/lipis/flag-icons/tree/main/flags/4x3
import { useNavigate } from 'react-router-dom';

axios.defaults.baseURL = 'https://simpleval-api.azurewebsites.net';

interface Player {
  player_id?: number;
  in_game_name: string;
  real_name: string;
  role?: string;
  country_name: string;
  country_flag_code: string;
  profile_picture?: string;
  status: string;
  team_id?: number;
}

interface Team {
  team_id?: number;
  name: string;
  logo?: string; 
}

const PlayerPage = () => {
  const { id } = useParams<{ id: string }>(); // Get the player ID from the URL
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const fetchPlayer = async () => {
      try {
        const response = await axios.get(`/players/${id}`); 

        // Map the response data to match our frontend model
        const mappedPlayer : Player = {
          player_id: response.data.id,
          in_game_name: response.data.in_game_name,
          real_name: response.data.real_name,
          role: response.data.role || 'Unknown',
          country_name: response.data.country_name,
          country_flag_code: response.data.country_flag_code,
          profile_picture: response.data.profile_picture || 'https://www.vlr.gg/img/base/ph/sil.png',
          status: response.data.status,
          team_id: response.data.team_id || null,
        }

        if (response.data.team_id) {
          try {
            const teamResponse = await axios.get(`/teams/${response.data.team_id}`);
            const mappedTeam: Team = {
              team_id: teamResponse.data.id,
              name: teamResponse.data.name,
              logo: teamResponse.data.logo || null,
            };
            setTeam(mappedTeam);
          } catch (teamError) {
            console.error("Error fetching team:", teamError);
          }
        }
        
        setPlayer(mappedPlayer);
      } catch (error) {
        console.error("Error fetching player:", error);
      }
    };

    fetchPlayer();
  }, [id]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, padding: 2 }}>
        {player?.profile_picture && (
          <Box mt={2}>
            <img src={player?.profile_picture} alt={`${player.in_game_name} picture`} className='img-profile' />
          </Box>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{player?.in_game_name}</Typography>
          <Typography variant="h5" sx={{ color: 'gray'}}>{player?.real_name}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span 
              className={`fi fi-${player?.country_flag_code?.toLowerCase()}`} 
              style={{ width: '1.5em', height: '1em' }} 
            />
            <Typography variant="h5">{player?.country_name}</Typography>
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, padding: 2 }}>
        {team ? (
          <>
            {team.logo && (
              <img 
                src={team.logo} 
                alt={`${team.name} logo`} 
                style={{ width: 40, height: 40, objectFit: 'contain' }} 
              />
            )}
            <Typography 
              variant="h5"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1, // Space between text and separator
                lineHeight: 2.5, // Makes the line/row taller
                fontSize: '1.2rem',
              }}
            >
              <Button onClick={() => navigate(`/TeamPage/${team.team_id}`)} sx={{ fontSize: '1.1rem', color: '#1f1f1f'}}>{team.name}</Button>
              <Box 
                component="span" 
                sx={{
                  height: '1.5em',
                  width: '1px',
                  backgroundColor: 'gray',
                  mx: 1, // margin left & right of the separator
                }} 
              />
              {player?.role}
            </Typography>
          </>
        ) : (
          <Typography variant="h5" sx={{ fontStyle: 'italic', color: 'gray' }}>
            No team
          </Typography>
        )}
      </Box>
    </Box>

  );
}

export default PlayerPage;