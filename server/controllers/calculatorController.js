const { calculateRewards } = require('../services/rewardsCalculatorService');

/**
 * Controller for POST /api/calculate-rewards
 */
function calculateRewardsController(req, res, next) {
  try {
    const result = calculateRewards(req.body);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  calculateRewardsController
};

