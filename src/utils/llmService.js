module.exports = {
    async generateActionCode(context) {
      // TODO: LLM에 prompt를 구성해 코드 추론
      // 여기서는 단순 mock
      return "player.moveForward()";
    },
  
    async runQA1(env, eventManager) {
      // TODO: LLM에 질문 생성 요청
      return ["What blocks are available?", "What mobs are nearby?"];
    },
  
    async runQA2(questions) {
      // TODO: LLM에 질문에 대한 답 생성 요청
      return ["Stone, Wood", "Pigs, Cows"];
    },
  
    async proposeNextAiTask(answers) {
      // TODO: LLM에 목표 테스크 생성 요청
      return { task: "Collect 10 Wood", context: { details: answers } };
    },
  
    async checkTaskSuccess(event, task, context) {
      // TODO: LLM에 현재 이벤트, 태스크, 컨텍스트를 설명해 성공 여부 판단
      // 여기서는 간단 Mock
      const success = Math.random() > 0.7; 
      const critique = success ? "Task accomplished" : "Need to try again";
      return { success, critique };
    }
  };
  