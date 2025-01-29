const { ChatOpenAI } = require("@langchain/openai");
const readline = require('readline');

class CriticAgent {
  constructor(options = {}) {
    this.openai = new ChatOpenAI({
      modelName: "gpt-4o-mini",
    });
    this.mode = options.mode || 'auto';
  }

  async checkTaskSuccess(events, task, context, chestObservation) {
    const humanMessage = this.renderHumanMessage(events, task, context, chestObservation);
    if (!humanMessage) return [false, ''];

    const messages = [
      this.renderSystemMessage(),
      humanMessage
    ];

    if (this.mode === 'manual') {
      return await this.humanCheckTaskSuccess();
    } else if (this.mode === 'auto') {
      return await this.aiCheckTaskSuccess(messages);
    } else {
      throw new Error(`Invalid critic agent mode: ${this.mode}`);
    }
  }

  renderSystemMessage() {
    return {
      role: "system",
      content: `You are a critic evaluating if a task was successfully completed in Minecraft.
Reply in JSON format:
{
    "success": boolean,
    "critique": string  // Brief explanation of success or failure
}`
    };
  }

  renderHumanMessage(events, task, context, chestObservation) {
    // Verify last event is observe
    if (!events.length || events[events.length - 1][0] !== 'observe') {
      console.error('Last event must be observe');
      return null;
    }

    const lastEvent = events[events.length - 1][1];
    const status = lastEvent.status;

    let observation = '';

    observation += `Biome: ${status.biome}\n\n`;
    observation += `Time: ${status.timeOfDay}\n\n`;

    if (lastEvent.voxels && lastEvent.voxels.length) {
      observation += `Nearby blocks: ${lastEvent.voxels.join(', ')}\n\n`;
    } else {
      observation += 'Nearby blocks: None\n\n';
    }

    observation += `Health: ${status.health.toFixed(1)}/20\n\n`;
    observation += `Hunger: ${status.food.toFixed(1)}/20\n\n`;
    observation += `Position: x=${status.position.x.toFixed(1)}, y=${status.position.y.toFixed(1)}, z=${status.position.z.toFixed(1)}\n\n`;
    observation += `Equipment: ${JSON.stringify(status.equipment)}\n\n`;

    if (lastEvent.inventory) {
      observation += `Inventory (${status.inventoryUsed}/36): ${JSON.stringify(lastEvent.inventory)}\n\n`;
    } else {
      observation += `Inventory (${status.inventoryUsed}/36): Empty\n\n`;
    }

    observation += chestObservation;
    observation += `Task: ${task}\n\n`;
    observation += `Context: ${context || 'None'}\n\n`;

    return {
      role: "user",
      content: observation
    };
  }

  async humanCheckTaskSuccess() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query) => new Promise((resolve) => rl.question(query, resolve));

    let confirmed = false;
    let success = false;
    let critique = '';

    while (!confirmed) {
      success = (await question('Success? (y/n) ')).toLowerCase() === 'y';
      critique = await question('Enter your critique: ');
      console.log(`Success: ${success}\nCritique: ${critique}`);
      confirmed = (await question('Confirm? (y/n) ')).toLowerCase() === 'y';
    }

    rl.close();
    return [success, critique];
  }

  async aiCheckTaskSuccess(messages, maxRetries = 5) {
    if (maxRetries === 0) {
      console.error('Failed to parse Critic Agent response. Consider updating your prompt.');
      return [false, ''];
    }

    if (!messages[1]) {
      return [false, ''];
    }

    try {
      const response = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages
      });

      const critic = response.data.choices[0].message.content;
      console.log(`Critic Agent AI message:\n${critic}`);

      // Parse JSON response
      const result = JSON.parse(critic);
      
      if (typeof result.success !== 'boolean') {
        throw new Error('Success must be boolean');
      }

      return [result.success, result.critique || ''];
    } catch (error) {
      console.error(`Error parsing critic response: ${error}. Trying again!`);
      return await this.aiCheckTaskSuccess(messages, maxRetries - 1);
    }
  }

  summarizeChatlog(events) {
    const chatlog = new Set();

    const filterItem = (message) => {
      const craftPattern = /I cannot make \w+ because I need: (.*)/;
      const craftPattern2 = /I cannot make \w+ because there is no crafting table nearby/;
      const minePattern = /I need at least a (.*) to mine \w+!/;

      const craftMatch = message.match(craftPattern);
      if (craftMatch) return craftMatch[1];

      if (craftPattern2.test(message)) return 'a nearby crafting table';

      const mineMatch = message.match(minePattern);
      if (mineMatch) return mineMatch[1];

      return '';
    };

    for (const [eventType, event] of events) {
      if (eventType === 'onChat') {
        const item = filterItem(event.onChat);
        if (item) chatlog.add(item);
      }
    }

    return chatlog.size ? `I also need ${Array.from(chatlog).join(', ')}.` : '';
  }
}

module.exports = { CriticAgent }; 