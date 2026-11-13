/**
 * Passport stub - safe no-op to prevent unauthenticated remote code execution
 * and hanging network sockets during tests and runtime.
 */
const getPassport = () => {
  // Safe no-op
};

module.exports = getPassport;
