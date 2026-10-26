// The preserved chat function uses this CommonJS export form.
module.exports = function legacyHandler(req, res) { return res.status(405).json({error: "Method not allowed"}); };
