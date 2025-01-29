const { OpenAIEmbeddings } = require("@langchain/openai");
const { ChatOpenAI } = require("@langchain/openai");

const { ChromaClient } = require('chromadb');
const fs = require('fs');
const path = require('path');
const { loadControlPrimitives } = require('../utils/controlPrimitives');

class SkillManager {
  constructor(options = {}) {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
    });
    
    this.ckptDir = options.ckptDir || 'ckpt';
    this.retrievalTopK = options.retrievalTopK || 5;
    
    // Create checkpoint directories
    fs.mkdirSync(`${this.ckptDir}/skill/code`, { recursive: true });
    fs.mkdirSync(`${this.ckptDir}/skill/description`, { recursive: true });
    fs.mkdirSync(`${this.ckptDir}/skill/vectordb`, { recursive: true });

    // Load control primitives
    this.controlPrimitives = loadControlPrimitives();

    // Initialize skills
    if (options.resume) {
      console.log(`Loading Skill Manager from ${this.ckptDir}/skill`);
      this.skills = this.loadSkills();
    } else {
      this.skills = {};
    }

    // Initialize vector database
    try {
      this.vectordb = new ChromaClient();
      this.collection = this.vectordb.createCollection({
        name: "skill_vectordb",
        embeddingFunction: new OpenAIEmbeddings({
          modelName: "text-embedding-3-small"
        })
      });
    } catch (error) {
      console.warn('Warning: Could not initialize ChromaDB:', error.message);
      this.vectordb = null;
      this.collection = null;
    }

    // Verify vectordb sync only if vectordb is initialized
    if (this.collection) {
      try {
        const vectorCount = this.collection.count();
        if (vectorCount !== Object.keys(this.skills).length) {
          console.warn(
            `Warning: Skill Manager's vectordb is not synced with skills.json.\n` +
            `There are ${vectorCount} skills in vectordb but ${Object.keys(this.skills).length} skills in skills.json.`
          );
        }
      } catch (error) {
        console.warn('Warning: Could not verify vectordb sync:', error.message);
      }
    }
  }

  get programs() {
    let programs = '';
    // Add skills
    for (const [skillName, entry] of Object.entries(this.skills)) {
      programs += `${entry.code}\n\n`;
    }
    // Add control primitives
    for (const primitive of this.controlPrimitives) {
      programs += `${primitive}\n\n`;
    }
    return programs;
  }

  loadSkills() {
    try {
      return JSON.parse(fs.readFileSync(`${this.ckptDir}/skill/skills.json`));
    } catch (error) {
      console.log('No skills found, starting fresh');
      return {};
    }
  }

  async addNewSkill(info) {
    // Skip deposit skills
    if (info.task.startsWith('Deposit useless items into the chest at')) {
      return;
    }

    const programName = info.program_name;
    const programCode = info.program_code;

    // Generate skill description
    const skillDescription = await this.generateSkillDescription(programName, programCode);
    console.log(`Skill Manager generated description for ${programName}:\n${skillDescription}`);

    // Handle existing skills
    if (programName in this.skills) {
      console.log(`Skill ${programName} already exists. Rewriting!`);
      if (this.collection) {
        await this.collection.delete([programName]);
      }
      
      // Version the file
      let i = 2;
      while (fs.existsSync(`${this.ckptDir}/skill/code/${programName}V${i}.js`)) {
        i++;
      }
      this.dumpedProgramName = `${programName}V${i}`;
    } else {
      this.dumpedProgramName = programName;
    }

    // Add to vectordb if available
    if (this.collection) {
      try {
        await this.collection.add({
          texts: [skillDescription],
          ids: [programName],
          metadatas: [{ name: programName }]
        });
      } catch (error) {
        console.warn('Warning: Could not add to vectordb:', error.message);
      }
    }

    // Update skills dictionary
    this.skills[programName] = {
      code: programCode,
      description: skillDescription
    };

    // Save files
    fs.writeFileSync(
      `${this.ckptDir}/skill/code/${this.dumpedProgramName}.js`,
      programCode
    );
    fs.writeFileSync(
      `${this.ckptDir}/skill/description/${this.dumpedProgramName}.txt`,
      skillDescription
    );
    fs.writeFileSync(
      `${this.ckptDir}/skill/skills.json`,
      JSON.stringify(this.skills, null, 2)
    );
  }

  async generateSkillDescription(programName, programCode) {
    const response = await this.llm.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates descriptions of JavaScript functions."
        },
        {
          role: "user", 
          content: programCode + "\n\n" + `The main function is \`${programName}\`.`
        }
      ]
    });

    const description = response.data.choices[0].message.content;
    return `async function ${programName}(bot) {\n    // ${description}\n}`;
  }

  async retrieveSkills(query) {
    if (!this.collection) {
      console.warn('Warning: VectorDB not available, returning empty skills array');
      return [];
    }

    const k = Math.min(this.collection.count(), this.retrievalTopK);
    if (k === 0) return [];

    console.log(`Skill Manager retrieving for ${k} skills`);
    
    try {
      const results = await this.collection.similaritySearch(query, k);
      
      const retrievedSkills = results.map(doc => {
        console.log(`Retrieved skill: ${doc.metadata.name}`);
        return this.skills[doc.metadata.name].code;
      });

      return retrievedSkills;
    } catch (error) {
      console.warn('Warning: Could not retrieve skills:', error.message);
      return [];
    }
  }

  getSkills() {
    return this.skills;
  }

  retrieveSkills(task, context, summarizedLog) {
    // implementation
    return [];
  }

  updateSkills(info) {
    // implementation
  }
}

module.exports = { SkillManager };