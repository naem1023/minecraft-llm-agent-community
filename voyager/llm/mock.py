mock_responses: list[str] = [
    """Plan:
	1.	Check if the bot already has a wood log in the inventory.
	2.	If not, locate the nearest wood log (oak_log is available nearby).
	3.	Mine one wood log using mineBlock(bot, "oak_log", 1).
	4.	Notify the user about the completion of the task.

Code:
```javascript
async function mineWoodLog(bot) {
    bot.chat("Checking inventory for a wood log...");

    const woodLogs = ["oak_log", "birch_log", "spruce_log", "jungle_log", "acacia_log", "dark_oak_log", "mangrove_log"];
    const inventoryLog = bot.inventory.items().find(item => woodLogs.includes(item.name));

    if (inventoryLog) {
        bot.chat("Already have a wood log in inventory.");
        return;
    }

    bot.chat("Looking for the nearest wood log...");
    const logBlock = bot.findBlock({
        matching: (block) => woodLogs.includes(block.name),
        maxDistance: 32
    });

    if (!logBlock) {
        bot.chat("No wood log found nearby.");
        return;
    }

    bot.chat(`Mining ${logBlock.name}...`);
    await mineBlock(bot, logBlock.name, 1);

    bot.chat("Wood log collected!");
}
```
"""
]
