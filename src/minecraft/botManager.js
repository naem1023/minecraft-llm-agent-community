const mineflayer = require('mineflayer');

let bot = null;

function createBot({ host, port, username }) {
  bot = mineflayer.createBot({
    host: host || 'localhost',
    port: port || 25565,
    username: username || 'LLMAgentBot'
  });

  bot.on('login', () => {
    console.log(`Bot logged in as ${bot.username}`);
  });

  bot.on('error', err => {
    console.error('Bot error:', err);
  });

  bot.on('end', () => {
    console.log('Bot connection ended');
  });
}

function getBot() {
  return bot;
}

module.exports = {
  createBot,
  getBot
}; 