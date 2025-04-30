import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
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

interface Match {
  match_id?: number;
  team_a_id: number;
  team_b_id: number;
  team_a_maps_won?: number | null;
  team_b_maps_won?: number | null;
  date: string;
}

const PlayerPage = () => {
  const { id } = useParams<{ id: string }>(); // Get the player ID from the URL
  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchTeams, setMatchTeams] = useState<{ team_id: number; name: string; logo: string }[]>([]);
  const navigate = useNavigate();

  // states for AI description
  const [aiDescription, setAiDescription] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

        // Fetch the team details for this player's team if applicable
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

        // Map the matches of this player
        if (response.data.matches) {
          const mappedMatches: Match[] = response.data.matches.map((match: any) => ({
            match_id: match.id,
            team_a_id: match.team_a_id,
            team_b_id: match.team_b_id,
            team_a_maps_won: match.team_a_maps_won,
            team_b_maps_won: match.team_b_maps_won,
            date: match.date,
          })).sort((a: Match, b: Match) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending
          setMatches(mappedMatches);
        }

        // Fetch the teams from the matches
        if (response.data.matches) {
          try {
            const teamResponse = await axios.get('/teams'); 
            const teamList = Array.isArray(teamResponse.data)
              ? teamResponse.data.map((team: any) => ({
                  team_id: team.id, // Map id to team_id
                  name: team.name,
                  logo: team.logo || 'https://www.vlr.gg/img/vlr/tmp/vlr.png'
                }))
              : [];
            setMatchTeams(teamList);
          } catch (err) {
            console.error("Error fetching teams:", err);
          }
        }
    

        setPlayer(mappedPlayer);
      } catch (error) {
        console.error("Error fetching player:", error);
      }
    };

    fetchPlayer();
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

  // Function to generate player summary using AI
  const generatePlayerDescription = async () => {
    if (!player) return;
    
    setIsLoading(true);
    
    try {
      // Create a prompt with player information
      const recentMatches = matches.slice(0, 5); // Get up to 5 recent matches
      
      let prompt = `Generate a maximum 80-word description of a VALORANT esports player for ${player.in_game_name} (real name: ${player.real_name}).
      Do not include any indication before or after the description that you are an AI or that you are generating a summary. 
      Only include complete sentences. Do not use bullet points, lists, headers, or any other formatting.
      Do not include any information that is not in the prompt.`;
      
      prompt += ` They are from ${player.country_name} and play the role of ${player.role}.
      
      For additional context, here is some more information about each role to use, but only briefly mention the role in the summary:
      Duelist: Duelists are the ones who take the fight to the enemy and create space for their team. They are often the first to engage in a fight and are set up by their teammates to get kills. Examples: Jett, Reyna, Phoenix, Raze, Yoru.
      Initiator: Initiators are the ones who gather information and create space for their team to move in with utility like drones and flashes. Examples: Sova, Skye, Breach, KAY/O, Fade.
      Controller: Controllers are the ones who place smokes and walls to block vision and control the flow of the game. Examples: Brimstone, Omen, Astra, Viper, Harbor.
      Sentinel: Sentinels are the ones who anchor the site with utility like tripwires or turrets. They are the ones who watch the flanks and hold angles. Examples: Sage, Cypher, Killjoy, Chamber.
      Flex: Flex players are the ones who can play multiple roles. They are the ones who can adapt to any situation and play whatever role is needed. Examples: Omen, Astra, Viper, Killjoy, Cypher.
      `;
      
      if (team) {
        prompt += ` They currently play for ${team.name}.`;
      } else {
        prompt += ` They are currently not affiliated with any team.`;
      }
      
      if (recentMatches.length > 0) {
        prompt += ` Their recent match history includes: `;
        recentMatches.forEach((match, index) => {
          const teamA = getTeamName(match.team_a_id);
          const teamB = getTeamName(match.team_b_id);
          const score = `${match.team_a_maps_won}-${match.team_b_maps_won}`;
          const winner = getWinningTeam(match);
          
          prompt += `${teamA} vs ${teamB} (${score}, winner: ${winner})`;
          if (index < recentMatches.length - 1) prompt += `, `;
        });
      }
      
      prompt += ` Format the summary as a player profile that would appear on an esports website.`;
      
      // Call the AI endpoint
      const response = await axios.get('/api/ai-response', {
        params: { prompt }
      });
      
      // Extract the AI-generated text from the response
      const aiText = response.data
      setAiDescription(aiText);
    } catch (err) {
      console.error("Error generating AI description:", err);
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* AI Description Section */}
      <Box>
        <Button 
            variant="contained" 
            color="primary" 
            onClick={generatePlayerDescription}
            disabled={isLoading}
            sx={{ mt: 2, width: 'fit-content' }}
          >
            {isLoading ? "Loading..." : 'Generate AI Description'}
        </Button> 

        {/* Display AI-generated description */}
        {aiDescription && (
          <Box sx={{ 
            padding: 2, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 2,
            mt: 2,
            mb: 2,
            mx: 2,
            boxShadow: 1
          }}>
            <Typography variant="h6" gutterBottom>Player Profile</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {aiDescription}
            </Typography>
          </Box>
        )}
      </Box>


      <Box sx={{ mt: 4}}>
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
    </Box>

  );
}

export default PlayerPage;