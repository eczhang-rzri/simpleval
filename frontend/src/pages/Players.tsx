import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Box, Typography, Alert } from '@mui/material';
import AddPlayerForm from '@/components/AddPlayerForm';

// Configure Axios to use backend server URL
axios.defaults.baseURL = 'https://simpleval-api.azurewebsites.net';

interface Player {
    player_id?: number; // Make optional for new players
    in_game_name: string;
    real_name: string;
    role?: string;
    country_name: string;
    country_flag_code: string;
    profile_picture?: string;
    status: string;
    team_id?: number;
}

const Players = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPlayers = async () => {
        try {
            setLoading(true);
            // Updated URL to match backend
            const response = await axios.get('/players');
            
            // Map the response data to match our frontend model
            const mappedPlayers = Array.isArray(response.data) ? response.data.map((player: any) => ({
              player_id: player.id, // Map id to player_id
              in_game_name: player.in_game_name,
              real_name: player.real_name,
              role: player.role,
              country_name: player.country_name,
              country_flag_code: player.country_flag_code,
              profile_picture: player.profile_picture || null, // Default to null if missing
              status: player.status,
              team_id: player.team_id || null, // Default if missing
            })) : [];
            
            setPlayers(mappedPlayers);
        } catch (err) {
            if (err instanceof Error) {
                setError(err);
                console.error("Error fetching players:", err);
            } else {
                console.error("Unknown error:", err);
            }
            setPlayers([]);
        } finally {
            setLoading(false);
        }
    };

    fetchPlayers();
  }, []);

  const handleAddPlayer = async (newPlayer: Player) => {
    try {
      console.log("Attempting to add player:", newPlayer);
      
      // Transform data to match backend model
      const playerData = {
        in_game_name: newPlayer.in_game_name,
        real_name: newPlayer.real_name,
        role: newPlayer.role,
        country_name: newPlayer.country_name,
        country_flag_code: newPlayer.country_flag_code,
        profile_picture: newPlayer.profile_picture || null,
        status: newPlayer.status,
        team_id: newPlayer.team_id || null, // Default if missing
      };
      
      // Updated URL to match backend
      const response = await axios.post('/players', playerData);
      console.log("Add team response:", response);
      
      // Map the response to match frontend model
      const addedPlayer = {
        player_id: response.data.id,
        in_game_name: response.data.in_game_name,
        real_name: response.data.real_name,
        role: response.data.role,
        country_name: response.data.country_name,
        country_flag_code: response.data.country_flag_code,
        profile_picture: response.data.profile_picture || null,
        status: response.data.status,
        team_id: response.data.team_id || null, // Default if missing
      };
      
      setPlayers(prevPlayers => [...prevPlayers, addedPlayer]);
      setError(null);
    } catch (error) {
      console.error("Error adding player:", error);
      if (axios.isAxiosError(error)) {
        console.error("API Error Details:", {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      setError(new Error(`Failed to add player: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };

  const handleEditPlayer = (player: Player) => {
    setIsEditing(true);
    setPlayerToEdit(player);
  };

  const handleUpdatePlayer = async (updatedPlayer: Player) => {
    try {
      if (!updatedPlayer.player_id) {
        throw new Error("Player ID is required for updates");
      }
      
      // Transform data to match backend model
      const playerData = {
        in_game_name: updatedPlayer.in_game_name,
        real_name: updatedPlayer.real_name,
        role: updatedPlayer.role,
        country_name: updatedPlayer.country_name,
        country_flag_code: updatedPlayer.country_flag_code,
        profile_picture: updatedPlayer.profile_picture || null,
        status: updatedPlayer.status,
        team_id: updatedPlayer.team_id || null, // Default if missing
      };
      
      // Updated URL to match backend
      const response = await axios.put(`/players/${updatedPlayer.player_id}`, playerData);
      
      // Map the response to match frontend model
      const updatedPlayerFromResponse = {
        player_id: response.data.id,
        in_game_name: response.data.in_game_name,
        real_name: response.data.real_name,
        role: response.data.role,
        country_name: response.data.country_name,
        country_flag_code: response.data.country_flag_code,
        profile_picture: response.data.profile_picture || null,
        status: response.data.status,
        team_id: response.data.team_id || null, // Default if missing
      };
      
      setPlayers(prevPlayers => prevPlayers.map(player => 
        player.player_id === updatedPlayer.player_id ? updatedPlayerFromResponse : player
      ));
      setIsEditing(false);
      setPlayerToEdit(null);
      setError(null);
    } catch (error) {
      console.error("Error updating player:", error);
      setError(new Error(`Failed to update player: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };

  const handleDeletePlayer = async (player_id: number) => {
    try {
      await axios.delete(`/players/${player_id}`);
      setPlayers(prevPlayers => prevPlayers.filter(player => player.player_id !== player_id));
    } catch (error) {
      console.error("Error deleting player:", error);
      setError(new Error(`Failed to delete player: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#f9f9f9' }}>
      <Typography variant="h5" gutterBottom>All Players</Typography>
      
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}
      
      {loading ? (
        <Typography>Loading players...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#002147', color: '#f9f9f9' }}>
                <TableCell sx={{color: '#f9f9f9'}}>Name</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Real Name</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Role</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Country</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Status</TableCell>
                <TableCell sx={{color: '#f9f9f9'}}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {players.length > 0 ? (
                players.map((player) => (
                  <TableRow key={player.player_id}>
                    <TableCell>{player.in_game_name}</TableCell>
                    <TableCell>{player.real_name}</TableCell>
                    <TableCell>{player.role}</TableCell>
                    <TableCell>{player.country_name}</TableCell>
                    <TableCell>{player.status}</TableCell>
                    <TableCell>
                      <Button variant="contained" onClick={() => handleEditPlayer(player)} sx={{ mr: 1 }}>Edit</Button>
                      <Button variant="contained" color="error" onClick={() => handleDeletePlayer(player.player_id!)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">No players found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>{isEditing ? "Edit Player" : "Add New Player"}</Typography>
        <AddPlayerForm
          onSubmit={isEditing ? handleUpdatePlayer : handleAddPlayer}
          player={playerToEdit}
          isEditing={isEditing}
          onCancel={() => { setIsEditing(false); setPlayerToEdit(null); }}
        />
      </Box>
    </Box>
  );
};

export default Players;