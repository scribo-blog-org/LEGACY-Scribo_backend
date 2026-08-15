const Category = require("../models/Category")

async function getAllCategories() {
    return Category.find().lean()
}

async function getCategoriesByIds(category_ids) {
    return Category.find({
        _id: { $in: category_ids }
    }).lean()
}

async function getCategoryById(id) {
    return Category.findById(id).lean()
}

async function getCategoryByName(name) {
    return Category.findOne({ name: name }).lean()
}

async function createNewCategory(name, icon, color) {
    const category = new Category({ name, icon, color });
    await category.save();

    return category.toObject();
}

async function updateCategoryById(id, data) {
    return Category.findByIdAndUpdate(id, data, { new: true }).lean()
}

async function deleteCategoryById(id) {
    return Category.findByIdAndDelete(id).lean()
}

module.exports = {
    getAllCategories,
    createNewCategory,
    getCategoryById,
    getCategoriesByIds,
    updateCategoryById,
    deleteCategoryById,
    getCategoryByName
}