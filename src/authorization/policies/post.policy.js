const { getPost } = require('../../services/posts.services');
const ForbiddenError  = require('../../errors/ForbiddenError');
const { getActor, hasPermissions, isResourceOwner } = require('../roleChecks');
const PERMISSIONS = require('../permissions');

const NotFoundError = require('../../errors/NotFoundError');

const canCreate = async (req, res, next) => {
    try {
        if (hasPermissions(getActor(req), PERMISSIONS.CREATE_POST)) {
            return next()
        }

        throw new ForbiddenError({ message: "You don't have permission to create a post" });

    } catch (error) {
        next(error);
    }
}

const canEdit = async (req, res, next) => {
    try {
        const post = await getPost(req.params.id);
        const actor = getActor(req)
        
        if (!post) {
            throw new NotFoundError({ message: "Post is not found" })
        }

        if (isResourceOwner(post.author, actor.id)) {
            return next()
        }

        if (hasPermissions(actor, PERMISSIONS.EDIT_ANY_POST)) {
            return next()
        }

        throw new ForbiddenError({ message: "You don't have permission to update a post" });
    } catch (error) {
        next(error);
    }
}

const canDelete = async (req, res, next) => {
    try {
        const post = await getPost(req.params.id);
        const actor = getActor(req)
        
        if (!post) {
            throw new NotFoundError({ message: "Post is not found" })
        }

        if (isResourceOwner(post.author, actor.id)) {
            return next()
        }

        if (hasPermissions(actor, PERMISSIONS.DELETE_ANY_POST)) {
            return next()
        }

        throw new ForbiddenError({ message: "You don't have permission to delete a post" });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    canCreate,
    canEdit,
    canDelete
}
