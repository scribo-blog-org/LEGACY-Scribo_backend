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
    verificationEmailConfirmSchema
} = require('../middlewares/validation/schemes')

const validateMiddleware = require('../middlewares/validation/validate.middleware')

const loginByGoogleController = require('../controllers/auth/loginByGoogle.controller');
const loginByUsernameController = require('../controllers/auth/loginByUsername.controller');
const registerByEmailController = require('../controllers/auth/registerByEmail.controller');
const registerByGoogleController = require('../controllers/auth/registerByGoogle.controller');

const verificationGoogleController = require('../controllers/auth/verificationGoogle.controller');
const verificationEmailController = require('../controllers/auth/verificationEmail.controller');
const verificationEmailConfirmController = require('../controllers/auth/verificationEmailConfirm.controller');

const refreshController = require('../controllers/auth/refresh.controller');
const logoutController = require('../controllers/auth/logout.controller');
const getSessionsController = require('../controllers/auth/getSessions.controller');
const deleteSessionController = require('../controllers/auth/deleteSession.controller');

const authMiddleware = require('../middlewares/auth.middleware');

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

router.post('/refresh', refreshController)

router.post('/logout', logoutController)

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