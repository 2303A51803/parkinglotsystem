const { getRecommendations } = require('../services/recommendationService');
const { success } = require('../utils/response');

/**
 * POST /api/parking/recommendations
 * Body: { vehicleType, zone?, floor?, needsCharger? }
 */
const getRecommendationsHandler = async (req, res, next) => {
  try {
    const results = await getRecommendations(req.body);
    return success(res, 200, 'Recommendations generated successfully', {
      recommendations: results,
      count: results.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRecommendations: getRecommendationsHandler };
