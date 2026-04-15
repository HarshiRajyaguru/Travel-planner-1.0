function health(_req, res) {
  res.status(200).json({ ok: true, service: 'travel-planner-api' })
}

module.exports = { health }
