const { Router } = require('express')
const router = Router();

const uploadMiddleware = require('../middlewares/upload.middleware');
const {
    loginUsernameSchema,
    loginGoogleSchema,
    registerEmailSchema,
    registerGoogleSchema,
    verificationGoogleSchema,
    verificationEmailSchema,
    verificationEmailConfirmSchema,
    forgotPasswordSchema,
    confirmPasswordResetSchema,
    resetPasswordSchema
} = require('../middlewares/validation/schemes')

const validateMiddleware = require('../middlewares/validation/validate.middleware')
const rateLimit = require('../middlewares/rateLimit.middleware')

const loginByGoogleController = require('../controllers/auth/loginByGoogle.controller');
const loginByUsernameController = require('../controllers/auth/loginByUsername.controller');
const registerByEmailController = require('../controllers/auth/registerByEmail.controller');
const registerByGoogleController = require('../controllers/auth/registerByGoogle.controller');

const verificationGoogleController = require('../controllers/auth/verificationGoogle.controller');
const verificationEmailController = require('../controllers/auth/verificationEmail.controller');
const verificationEmailConfirmController = require('../controllers/auth/verificationEmailConfirm.controller');
const requestPasswordResetController = require('../controllers/auth/requestPasswordReset.controller');
const confirmPasswordResetController = require('../controllers/auth/confirmPasswordReset.controller');
const resetPasswordController = require('../controllers/auth/resetPassword.controller');

const refreshController = require('../controllers/auth/refresh.controller');
const logoutController = require('../controllers/auth/logout.controller');
const getSessionsController = require('../controllers/auth/getSessions.controller');
const deleteSessionController = require('../controllers/auth/deleteSession.controller');

const authMiddleware = require('../middlewares/auth.middleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuth.middleware');

router.post(
    '/login/username',
    validateMiddleware(loginUsernameSchema),
    loginByUsernameController
);

router.post(
    '/login/google',
    validateMiddleware(loginGoogleSchema),
    loginByGoogleController
);

router.post(
    '/register/email',
    uploadMiddleware(['avatar']),
    validateMiddleware(registerEmailSchema),
    registerByEmailController
);

router.post(
    '/register/google',
    uploadMiddleware(['avatar']),
    validateMiddleware(registerGoogleSchema),
    registerByGoogleController
);

router.post(
    '/verification/google', 
    validateMiddleware(verificationGoogleSchema),
    verificationGoogleController
)

router.post(
    '/verification/email',
    validateMiddleware(verificationEmailSchema),
    verificationEmailController
)

router.post(
    '/verification/email/confirm',
    validateMiddleware(verificationEmailConfirmSchema),
    verificationEmailConfirmController
)

const FIFTEEN_MINUTES = 15 * 60 * 1000

router.post(
    '/password/forgot',
    rateLimit({ name: "password-forgot-ip", windowMs: FIFTEEN_MINUTES, max: 8, by: "ip" }),
    rateLimit({ name: "password-forgot-email", windowMs: FIFTEEN_MINUTES, max: 3, by: "email" }),
    validateMiddleware(forgotPasswordSchema),
    requestPasswordResetController
)

router.post(
    '/password/forgot/confirm',
    rateLimit({ name: "password-confirm-ip", windowMs: FIFTEEN_MINUTES, max: 20, by: "ip" }),
    rateLimit({ name: "password-confirm-email", windowMs: FIFTEEN_MINUTES, max: 8, by: "email" }),
    validateMiddleware(confirmPasswordResetSchema),
    confirmPasswordResetController
)

router.post(
    '/password/reset',
    rateLimit({ name: "password-reset-ip", windowMs: FIFTEEN_MINUTES, max: 10, by: "ip" }),
    rateLimit({ name: "password-reset-email", windowMs: FIFTEEN_MINUTES, max: 5, by: "email" }),
    validateMiddleware(resetPasswordSchema),
    resetPasswordController
)

router.post('/refresh', refreshController)

router.post('/logout', optionalAuthMiddleware, logoutController)

router.get(
    '/sessions',
    authMiddleware,
    getSessionsController
)

router.delete(
    '/sessions/:id',
    authMiddleware,
    deleteSessionController
)

module.exports = router