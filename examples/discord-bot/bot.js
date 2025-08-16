/**
 * Good Game Pickems Discord Bot Example
 *
 * Commands:
 * !matches - Show upcoming matches
 * !predict <match_id> <team> [score] - Make a prediction
 * !leaderboard - Show top 10 players
 * !mystats - Show your statistics
 */

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js')
const axios = require('axios')

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const API_KEY = process.env.GGWP_API_KEY
const API_BASE_URL = 'https://goodgamepickems.com/api/v1'
const PREFIX = '!'

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
})

// API helper
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
  },
})

// Command handlers
const commands = {
  // Show upcoming matches
  async matches(message) {
    try {
      const { data } = await api.get('/matches', {
        params: { status: 'upcoming', limit: 5 },
      })

      const embed = new EmbedBuilder()
        .setTitle('🎮 Upcoming Matches')
        .setColor('#00ff00')
        .setTimestamp()

      if (data.data.length === 0) {
        embed.setDescription('No upcoming matches found.')
      } else {
        data.data.forEach((match) => {
          const matchDate = new Date(match.match_date)
          const gameEmoji =
            {
              csgo: '🔫',
              lol: '⚔️',
              valorant: '🎯',
            }[match.game_type] || '🎮'

          embed.addFields({
            name: `${gameEmoji} ${match.home_team} vs ${match.away_team}`,
            value: `📅 ${matchDate.toLocaleString()}\n🆔 Match ID: \`${match.id}\``,
            inline: false,
          })
        })
      }

      await message.channel.send({ embeds: [embed] })
    } catch (error) {
      console.error('Error fetching matches:', error)
      await message.reply('❌ Failed to fetch matches. Please try again later.')
    }
  },

  // Make a prediction
  async predict(message, args) {
    if (args.length < 2) {
      return message.reply(
        'Usage: `!predict <match_id> <team> [home_score-away_score]`',
      )
    }

    const [matchId, team, score] = args
    const scores = score ? score.split('-').map(Number) : [null, null]

    try {
      // First, get match details to validate
      const { data: matchData } = await api.get(`/matches/${matchId}`)
      const match = matchData.data

      if (!match) {
        return message.reply('❌ Match not found.')
      }

      // Validate team selection
      const pickedWinner = team.toLowerCase()
      if (
        pickedWinner !== match.home_team.toLowerCase() &&
        pickedWinner !== match.away_team.toLowerCase()
      ) {
        return message.reply(
          `❌ Invalid team. Choose either **${match.home_team}** or **${match.away_team}**.`,
        )
      }

      // Make prediction
      const { data } = await api.post('/predictions', {
        match_id: matchId,
        picked_winner: pickedWinner,
        home_score: scores[0],
        away_score: scores[1],
      })

      const embed = new EmbedBuilder()
        .setTitle('✅ Prediction Submitted!')
        .setColor('#00ff00')
        .addFields(
          {
            name: 'Match',
            value: `${match.home_team} vs ${match.away_team}`,
            inline: true,
          },
          { name: 'Your Pick', value: pickedWinner, inline: true },
        )

      if (scores[0] !== null) {
        embed.addFields({
          name: 'Score Prediction',
          value: `${scores[0]} - ${scores[1]}`,
          inline: true,
        })
      }

      await message.reply({ embeds: [embed] })
    } catch (error) {
      console.error('Error making prediction:', error)
      if (error.response?.status === 403) {
        await message.reply(
          '❌ Your API key needs write permissions to make predictions.',
        )
      } else {
        await message.reply(
          '❌ Failed to submit prediction. The match may have already started.',
        )
      }
    }
  },

  // Show leaderboard
  async leaderboard(message) {
    try {
      const { data } = await api.get('/leaderboard', {
        params: { limit: 10 },
      })

      const embed = new EmbedBuilder()
        .setTitle('🏆 Top 10 Leaderboard')
        .setColor('#ffd700')
        .setTimestamp()

      const leaderboardText = data.data
        .map((user, index) => {
          const medal = ['🥇', '🥈', '🥉'][index] || `**${index + 1}.**`
          return `${medal} ${user.username} - **${user.total_points}** points (${user.accuracy}% accuracy)`
        })
        .join('\n')

      embed.setDescription(leaderboardText || 'No data available.')

      await message.channel.send({ embeds: [embed] })
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      await message.reply('❌ Failed to fetch leaderboard.')
    }
  },

  // Show user statistics
  async mystats(message) {
    // Note: This would require linking Discord users to Good Game Pickems accounts
    // For demo purposes, we'll show a placeholder
    const embed = new EmbedBuilder()
      .setTitle('📊 Your Statistics')
      .setColor('#3498db')
      .setDescription(
        'To link your Good Game Pickems account, visit: https://goodgamepickems.com/settings/discord',
      )
      .addFields({
        name: 'Coming Soon',
        value: 'Discord account linking is under development!',
        inline: false,
      })

    await message.reply({ embeds: [embed] })
  },

  // Help command
  async help(message) {
    const embed = new EmbedBuilder()
      .setTitle('📚 Good Game Pickems Bot Commands')
      .setColor('#9b59b6')
      .addFields(
        { name: '!matches', value: 'Show upcoming matches', inline: false },
        {
          name: '!predict <match_id> <team> [score]',
          value: 'Make a prediction',
          inline: false,
        },
        { name: '!leaderboard', value: 'Show top 10 players', inline: false },
        { name: '!mystats', value: 'Show your statistics', inline: false },
        { name: '!help', value: 'Show this help message', inline: false },
      )
      .setFooter({
        text: 'Good Game Pickems',
        iconURL: 'https://goodgamepickems.com/logo.png',
      })

    await message.channel.send({ embeds: [embed] })
  },
}

// Message handler
client.on('messageCreate', async (message) => {
  // Ignore bot messages and non-command messages
  if (message.author.bot || !message.content.startsWith(PREFIX)) return

  // Parse command and arguments
  const args = message.content.slice(PREFIX.length).trim().split(/ +/)
  const commandName = args.shift().toLowerCase()

  // Execute command if it exists
  const command = commands[commandName]
  if (command) {
    try {
      await command(message, args)
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error)
      await message.reply('❌ An error occurred while executing the command.')
    }
  }
})

// Bot ready event
client.on('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}!`)
  client.user.setActivity('!help | Good Game Pickems', { type: 'WATCHING' })
})

// Error handling
client.on('error', console.error)

// Login to Discord
client.login(DISCORD_TOKEN)
