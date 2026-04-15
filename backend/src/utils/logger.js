function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString()
  const payload = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${payload}`)
}

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
}
