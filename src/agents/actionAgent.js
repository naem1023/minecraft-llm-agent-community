const fs = require('fs');
const path = require('path');
const { ChatOpenAI } = require("@langchain/openai");

class ActionAgent {
  constructor(options = {}) {
    this.ckptDir = options.ckptDir || 'ckpt';
    this.chatLog = options.chatLog ?? true;
    this.executionError = options.executionError ?? true;
    
    // Initialize OpenAI
    this.openai = new ChatOpenAI({
      modelName: "gpt-4o-mini",
    });
    
    this.chestMemory = {};
    
    // Load checkpoint if resuming
    if (options.resume) {
      console.log(`Loading Action Agent from ${this.ckptDir}/action`);
      this.loadCheckpoint();
    }

    // Create checkpoint directory
    if (!fs.existsSync(`${this.ckptDir}/action`)) {
      fs.mkdirSync(`${this.ckptDir}/action`, { recursive: true });
    }
  }

  loadCheckpoint() {
    try {
      this.chestMemory = JSON.parse(
        fs.readFileSync(`${this.ckptDir}/action/chest_memory.json`)
      );
    } catch (error) {
      console.log('No checkpoint found, starting fresh');
      this.chestMemory = {};
    }
  }

  updateChestMemory(chests) {
    for (const [position, chest] of Object.entries(chests)) {
      if (position in this.chestMemory) {
        if (typeof chest === 'object') {
          this.chestMemory[position] = chest;
        }
        if (chest === 'Invalid') {
          console.log(`Action Agent removing chest ${position}: ${chest}`);
          delete this.chestMemory[position];
        }
      } else {
        if (chest !== 'Invalid') {
          console.log(`Action Agent saving chest ${position}: ${chest}`);
          this.chestMemory[position] = chest;
        }
      }
    }
    fs.writeFileSync(
      `${this.ckptDir}/action/chest_memory.json`,
      JSON.stringify(this.chestMemory)
    );
  }

  renderChestObservation() {
    const chests = [];
    for (const [chestPosition, chest] of Object.entries(this.chestMemory)) {
      if (typeof chest === 'object' && Object.keys(chest).length > 0) {
        chests.push(`${chestPosition}: ${JSON.stringify(chest)}`);
      }
      if (typeof chest === 'object' && Object.keys(chest).length === 0) {
        chests.push(`${chestPosition}: Empty`);
      }
      if (typeof chest === 'string') {
        if (chest === 'Unknown') {
          chests.push(`${chestPosition}: Unknown items inside`);
        }
      }
    }
    
    if (chests.length > 0) {
      return `Chests:\n${chests.join('\n')}\n\n`;
    }
    return 'Chests: None\n\n';
  }

  async executeTask(task, context = '', events = []) {
    try {
      const observation = this.constructObservation(events, task, context);
      const systemMessage = await this.renderSystemMessage();
      
      const response = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          systemMessage,
          {
            role: "user",
            content: observation
          }
        ]
      });

      const plan = this.processAiMessage(response.data.choices[0].message);
      if (typeof plan === 'string') {
        throw new Error(plan); // Error message from processAiMessage
      }

      // Execute the generated code
      const { program_code, program_name, exec_code } = plan;
      
      // Here you would execute the code using your bot
      // This is a placeholder - actual implementation would depend on your bot setup
      const bot = require('../minecraft/botManager').getBot();
      await eval(`
        ${program_code}
        ${exec_code}
      `);

      return true;
    } catch (error) {
      console.error('Error executing task:', error);
      return false;
    }
  }

  constructObservation(events, code = '', task = '', context = '', critique = '') {
    let observation = '';

    if (code) {
      observation += `Code from the last round:\n${code}\n\n`;
    } else {
      observation += 'Code from the last round: No code in the first round\n\n';
    }

    if (this.executionError) {
      const errorMessages = events
        .filter(([type]) => type === 'onError')
        .map(([_, event]) => event.onError);
      
      if (errorMessages.length > 0) {
        observation += `Execution error:\n${errorMessages.join('\n')}\n\n`;
      } else {
        observation += 'Execution error: No error\n\n';
      }
    }

    // Add other observations from events
    const lastEvent = events[events.length - 1];
    if (lastEvent && lastEvent[0] === 'observe') {
      const status = lastEvent[1].status;
      observation += `Biome: ${status.biome}\n\n`;
      observation += `Time: ${status.timeOfDay}\n\n`;
      observation += `Nearby blocks: ${lastEvent[1].voxels.join(', ') || 'None'}\n\n`;
      observation += `Health: ${status.health.toFixed(1)}/20\n\n`;
      observation += `Hunger: ${status.food.toFixed(1)}/20\n\n`;
      observation += `Position: x=${status.position.x.toFixed(1)}, y=${status.position.y.toFixed(1)}, z=${status.position.z.toFixed(1)}\n\n`;
      observation += `Equipment: ${JSON.stringify(status.equipment)}\n\n`;
      observation += `Inventory (${status.inventoryUsed}/36): ${JSON.stringify(lastEvent[1].inventory)}\n\n`;
    }

    if (!task.startsWith('Deposit useless items into the chest at')) {
      observation += this.renderChestObservation();
    }

    observation += `Task: ${task}\n\n`;
    observation += `Context: ${context || 'None'}\n\n`;
    observation += `Critique: ${critique || 'None'}\n\n`;

    return observation;
  }

  async renderSystemMessage(skills = []) {
    // Load your control primitives and prompts here
    // This is a placeholder - you'll need to implement the actual loading logic
    const baseSkills = [
      'exploreUntil',
      'mineBlock', 
      'craftItem',
      'placeItem',
      'smeltItem',
      'killMob'
    ];

    // Combine base skills with additional skills
    const allSkills = [...baseSkills, ...skills];
    
    // Load the actual implementations
    const programs = allSkills.map(skill => {
      try {
        return fs.readFileSync(path.join(__dirname, `../skills/${skill}.js`), 'utf8');
      } catch (error) {
        console.warn(`Could not load skill: ${skill}`);
        return '';
      }
    }).join('\n\n');

    return {
      role: "system",
      content: `You are an AI that controls a Minecraft bot. You can use these functions:\n\n${programs}`
    };
  }

  processAiMessage(message) {
    try {
      const codePattern = /```(?:javascript|js)(.*?)```/s;
      const match = message.content.match(codePattern);
      
      if (!match) {
        return 'No code block found in response';
      }

      const code = match[1].trim();
      
      // Parse the code to find the main async function
      const functionPattern = /async\s+function\s+(\w+)\s*\(\s*bot\s*\)\s*{/;
      const functionMatch = code.match(functionPattern);
      
      if (!functionMatch) {
        return 'No valid async function found';
      }

      const programName = functionMatch[1];
      
      return {
        program_code: code,
        program_name: programName,
        exec_code: `await ${programName}(bot);`
      };
    } catch (error) {
      return `Error parsing action response: ${error.message}`;
    }
  }

  async generateAction(actionContext) {
    // implementation
  }

  updateMemory(event) {
    // implementation
  }

  summarizeLog() {
    // implementation
  }
}

module.exports = { ActionAgent }; 