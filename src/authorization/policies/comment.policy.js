const { getCommentById } = require('../../db/comments');
const ForbiddenError  = require('../../errors/ForbiddenError');
const { getActor, hasPermissions, isResourceOwner } = require('../roleChecks');
const PERMISSIONS = require('../permissions');

const NotFoundError = require('../../errors/NotFoundError');

const canDelete = async (req, res, next) => {
    try {
        const comment = await getCommentById(req.params.id);
        const actor = getActor(req)
        
        if (!comment) {
            throw new NotFoundError({ message: "Comment is not found" })
        }

        if (isResourceOwner(comment.author, actor.id)) {
            return next()
        }

        if (hasPermissions(actor, PERMISSIONS.DELETE_ANY_COMMENT)) {
            return next()
        }

        throw new ForbiddenError({ message: "You don't have permission to delete this comment" });
    } catch (error) {
        next(error);
    }
};

const canEdit = async (req, res, next) => {
    try {
        const comment = await getCommentById(req.params.id);
        const actor = getActor(req)
        
        if (!comment) {
            throw new NotFoundError({ message: "Comment is not found" })
        }

        if (isResourceOwner(comment.author, actor.id)) {
            return next()
        }

        throw new ForbiddenError({ message: "You don't have permission to edit this comment" });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    canDelete,
    canEdit
}
