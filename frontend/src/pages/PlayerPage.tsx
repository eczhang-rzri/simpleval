import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button } from '@mui/material';
import { useParams } from 'react-router-dom';

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

const PlayerPage = () => {
  const { id } = useParams<{ id: string }>(); // Get the player ID from the URL
  const [player, setPlayer] = useState<Player | null>(null);

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

        setPlayer(mappedPlayer);
      } catch (error) {
        console.error("Error fetching player:", error);
      }
    };

    fetchPlayer();
  }, [id]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, padding: 2 }}>
      {player?.profile_picture && (
        <Box mt={2}>
          <img src={player?.profile_picture} alt={`${player.in_game_name} picture`} className='img-profile' />
        </Box>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{player?.in_game_name}</Typography>
        <Typography variant="h5" sx={{ color: 'gray'}}>{player?.real_name}</Typography>
        <Typography variant="h5">{player?.country_name}</Typography>
      </Box>

    </Box>
  );
}

export default PlayerPage;