module.exports = async (req, res) => {
  res.status(200).json({ success: true, message: 'Init data endpoint' });
};