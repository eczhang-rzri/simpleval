const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

//Connect to PostgreSQL database
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

//Define team model
const Teams = sequelize.define('teams', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  team_code: {
    type: Sequelize.STRING,
    allowNull: false
  },
  logo: {
    type: Sequelize.STRING,
    allowNull: true
  },
  region: {
    type: Sequelize.STRING,
    allowNull: false
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false
  }
}, {
  tableName: 'teams',
  timestamps: false
});

//GET all teams
app.get('/teams', async (req, res) => {
  try {
    const teams = await Teams.findAll();
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//GET team by id
app.get('/teams/:id', async (req, res) => {
  try {
    const team = await Teams.findByPk(req.params.id);
    if (team) {
      res.json(team);
    } else {
      res.status(404).json({ error: 'Team not found' });
    }
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//POST new team
app.post('/teams', async (req, res) => {
  try {
    const { name, team_code, logo, region, status } = req.body;
    const newTeam = await Teams.create({ name, team_code, logo, region, status });
    res.status(201).json(newTeam);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//PUT update team by id
app.put('/teams/:id', async (req, res) => {
  try {
    const { name, team_code, logo, region, status } = req.body;
    const [updated] = await Teams.update({ name, team_code, logo, region, status }, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedTeam = await Teams.findByPk(req.params.id);
      res.json(updatedTeam);
    } else {
      res.status(404).json({ error: 'Team not found' });
    }
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//DELETE team by id
app.delete('/teams/:id', async (req, res) => {
  try {
    const deleted = await Teams.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.status(204).send(); // No content response on successful delete
    } else {
      res.status(404).json({ error: 'Team not found' });
    }
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//Define player model
const Players = sequelize.define('players', {
  in_game_name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  real_name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.STRING,
    allowNull: true
  },
  country_name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  country_flag_code: {
    type: Sequelize.STRING,
    allowNull: false
  },
  profile_picture: {
    type: Sequelize.STRING,
    allowNull: true
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false
  },
  team_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Teams,
      key: 'id'
    }
  }
}, {
  tableName: 'players',
  timestamps: false
});

//GET all players
app.get('/players', async (req, res) => {
  try {
    
    const {team_id} = req.query; //can query for team_id to get players from a specific team
    if (team_id) { //if provided, get players from a team
      const team_players = await Players.findAll({ where: { team_id } });
      return res.json(team_players);
    }
    
    //else get all players
    const all_players = await Players.findAll();
    res.json(all_players);

  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//GET player by id with match data
app.get('/players/:id', async (req, res) => {
  try {
    const player = await Players.findByPk(req.params.id, {
      include: {
        model: Matches
      }
    });

    if (player) {
      res.json(player);
    } else {
      res.status(404).json({ error: 'Player not found' });
    }
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//POST new player
app.post('/players', async (req, res) => {
  try {
    const { in_game_name, real_name, role, country_name, country_flag_code, profile_picture, status, team_id } = req.body;
    const team = await Teams.findByPk(team_id);
    const newPlayer = await Players.create({ in_game_name, real_name, role, country_name, country_flag_code, profile_picture, status, team_id });
    res.status(201).json(newPlayer);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//PUT update player by id
app.put('/players/:id', async (req, res) => {
  try {
    const { in_game_name, real_name, role, country_name, country_flag_code, profile_picture, status, team_id } = req.body;
    const [updated] = await Players.update({ in_game_name, real_name, role, country_name, country_flag_code, profile_picture, status, team_id }, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedPlayer = await Players.findByPk(req.params.id);
      res.json(updatedPlayer);
    } else {
      res.status(404).json({ error: 'Player not found' });
    }
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//DELETE player by id
app.delete('/players/:id', async (req, res) => {
  try {
    const deleted = await Players.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Team not found' });
    }
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define match model
const Matches = sequelize.define('matches', {
  team_a_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Teams,
      key: 'id'
    }
  },
  team_b_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Teams,
      key: 'id'
    }
  },
  team_a_maps_won: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  team_b_maps_won: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  date: {
    type: Sequelize.DATE,
    allowNull: false
  },
}, {
  tableName: 'matches',
  timestamps: false
});

//GET all matches
app.get('/matches', async (req, res) => {
  try {
    const matches = await Matches.findAll();
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//GET match by id with player data
app.get('/matches/:id', async (req, res) => {
  try {
    const match = await Matches.findByPk(req.params.id, {
      include: {
        model: Players
      }
    });

    if (match) {
      res.json(match);
    } else {
      res.status(404).json({ error: 'Match not found' });
    }
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//POST new match
app.post('/matches', async (req, res) => {
  try {
    const { team_a_id, team_b_id, team_a_maps_won, team_b_maps_won, date } = req.body;
    const newMatch = await Matches.create({ team_a_id, team_b_id, team_a_maps_won, team_b_maps_won, date });
    res.status(201).json(newMatch);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//PUT update match by id
app.put('/matches/:id', async (req, res) => {
  try {
    const { team_a_id, team_b_id, team_a_maps_won, team_b_maps_won, date } = req.body;
    const [updated] = await Matches.update({ team_a_id, team_b_id, team_a_maps_won, team_b_maps_won, date }, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedMatch = await Matches.findByPk(req.params.id);
      res.json(updatedMatch);
    } else {
      res.status(404).json({ error: 'Match not found' });
    }
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//DELETE match by id
app.delete('/matches/:id', async (req, res) => {
  try {
    const deleted = await Matches.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      res.status(204).send(); // No content response on successful delete
    } else {
      res.status(404).json({ error: 'Match not found' });
    }
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Define match-player model
const MatchPlayers = sequelize.define('match_players', {
  match_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Matches,
      key: 'id'
    }
  },
  player_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Players,
      key: 'id'
    }
  },
}, {
  tableName: 'match_players',
  timestamps: false
});
Players.belongsToMany(Matches, { through: MatchPlayers, foreignKey: 'player_id', otherKey: 'match_id' }); //define many-to-many relationship
Matches.belongsToMany(Players, { through: MatchPlayers, foreignKey: 'match_id', otherKey: 'player_id' });

// GET match-player by ids (not sure if needed)
app.get('/match_players/:matchId/:playerId', async (req, res) => {
  try {
    const entry = await MatchPlayers.findOne({
      where: {
        match_id: req.params.matchId,
        player_id: req.params.playerId
      }
    });

    if (entry) {
      res.json(entry);
    } else {
      res.status(404).json({ error: 'Entry not found' });
    }
  } catch (error) {
    console.error('Error fetching match-player entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// POST new match-player (add player to match)
app.post('/match_players', async (req, res) => {
  try {
    const { match_id, player_id } = req.body;

    // check if match and player exist
    const match = await Matches.findByPk(match_id);
    const player = await Players.findByPk(player_id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // check if already exists
    const existingMatchPlayer = await MatchPlayers.findOne({ where: { match_id: match_id, player_id: player_id }});
    if (existingMatchPlayer) {
      return res.status(400).json({ error: 'Player already exists in this match' });
    }

    const newMatchPlayer = await MatchPlayers.create({ match_id, player_id });
    res.status(201).json(newMatchPlayer);
  } catch (error) {
    console.error('Error assigning player to match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

// no PUT method for match-player - out of scope for this project

// DELETE all players from match by match id
app.delete('/match_players/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const deleted = await MatchPlayers.destroy({
      where: { match_id: matchId }
    });

    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Entry not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

// DELETE match-player by id (remove specific player from match)
app.delete('/match_players/:matchId/:playerId', async (req, res) => {
  try {
    const { matchId, playerId } = req.params;
    const deleted = await MatchPlayers.destroy({
      where: { match_id: matchId, player_id: playerId }
    });

    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Entry not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//GET / for testing
app.get('/', (req, res) => {
  res.send('SimpleVAL API');
});

// Test the database connection
sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Unable to connect to the database:', err));

//Listen for running server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});