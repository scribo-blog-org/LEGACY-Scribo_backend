const { Router } = require("express")
const router = Router()

const authMiddleware = require("../middlewares/auth.middleware")
const optionalAuthMiddleware = require("../middlewares/optionalAuth.middleware")
const validateMiddleware = require("../middlewares/validation/validate.middleware")
const { trackVisitSchema, getDashboardSchema } = require("../middlewares/validation/schemes")

const trackVisitController = require("../controllers/analytics/trackVisit.controller")
const getDashboardController = require("../controllers/analytics/getDashboard.controller")

router.post(
    "/visit",
    optionalAuthMiddleware,
    validateMiddleware(trackVisitSchema),
    trackVisitController
)

router.get(
    "/dashboard",
    authMiddleware,
    validateMiddleware(getDashboardSchema),
    getDashboardController
)

module.exports = router
