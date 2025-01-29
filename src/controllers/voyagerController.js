const { VoyagerService } = require('../services/voyagerService');

// VoyagerService 인스턴스 생성
const voyagerService = new VoyagerService();

exports.learn = async (req, res) => {
  try {
    // maxIteration 같은 파라미터를 바디에서 받을 수 있음
    const { maxIteration } = req.body;
    const result = await voyagerService.learn(maxIteration);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to run learn' });
  }
};

exports.rollout = async (req, res) => {
  try {
    const { task, context } = req.body;
    const result = await voyagerService.rollout(task, context);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to run rollout' });
  }
};
