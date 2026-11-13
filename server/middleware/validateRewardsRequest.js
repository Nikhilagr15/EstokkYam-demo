const { validateCalculationParams } = require('../services/rewardsCalculatorService');

/**
 * Middleware to validate and sanitize calculate-rewards request parameters.
 * Rejects invalid requests with 400 Bad Request.
 */
function validateRewardsRequest(req, res, next) {
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Invalid Request Body',
      details: ['Request body must be a valid JSON object.']
    });
  }

  // Parse numeric inputs if provided as numbers or numeric strings
  const parsedBody = { ...req.body };

  if (parsedBody.principal !== undefined && parsedBody.principal !== null && typeof parsedBody.principal === 'string') {
    const p = parseFloat(parsedBody.principal);
    if (!isNaN(p)) parsedBody.principal = p;
  }

  if (parsedBody.apy !== undefined && parsedBody.apy !== null && typeof parsedBody.apy === 'string') {
    const a = parseFloat(parsedBody.apy);
    if (!isNaN(a)) parsedBody.apy = a;
  }

  if (parsedBody.duration !== undefined && parsedBody.duration !== null && typeof parsedBody.duration === 'string') {
    const d = parseFloat(parsedBody.duration);
    if (!isNaN(d)) parsedBody.duration = d;
  }

  if (parsedBody.tokenPrice !== undefined && parsedBody.tokenPrice !== null && typeof parsedBody.tokenPrice === 'string') {
    const tp = parseFloat(parsedBody.tokenPrice);
    if (!isNaN(tp)) parsedBody.tokenPrice = tp;
  }

  const errors = validateCalculationParams(parsedBody);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors
    });
  }

  // Attach sanitized body to request
  req.body = parsedBody;
  next();
}

module.exports = validateRewardsRequest;

