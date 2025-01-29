const { ActionAgent } = require('../agents/actionAgent');
const { CurriculumAgent } = require('../agents/curriculumAgent');
const { CriticAgent } = require('../agents/criticAgent');
const { SkillManager } = require('../agents/skillManager');
const MinecraftEnv = require('../env/minecraftEnv').MinecraftEnv;
const EventManager = require('../managers/eventManager').EventManager;
const Recorder = require('../managers/recorder').Recorder;

// VoyagerService: 실제 사업 로직
class VoyagerService {
  constructor() {
    this.actionAgent = new ActionAgent();
    this.curriculumAgent = new CurriculumAgent();
    this.criticAgent = new CriticAgent();
    this.skillManager = new SkillManager();
    this.env = new MinecraftEnv();
    this.eventManager = new EventManager();
    this.recorder = new Recorder();
    this.currentIteration = 0;
  }

  // pseudo code: rollout(task, context)
  async rollout(task, context) {
    let actionContext = this.constructActionContext(task, context, []);

    while (true) {
      // 1) action 에이전트가 LLM으로부터 action(= JS 코드 형태)을 생성
      const action = await this.actionAgent.generateAction(actionContext);
      // 2) 환경에 action을 적용
      const event = this.env.step(action);

      // 3) 이벤트 기록
      this.recorder.record(event, task);

      // 4) chest(인벤토리) 등에 대한 메모리 업데이트
      this.actionAgent.updateMemory(event);

      // 5) criticAgent로 성공/실패 여부 확인
      const { success, critique } = await this.criticAgent.checkSuccess(
        event, 
        task, 
        context, 
        this.env
      );

      // 실패 시 undo
      if (!success) {
        this.env.step('undo');
      }

      // 6) skillManager를 통해 task와 로그 기반으로 스킬 조회
      const summarizedLog = this.actionAgent.summarizeLog(); // 예시
      const skills = this.skillManager.retrieveSkills(task, context, summarizedLog);

      // 7) actionContext 업데이트
      actionContext = this.constructActionContext(task, context, skills);

      // 8) 종료 조건 체크
      const done = this.determineTermination(success);
      if (done) {
        return this.constructInfo(success, critique, task, context);
      }
    }
  }

  // pseudo code: learn
  async learn(maxIteration = 3) {
    this.env.reset();
    this.eventManager.reset();
    this.currentIteration = 0;

    while (this.currentIteration < maxIteration) {
      // curriculum 에이전트가 다음 태스크 제안
      const { task, context } = await this.curriculumAgent.proposeNextTaskFromCurrent(
        this.env, 
        this.eventManager
      );

      // rollout 수행
      const info = await this.rollout(task, context);

      // rollout 결과를 바탕으로 skill 업데이트
      this.skillManager.updateSkills(info);

      this.currentIteration++;
    }

    return {
      status: 'done',
      totalIterations: this.currentIteration,
    };
  }

  // Helper Methods (Pseudo code 상의 보조 함수들)
  constructActionContext(task, context, skills) {
    // 예: task, context, 현재까지 획득한 스킬 목록을 포함한 prompt나 state 구성
    return { task, context, skills };
  }

  determineTermination(success) {
    // 예: 현재 task가 성공했거나, 일정 횟수 이상 시도했다면 종료
    // 여기서는 간단히 성공 여부만으로 결정
    return success;
  }

  constructInfo(success, critique, task, context) {
    return {
      success,
      critique,
      task,
      context,
      timestamp: Date.now()
    };
  }
}

module.exports = { VoyagerService: VoyagerService };
