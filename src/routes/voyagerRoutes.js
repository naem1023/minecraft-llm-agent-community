const express = require('express');
const router = express.Router();
const voyagerController = require('../controllers/voyagerController');

// 학습 실행
router.post('/learn', voyagerController.learn);

// 특정 Task에 대한 rollout
router.post('/rollout', voyagerController.rollout);

module.exports = router;
