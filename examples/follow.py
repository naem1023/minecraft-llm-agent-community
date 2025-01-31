from javascript import On, require


mineflayer = require("mineflayer")
pathfinder = require("mineflayer-pathfinder").pathfinder
Movements = require("mineflayer-pathfinder").Movements
goals = require("mineflayer-pathfinder")

bot = mineflayer.createBot(
    {"host": "localhost", "port": 25565, "username": "follow_bot", "hideErrors": False}
)
bot.loadPlugin(pathfinder)
mcData = require("minecraft-data")(bot.version)
name = "relilau"


@On(bot, "spawn")
def followPlayer(bot):
    player = bot.players[name]
    if not player:
        bot.chat(f"I don't see {name}!")
        print("can't find player")
        return

    # Set movements
    movements = Movements(bot, mcData)
    bot.pathfinder.setMovements(movements)

    # Follow the player
    goal = goals["goals"].GoalFollow(player.entity, 1)
    bot.pathfinder.setGoal(goal, True)
