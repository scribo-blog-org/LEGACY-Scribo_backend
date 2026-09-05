const { getAllCategories, getCategoryById, updateCategoryById, createNewCategory, deleteCategoryById, getCategoryByName } = require('../db/category')
const { getPostsByQuery } = require('../db/posts')

const ConflictError = require("../errors/ConflictError")
const NotFoundError = require("../errors/NotFoundError")
const PERMISSIONS = require('../authorization/permissions')
const { actorFromProfile, assertPermission } = require('../authorization/roleChecks')

async function getCategories() {
    const categories = await getAllCategories()
    const posts = await getPostsByQuery()

    const postsCount = {}

    for (const post of posts) {
        const categoryId = post.category.toString()
        postsCount[categoryId] = (postsCount[categoryId] || 0) + 1
    }

    for (const category of categories) {
        category.posts_count = postsCount[category._id.toString()] || 0
    }

    return categories
}

async function editCategory(id, data, profile) {
    assertPermission(
        actorFromProfile(profile),
        PERMISSIONS.EDIT_ANY_CATEGORY,
        "You don't have permission to edit a category"
    )

    const category = await getCategoryById(id)

    if(!category) {
        throw new NotFoundError({ message: "Category not found!" })
    }

    const is_name_exists = await getCategoryByName(data.name)

    if(is_name_exists && is_name_exists._id.toString() !== id.toString()) {
        throw new ConflictError({ message: "Category name already exists!" })
    }

    const result = await updateCategoryById(id, data)
    
    if(!result) {
        throw new NotFoundError({ message: "Category not found!" })
    }
    
    const posts = await getPostsByQuery({ category: id })
    result.posts_count = posts.length

    global.Logger.log({
        type: "update_category",
        message: `User ${profile.nick_name} updated category`,
        data: {
            user: profile._id,
            category: result._id
        }
    })

    return result
}

async function createCategory(data, profile) {
    assertPermission(
        actorFromProfile(profile),
        PERMISSIONS.CREATE_CATEGORY,
        "You don't have permission to create a category"
    )

    const is_name_exists = await getCategoryByName(data.name)

    if(is_name_exists) {
        throw new ConflictError({ message: "Category name already exists!" })
    }

    const result = await createNewCategory(data.name, data.icon, data.color)
    
    global.Logger.log({
        type: "create_category",
        message: `User ${profile.nick_name} created category`,
        data: {
            user: profile._id,
            category: result._id
        }
    })

    return result
}

async function deleteCategory(id, profile) {
    assertPermission(
        actorFromProfile(profile),
        PERMISSIONS.DELETE_ANY_CATEGORY,
        "You don't have permission to delete a category"
    )

    const category = await getCategoryById(id)

    if(!category) {
        throw new NotFoundError({ message: "Category not found!" })
    }

    const posts = await getPostsByQuery({ category: id })

    if(posts.length > 0) {
        throw new ConflictError({ message: "Cannot delete category with associated posts!" })
    }

    const result = await deleteCategoryById(id)

    if(!result) {
        throw new NotFoundError({ message: "Category not found!" })
    }

    global.Logger.log({
        type: "delete_category",
        message: `User ${profile.nick_name} deleted category`,
        data: {
            user: profile._id,
            category: id
        }
    })

    return result
}

module.exports = {
    getCategories,
    editCategory,
    createCategory,
    deleteCategory
}