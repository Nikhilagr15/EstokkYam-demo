const express = require('express');
const router = express.Router();
const validateRewardsRequest = require('../../middleware/validateRewardsRequest');
const { calculateRewardsController } = require('../../controllers/calculatorController');

/**
 * @route   POST /api/calculate-rewards
 * @desc    Calculate compound interest staking rewards and generate time-series chart data
 * @access  Public
 */
router.post('/calculate-rewards', validateRewardsRequest, calculateRewardsController);

module.exports = router;

