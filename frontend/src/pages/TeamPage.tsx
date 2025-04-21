import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button } from '@mui/material';
import { useParams } from 'react-router-dom';

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

const TeamPage = () => {
  const { id } = useParams<{ id: string }>(); // Get the team ID from the URL
  const [team, setTeam] = useState<Team | null>(null);

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
      } catch (error) {
        console.error("Error fetching team:", error);
      }
    };

    fetchTeam();
  }, [id]);

  return (
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
  );
};

export default TeamPage;

