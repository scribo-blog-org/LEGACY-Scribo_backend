const { Router } = require('express')
const router = Router()

const {
    editCategorySchema,
    createCategorySchema,
    deleteCategorySchema
} = require('../middlewares/validation/schemes')

const authMiddleware = require('../middlewares/auth.middleware')

const validateMiddleware = require('../middlewares/validation/validate.middleware')

const getCategoriesController = require('../controllers/categories/getCategories.controller')
const editCategoryController = require('../controllers/categories/editCategory.controller')
const createCategoryController = require('../controllers/categories/createCategory.controller')
const deleteCategoryController = require('../controllers/categories/deleteCategory.controller')

router.get(
    '/',
    getCategoriesController
)

router.patch(
    '/:id',
    validateMiddleware(editCategorySchema),
    authMiddleware,
    editCategoryController
)

router.post(
    '/',
    validateMiddleware(createCategorySchema),
    authMiddleware,
    createCategoryController
)

router.delete(
    '/:id',
    validateMiddleware(deleteCategorySchema),
    authMiddleware,
    deleteCategoryController
)

module.exports = router