const express = require('express')
const bodyParser = require('body-parser')
const mineflayer = require('mineflayer')
const { logInfo, logError } = require('./logger')

const skills = require('./lib/skillLoader')
const { initCounter } = require('./lib/utils')
const obs = require('./lib/observation/base')
const OnChat = require('./lib/observation/onChat')
const OnError = require('./lib/observation/onError')
const { Voxels, BlockRecords } = require('./lib/observation/voxels')
const Status = require('./lib/observation/status')
const Inventory = require('./lib/observation/inventory')
const OnSave = require('./lib/observation/onSave')
const Chests = require('./lib/observation/chests')

// Replace single bot variable with a map of bots
const bots = new Map()

const app = express()

app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))

app.post('/start', (req, res) => {
    const botId = req.body.bot_name
    logInfo(`Received start request for bot ${botId}`)

    if (bots.has(botId)) {
        logInfo(`Bot ${botId} already exists, restarting...`)
        onDisconnect(botId, 'Restarting bot')
    }

    logInfo(`Creating bot ${botId} with config:`, req.body)
    const bot = mineflayer.createBot({
        host: 'localhost',
        port: req.body.port,
        username: botId,
        disableChatSigning: true,
        checkTimeoutInterval: 60 * 60 * 1000,
    })

    bots.set(botId, bot)
    logInfo(`Bot ${botId} created and added to bots map`)

    // Event subscriptions
    bot.waitTicks = req.body.waitTicks
    bot.globalTickCounter = 0
    bot.stuckTickCounter = 0
    bot.stuckPosList = []
    bot.iron_pickaxe = false

    // 이벤트 리스너 추가
    bot.on('login', () => {
        logInfo(`Bot ${botId} logged in`)
    })

    bot.on('spawn', () => {
        logInfo(`Bot ${botId} spawned`)
    })

    bot.on('death', () => {
        logInfo(`Bot ${botId} died`)
    })

    bot.on('kicked', (reason) => {
        logError(`Bot ${botId} was kicked. Reason:`, reason)
        onDisconnect(botId, 'Bot was kicked')
    })

    bot.on('end', () => {
        logInfo(`Bot ${botId} connection ended`)
        onDisconnect(botId, 'Bot ended')
    })

    bot.on('error', (err) => {
        logError(`Bot ${botId} encountered an error: ${err}`, err)
    })

    // mounting will cause physicsTick to stop
    bot.on('mount', () => {
        bot.dismount()
    })

    bot.once('spawn', async () => {
        try {
            logInfo(`Starting initialization for bot ${botId}`)
            bot.removeListener('error', (err) =>
                onConnectionFailed(botId, err, res)
            )

            // 먼저 플러그인들을 로드
            logInfo(`Loading plugins for bot ${botId}`)
            const { pathfinder } = require('mineflayer-pathfinder')
            const minecraftHawkEye = require('minecrafthawkeye')

            try {
                bot.loadPlugin(pathfinder)
                bot.loadPlugin(require('mineflayer-tool').plugin)
                bot.loadPlugin(require('mineflayer-collectblock').plugin)
                bot.loadPlugin(require('mineflayer-pvp').plugin)

                // minecraftHawkEye 플러그인 로딩 방식 수정
                if (typeof minecraftHawkEye === 'function') {
                    bot.loadPlugin(minecraftHawkEye)
                } else if (minecraftHawkEye.default) {
                    bot.loadPlugin(minecraftHawkEye.default)
                } else {
                    logError(`Invalid minecraftHawkEye plugin format for bot ${botId}`)
                }

                logInfo(`Plugins loaded successfully for bot ${botId}`)
            } catch (err) {
                logError(`Plugin loading error for bot ${botId}: ${err.message}`)
                throw err
            }

            // 기본 게임룰 설정
            logInfo(`Setting game rules for bot ${botId}`)
            await bot.waitForTicks(bot.waitTicks)
            await bot.waitForTicks(bot.waitTicks)

            if (req.body.reset === 'hard') {
                logInfo(`Performing hard reset for bot ${botId}`)
                bot.chat('/clear @s')
                await bot.waitForTicks(bot.waitTicks)

                const inventory = req.body.inventory ? req.body.inventory : {}
                const equipment = req.body.equipment
                    ? req.body.equipment
                    : [null, null, null, null, null, null]

                for (let key in inventory) {
                    bot.chat(`/give @s minecraft:${key} ${inventory[key]}`)
                    await bot.waitForTicks(bot.waitTicks)
                }

                const equipmentNames = [
                    'armor.head',
                    'armor.chest',
                    'armor.legs',
                    'armor.feet',
                    'weapon.mainhand',
                    'weapon.offhand',
                ]
                for (let i = 0; i < 6; i++) {
                    if (i === 4) continue
                    if (equipment[i]) {
                        bot.chat(
                            `/item replace entity @s ${equipmentNames[i]} with minecraft:${equipment[i]}`
                        )
                        await bot.waitForTicks(bot.waitTicks)
                    }
                }
            }

            // iron_pickaxe 체크
            if (
                bot.inventory
                    .items()
                    .find((item) => item.name === 'iron_pickaxe')
            ) {
                bot.iron_pickaxe = true
            }

            // 관찰 시스템 초기화
            logInfo(`Initializing observation system for bot ${botId}`)
            obs.inject(bot, [
                OnChat,
                OnError,
                Voxels,
                Status,
                Inventory,
                OnSave,
                Chests,
                BlockRecords,
            ])
            skills.inject(bot)

            initCounter(bot)

            logInfo(`Bot ${botId} initialization completed successfully`)
            res.json(bot.observe())
        } catch (err) {
            logError(`Error during bot ${botId} initialization: ${err}`)
            onDisconnect(botId, 'Initialization error')
            res.status(500).json({ error: err.message })
        }
    })

    function onConnectionFailed(botId, e, res) {
        logError(`Connection failed for bot ${botId}:`, e)
        bots.delete(botId)
        res.status(400).json({ error: e })
    }
    function onDisconnect(botId, message) {
        const bot = bots.get(botId)
        if (bot) {
            logInfo(`Disconnecting bot ${botId}: ${message}`)
            // 모든 이벤트 리스너 제거
            bot.removeAllListeners('kicked')
            bot.removeAllListeners('mount')
            bot.removeAllListeners('physicsTick')
            bot.removeAllListeners('chatEvent')
            bot.removeAllListeners('error')

            if (bot.viewer) {
                bot.viewer.close()
            }
            bot.end()
            console.log(`Bot ${botId}: ${message}`)
            bots.delete(botId)
            logInfo(`Bot ${botId} cleanup completed`)
        }
    }
})

