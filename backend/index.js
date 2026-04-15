const app = require('./src/app')
const { PORT } = require('./src/config/env')
const logger = require('./src/utils/logger')
const { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, ensureData } = require('./src/models/dbStore')

ensureData()

app.listen(PORT, () => {
  logger.info(`Travel Planner API running on http://localhost:${PORT}`)
  logger.info(`Default admin login: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`)
})
