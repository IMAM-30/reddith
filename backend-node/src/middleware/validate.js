const { validationResult } = require('express-validator');

// Tangkap hasil express-validator dan return dalam format error Laravel:
// { message: "...", errors: { field: ["msg1"] } }
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = {};
  errors.array().forEach((err) => {
    const field = err.path || err.param;
    if (!formatted[field]) formatted[field] = [];
    formatted[field].push(err.msg);
  });

  return res.status(422).json({
    message: 'The given data was invalid.',
    errors: formatted,
  });
}

module.exports = { handleValidation };