app.post('/step', async (req, res) => {
    const botId = req.body.bot_name
    logInfo(`Received step request for bot ${botId}`)

    // Add request timeout handling
    res.setTimeout(120000, () => {
        if (!response_sent) {
            response_sent = true
            logError(`Request timeout for bot ${botId}`)
            res.status(504).json({ error: 'Request timeout' })
        }
    })

    const bot = bots.get(botId)
    let response_sent = false
    let mcData

    if (!bot) {
        logError(`Bot ${botId} not found for step request`)
        return res.status(404).json({ error: `Step: Bot ${botId} not found` })
    }

    // Add error handler for unexpected disconnections
    const connectionErrorHandler = (err) => {
        if (!response_sent) {
            response_sent = true
            logError(`Connection error for bot ${botId}:`, err)
            res.status(500).json({ error: 'Connection error', details: err.message })
        }
        cleanup()
    }

    const cleanup = () => {
        bot.removeListener('end', connectionErrorHandler)
        bot.removeListener('error', connectionErrorHandler)
    }

    bot.on('end', connectionErrorHandler)
    bot.on('error', connectionErrorHandler)

    try {
        mcData = require('minecraft-data')(bot.version)
        mcData.itemsByName['leather_cap'] = mcData.itemsByName['leather_helmet']
        mcData.itemsByName['leather_tunic'] =
            mcData.itemsByName['leather_chestplate']
        mcData.itemsByName['leather_pants'] =
            mcData.itemsByName['leather_leggings']
        mcData.itemsByName['lapis_lazuli_ore'] = mcData.itemsByName['lapis_ore']
        mcData.blocksByName['lapis_lazuli_ore'] =
            mcData.blocksByName['lapis_ore']

        const { Movements } = require('mineflayer-pathfinder')

        // Set up pathfinder with bot-specific movements
        const movements = new Movements(bot, mcData)
        bot.pathfinder.setMovements(movements)

        bot.globalTickCounter = 0
        bot.stuckTickCounter = 0
        bot.stuckPosList = []

        function onTick() {
            bot.globalTickCounter++
            if (bot.pathfinder.isMoving()) {
                bot.stuckTickCounter++
                if (bot.stuckTickCounter >= 100) {
                    onStuck(1.5)
                    bot.stuckTickCounter = 0
                }
            }
        }

        bot.on('physicsTick', onTick)

        // Retrieve array form post body
        const code = req.body.code || ''
        const programs = req.body.programs || ''
        bot.cumulativeObs = []

        await bot.waitForTicks(bot.waitTicks)
        const r = await evaluateCode(code, programs)

        if (r !== 'success') {
            bot.emit('error', handleError(r))
        }

        await returnItems()
        await bot.waitForTicks(bot.waitTicks)

        if (!response_sent) {
            response_sent = true
            res.json(bot.observe())
        }

        cleanup()
        bot.removeListener('physicsTick', onTick)
    } catch (err) {
        if (!response_sent) {
            response_sent = true
            logError(`Error in step for bot ${botId}:`, err)
            res.status(500).json({ error: err.message })
        }
        cleanup()
    }

    async function returnItems() {
        if (!mcData) return
        bot.chat('/gamerule doTileDrops false')
        const crafting_table = bot.findBlock({
            matching: mcData.blocksByName.crafting_table.id,
            maxDistance: 128,
        })
        if (crafting_table) {
            bot.chat(
                `/setblock ${crafting_table.position.x} ${crafting_table.position.y} ${crafting_table.position.z} air destroy`
            )
            bot.chat('/give @s crafting_table')
        }
        const furnace = bot.findBlock({
            matching: mcData.blocksByName.furnace.id,
            maxDistance: 128,
        })
        if (furnace) {
            bot.chat(
                `/setblock ${furnace.position.x} ${furnace.position.y} ${furnace.position.z} air destroy`
            )
            bot.chat('/give @s furnace')
        }
        if (bot.inventoryUsed() >= 32) {
            // if chest is not in bot's inventory
            if (!bot.inventory.items().find((item) => item.name === 'chest')) {
                bot.chat('/give @s chest')
            }
        }
        // if iron_pickaxe not in bot's inventory and bot.iron_pickaxe
        if (
            bot.iron_pickaxe &&
            !bot.inventory.items().find((item) => item.name === 'iron_pickaxe')
        ) {
            bot.chat('/give @s iron_pickaxe')
        }
        bot.chat('/gamerule doTileDrops true')
    }

    async function evaluateCode(code, programs) {
        if (!code || !programs) return 'success'
        try {
            await eval('(async () => {' + programs + '\n' + code + '})()')
            return 'success'
        } catch (err) {
            return err
        }
    }

    function onStuck(posThreshold) {
        const currentPos = bot.entity.position
        bot.stuckPosList.push(currentPos)

        // Check if the list is full
        if (bot.stuckPosList.length === 5) {
            const oldestPos = bot.stuckPosList[0]
            const posDifference = currentPos.distanceTo(oldestPos)

            if (posDifference < posThreshold) {
                teleportBot() // execute the function
            }

            // Remove the oldest time from the list
            bot.stuckPosList.shift()
        }
    }

    function teleportBot() {
        const blocks = bot.findBlocks({
            matching: (block) => {
                return block.type === 0
            },
            maxDistance: 1,
            count: 27,
        })

        if (blocks) {
            // console.log(blocks.length);
            const randomIndex = Math.floor(Math.random() * blocks.length)
            const block = blocks[randomIndex]
            bot.chat(`/tp @s ${block.x} ${block.y} ${block.z}`)
        } else {
            bot.chat('/tp @s ~ ~1.25 ~')
        }
    }
})

app.post('/stop', (req, res) => {
    const botId = req.body.bot_name
    const bot = bots.get(botId)

    if (bot) {
        bot.end()
        bots.delete(botId)
    }

    res.json({
        message: `Bot ${botId} stopped`,
    })
})

app.post('/pause', (req, res) => {
    const botId = req.body.bot_name
    const bot = bots.get(botId)

    if (!bot) {
        res.status(400).json({ error: `Pause: Bot ${botId} not found` })
        return
    }

    bot.chat('/pause')
    bot.waitForTicks(bot.waitTicks).then(() => {
        res.json({ message: 'Success' })
    })
})

// Server listening to PORT 3000

const DEFAULT_PORT = 3000
const PORT = process.argv[2] || DEFAULT_PORT

const server = app
    .listen(PORT)
    .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            logError(
                `Port ${PORT} is already in use. Please use a different port.`
            )
            process.exit(1)
        } else {
            logError('Server error:', err)
            process.exit(1)
        }
    })
    .on('listening', () => {
        logInfo(`Server started on port ${PORT}`)
    })

// 프로세스 종료 시 서버 정리
process.on('SIGTERM', () => {
    server.close(() => {
        logInfo('Server terminated')
        process.exit(0)
    })
})
