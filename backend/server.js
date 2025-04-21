const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Connect to PostgreSQL database
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

// Define team model
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
  record: {
    type: Sequelize.STRING,
    allowNull: true
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
    const { name, team_code, logo, region, record, status } = req.body;
    const newTeam = await Teams.create({ name, team_code, logo, region, record, status });
    res.status(201).json(newTeam);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//PUT update team by id
app.put('/teams/:id', async (req, res) => {
  try {
    const { name, team_code, logo, region, record, status } = req.body;
    const [updated] = await Teams.update({ name, team_code, logo, region, record, status }, {
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
    const players = await Players.findAll();
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//GET player by id
app.get('/players/:id', async (req, res) => {
  try {
    const team = await Players.findByPk(req.params.id);
    if (team) {
      res.json(team);
    } else {
      res.status(404).json({ error: 'Player not found' });
    }
  } catch (error) {
    console.error('Error fetching team:', error);
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
      res.status(204).send(); // No content response on successful delete
    } else {
      res.status(404).json({ error: 'Team not found' });
    }
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test the database connection
sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Unable to connect to the database:', err));

//Listen for running server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});