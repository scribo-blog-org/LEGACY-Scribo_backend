const { Router } = require('express')
const router = Router()

const authMiddleware = require('../middlewares/auth.middleware')
const optionalAuthMiddleware = require('../middlewares/optionalAuth.middleware')
const validateMiddleware = require('../middlewares/validation/validate.middleware')
const {
    createSupportRequestSchema,
    getSupportRequestsSchema,
    getSupportRequestSchema,
    replySupportRequestSchema,
    getPublicSupportRequestSchema,
    replyPublicSupportRequestSchema,
    updateSupportRequestStatusSchema
} = require('../middlewares/validation/schemes')

const createSupportRequestController = require('../controllers/support/createSupportRequest.controller')
const listSupportRequestsController = require('../controllers/support/listSupportRequests.controller')
const listMySupportRequestsController = require('../controllers/support/listMySupportRequests.controller')
const getSupportRequestController = require('../controllers/support/getSupportRequest.controller')
const replySupportRequestController = require('../controllers/support/replySupportRequest.controller')
const getPublicSupportRequestController = require('../controllers/support/getPublicSupportRequest.controller')
const replyPublicSupportRequestController = require('../controllers/support/replyPublicSupportRequest.controller')
const updateSupportRequestStatusController = require('../controllers/support/updateSupportRequestStatus.controller')

router.post(
    '/',
    optionalAuthMiddleware,
    validateMiddleware(createSupportRequestSchema),
    createSupportRequestController
)

router.get(
    '/',
    authMiddleware,
    validateMiddleware(getSupportRequestsSchema),
    listSupportRequestsController
)

router.get(
    '/mine',
    authMiddleware,
    validateMiddleware(getSupportRequestsSchema),
    listMySupportRequestsController
)

router.get(
    '/public/:key',
    optionalAuthMiddleware,
    validateMiddleware(getPublicSupportRequestSchema),
    getPublicSupportRequestController
)

router.post(
    '/public/:key/replies',
    optionalAuthMiddleware,
    validateMiddleware(replyPublicSupportRequestSchema),
    replyPublicSupportRequestController
)

router.patch(
    '/:id/status',
    authMiddleware,
    validateMiddleware(updateSupportRequestStatusSchema),
    updateSupportRequestStatusController
)

router.get(
    '/:id',
    authMiddleware,
    validateMiddleware(getSupportRequestSchema),
    getSupportRequestController
)

router.post(
    '/:id/replies',
    authMiddleware,
    validateMiddleware(replySupportRequestSchema),
    replySupportRequestController
)

module.exports = router
