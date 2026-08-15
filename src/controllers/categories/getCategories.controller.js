const { getCategories } = require('../../services/categories.services')

const getCategoriesController = async (req, res, next) => {
    try {
        const result = await getCategories()

        res.status(200).json({
            status: true,
            message: "Categories fetched successfully",
            data: result
        })
    }
    catch(error) {
        next(error)
    }
}

module.exports = getCategoriesController