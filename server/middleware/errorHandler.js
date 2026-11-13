/**
 * Centralized error handler middleware.
 * Ensures unexpected failures return a structured 500 without crashing the server.
 */
function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle calculation validation errors if bubbled up
  if (err.isValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.validationErrors || [err.message]
    });
  }

  // Log server error for observability
  console.error('[Unhandled Server Error]', err);

  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred.' 
      : (err.message || 'An unexpected error occurred.')
  });
}

module.exports = errorHandler;

