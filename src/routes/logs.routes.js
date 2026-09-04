const { Router } = require('express');
const router = Router()

const getLogsController = require('../controllers/logs/getLogs.controller');
const authMiddleware = require('../middlewares/auth.middleware')
const validateMiddleware = require('../middlewares/validation/validate.middleware')
const { getLogsSchema } = require('../middlewares/validation/schemes')

const LogPolicy = require('../authorization/policies/log.policy')


router.get(
    '/',
    authMiddleware,
    LogPolicy.canView,
    validateMiddleware(getLogsSchema),
    getLogsController
)

module.exports = router
