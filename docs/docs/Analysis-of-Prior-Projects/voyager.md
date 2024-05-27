---
sidebar_position: 1
---

# Voyager
This document is analysis results of the project [Voyager](https://github.com/MineDojo/Voyager).

## Pseudo Code
You can check the pseudo code in the [paper](https://arxiv.org/abs/2305.16291), but I write the new version of the pseudo code here.
```javascript
// Pseudo code of Voyager learn function

// Prepare agents
action_agent = new Action_Agent()
curriculm_agent = new Curriculm_Agent()
critic_agent = new Critic_Agent()
skill_manager = new Skill_Manager()
env = new Minecraft_Env()
event = new EventManger()
recorder = new Recorder()

function rollout(task, context) {
    action_context = construct_action_context(task, context, [])
    while (true) {
        // Get action which is the javascript code to execute
        action = action_agent.generate_action(action_context)

        // Execute the action
        event = env.step(action)

        // Recrod the event and task
        recorder.record(event, task)
    
        // Updat the chest(inventory) memory
        action_agent.update_memory(event)

        // Check the success of the task
        success, critique = critic_agent.check_success(event, task, context, env)

        if !success {
            // Revert all the placing event in this step
            env.step("undo")
        }

        // Retrieve the skill from db
        skills = skill_manager.retrieve_skills(task, context, action_agent.summarize_log())

        // Update new action context
        action_context = construct_action_context(task, context, skills)
        
        // Determine the termination of the task
        done = determine_termination(success)

        if done {
            return construct_info(success, critique, task, context, recorder)
        }
    }
}

function learn() {
    env.reset()
    event.reset()
    max_iteration = ...
    current_iteration = 0
    
    while (current_iteration < max_iteration) {
        // Propose the next task
        task, context = curriculm_agent.propose_next_task_from_current(env, event)

        // Rollout the task
        info = rollout(task, context)
        
        // Update the skills from rollout
        skill_manager.update_skills(info)

        current_iteration += 1
    }
}

learn()
```

## Dependency of LLM 
Voayger uses the LLM at the following places in the pseudo code:
- curriculm_agent.propose_next_task_from_current
    - render_humange_message: make a questino, answer pair
        - **run_qa1**: Geneate the questions to find the blocks, items, and mobs
        - **run_qa2**: Answer the questions from run_qa1
    - **propose_next_ai_task**: Generate the next task from the render_humna_message
- **action_agent.generate_action**: Generate the action(javascript code) from the task
- **critic_agent.check_success**: Check the success of the task

So if Voyager run the 1 cycle of the learn function, it will use the LLM 5 times sequentially.
1. run_qa1 from curriculm agent
2. run_qa2 from curriculm agent
3. propose_next_ai_task from curriculm agent
4. generate_action from action agent
5. check_success from critic agent
