---
sidebar_position: 1
---

# Architecture of Project
This project should handling real-time parallel multi-agent. 

## Pseudo code of creating a bot
```javascript
// Load agent settings like how many, how much agents to generaet.
bot_settings = load_bot_initialization_setting()

// Prepare each agent bot
// - Load trained skills for each agent, etc..
// - If bot is exist already, load the bot.
// - If bot isn't exist, create new bot.
bots = prepare_bots(bot_settings)

// Create bot and execute
for each bot in bots do
    create_bot(bot)
    execute_bot(bot)
end for
```

## Architecture of executing a bot
