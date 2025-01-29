const { ChatOpenAI, OpenAIEmbeddings } = require("@langchain/openai");
const { ChromaClient } = require('chromadb');
const fs = require('fs');
const path = require('path');

class CurriculumAgent {
  constructor(options = {}) {
    this.openai = new ChatOpenAI({
      modelName: "gpt-4o-mini",
    });
    this.qaOpenai = new ChatOpenAI({
      modelName: "gpt-4o-mini",
    });
    
    this.mode = options.mode || 'auto';
    this.ckptDir = options.ckptDir || 'ckpt';
    
    // Create checkpoint directories
    if (!fs.existsSync(`${this.ckptDir}/curriculum`)) {
      fs.mkdirSync(`${this.ckptDir}/curriculum`, { recursive: true });
      fs.mkdirSync(`${this.ckptDir}/curriculum/vectordb`, { recursive: true });
    }

    // Initialize state
    this.completedTasks = [];
    this.failedTasks = [];
    this.qaCache = {};
    this.currentTask = null;

    // Load from checkpoint if resuming
    if (options.resume) {
      console.log(`Loading Curriculum Agent from ${this.ckptDir}/curriculum`);
      this.loadProgress();
    }

    // Initialize vectordb for qa cache
    this.embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small"
    });
    
    this.qaCacheQuestionsVectordb = new ChromaClient({
      path: `${this.ckptDir}/curriculum/vectordb`,
      collectionName: "qa_cache_questions_vectordb",
      embeddingFunction: this.embeddings
    });

    // Warm up settings
    this.warmUp = this.initializeWarmUp(options.warmUp, options.coreInventoryItems);
  }

  initializeWarmUp(warmUp, coreInventoryItems) {
    const defaultWarmup = {
      context: 15,
      biome: 10,
      time: 15,
      nearby_blocks: 0,
      other_blocks: 10,
      nearby_entities: 5,
      health: 15,
      hunger: 15,
      position: 0,
      equipment: 0,
      inventory: 0,
      optional_inventory_items: 7,
      chests: 0,
      completed_tasks: 0,
      failed_tasks: 0
    };

    const warmUpSettings = {};
    
    if (warmUp?.optional_inventory_items) {
      this.coreInvItemsRegex = new RegExp(coreInventoryItems);
      warmUpSettings.optional_inventory_items = warmUp.optional_inventory_items;
    } else {
      warmUpSettings.optional_inventory_items = 0;
    }

    // Initialize all curriculum observations
    for (const key of this.curriculumObservations) {
      warmUpSettings[key] = warmUp?.[key] ?? defaultWarmup[key];
    }

    warmUpSettings.nearby_blocks = 0;
    warmUpSettings.inventory = 0;
    warmUpSettings.completed_tasks = 0;
    warmUpSettings.failed_tasks = 0;

    return warmUpSettings;
  }

  get curriculumObservations() {
    return [
      'context',
      'biome',
      'time',
      'nearby_blocks',
      'other_blocks',
      'nearby_entities',
      'health',
      'hunger',
      'position',
      'equipment',
      'inventory',
      'chests',
      'completed_tasks',
      'failed_tasks'
    ];
  }

  loadProgress() {
    try {
      this.completedTasks = JSON.parse(
        fs.readFileSync(`${this.ckptDir}/curriculum/completed_tasks.json`)
      );
      this.failedTasks = JSON.parse(
        fs.readFileSync(`${this.ckptDir}/curriculum/failed_tasks.json`)
      );
      this.qaCache = JSON.parse(
        fs.readFileSync(`${this.ckptDir}/curriculum/qa_cache.json`)
      );
    } catch (error) {
      console.log('No checkpoint found or error loading checkpoint');
    }
  }

  async proposeNextTask(events = []) {
    // First task is always the same
    if (this.completedTasks.length === 0) {
      return {
        task: "Mine 1 wood log",
        context: "You can mine one of oak, birch, spruce, jungle, acacia, dark oak, or mangrove logs."
      };
    }

    // Check inventory usage for chest-related tasks
    const lastEvent = events[events.length - 1];
    if (lastEvent && lastEvent[0] === 'observe') {
      const inventoryUsed = lastEvent[1].status.inventoryUsed;
      if (inventoryUsed >= 33) {
        // Handle chest placement/creation logic
        return this.handleInventoryFull(lastEvent[1]);
      }
    }

    // Generate next task using LLM
    const observation = this.renderObservation(events);
    const messages = [
      this.renderSystemMessage(),
      {
        role: "user",
        content: observation
      }
    ];

    const response = await this.openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages
    });

    const task = this.parseAiMessage(response.data.choices[0].message.content);
    this.currentTask = task;
    return task;
  }

  handleInventoryFull(observation) {
    const chestObservation = observation.chestObservation || "Chests: None\n\n";
    if (chestObservation !== "Chests: None\n\n") {
      const chests = chestObservation.split('\n');
      for (const chest of chests) {
        const [position, content] = chest.split(':');
        if (content.trim() === "Unknown items inside" || content.trim() === "Empty") {
          return {
            task: `Deposit useless items into the chest at ${position}`,
            context: `Your inventory has ${observation.status.inventoryUsed} occupied slots before depositing. ` +
                    `After depositing, your inventory should only have 20 occupied slots. ` +
                    `You should deposit useless items such as andesite, dirt, cobblestone, etc. ` +
                    `Also, you can deposit low-level tools. ` +
                    `Make sure the list of useless items are in your inventory. ` +
                    `You can use bot.inventoryUsed() to check how many inventory slots are used.`
          };
        }
      }
    }

    if (observation.inventory.chest) {
      return {
        task: "Place a chest",
        context: "You have a chest in inventory, place it around you. " +
                "If chests is not None, or nearby blocks contains chest, this task is success."
      };
    }

    return {
      task: "Craft 1 chest",
      context: "Craft 1 chest with 8 planks of any kind of wood."
    };
  }

  renderObservation(events) {
    let observation = '';
    const lastEvent = events[events.length - 1];
    
    if (lastEvent && lastEvent[0] === 'observe') {
      const status = lastEvent[1].status;
      const voxels = lastEvent[1].voxels;
      const blockRecords = lastEvent[1].blockRecords;
      const inventory = lastEvent[1].inventory;

      // Add observations based on warm-up progress
      for (const key of this.curriculumObservations) {
        if (this.completedTasks.length >= this.warmUp[key]) {
          if (this.warmUp[key] !== 0) {
            const shouldInclude = Math.random() < 0.8;
            if (shouldInclude) {
              observation += this.renderObservationByKey(key, {
                status,
                voxels,
                blockRecords,
                inventory
              });
            }
          } else {
            observation += this.renderObservationByKey(key, {
              status,
              voxels,
              blockRecords,
              inventory
            });
          }
        }
      }
    }

    return observation;
  }

  renderObservationByKey(key, data) {
    const { status, voxels, blockRecords, inventory } = data;
    
    switch (key) {
      case 'biome':
        return `Biome: ${status.biome}\n\n`;
      case 'time':
        return `Time: ${status.timeOfDay}\n\n`;
      case 'nearby_blocks':
        return `Nearby blocks: ${voxels.join(', ') || 'None'}\n\n`;
      case 'other_blocks':
        const otherBlocks = Array.from(
          new Set(blockRecords).difference(new Set([...voxels, ...Object.keys(inventory)]))
        );
        return `Other blocks that are recently seen: ${otherBlocks.length ? otherBlocks.join(', ') : 'None'}\n\n`;
      // Add other cases as needed
      default:
        return '';
    }
  }

  async updateExplorationProgress(info) {
    const { task, success } = info;
    
    if (task.startsWith('Deposit useless items into the chest at')) {
      return; // Skip recording deposit tasks
    }

    if (success) {
      console.log(`Completed task ${task}.`);
      this.completedTasks.push(task);
    } else {
      console.log(`Failed to complete task ${task}. Skipping to next task.`);
      this.failedTasks.push(task);
    }

    this.cleanUpTasks();
  }

  cleanUpTasks() {
    // Deduplicate completed tasks while maintaining order
    const updatedCompletedTasks = [];
    const updatedFailedTasks = [...this.failedTasks];

    for (const task of this.completedTasks) {
      if (!updatedCompletedTasks.includes(task)) {
        updatedCompletedTasks.push(task);
      }
    }

    // Remove completed tasks from failed tasks
    for (const task of updatedCompletedTasks) {
      const index = updatedFailedTasks.indexOf(task);
      if (index !== -1) {
        updatedFailedTasks.splice(index, 1);
      }
    }

    this.completedTasks = updatedCompletedTasks;
    this.failedTasks = updatedFailedTasks;

    // Save to checkpoint
    fs.writeFileSync(
      `${this.ckptDir}/curriculum/completed_tasks.json`,
      JSON.stringify(this.completedTasks)
    );
    fs.writeFileSync(
      `${this.ckptDir}/curriculum/failed_tasks.json`,
      JSON.stringify(this.failedTasks)
    );
  }

  getCurrentTask() {
    return this.currentTask;
  }

  getCompletedTasks() {
    return this.completedTasks;
  }

  getFailedTasks() {
    return this.failedTasks;
  }
}

module.exports = { CurriculumAgent };