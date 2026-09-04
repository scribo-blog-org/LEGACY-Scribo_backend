const { getActor, hasPermissions } = require('../roleChecks');

const PERMISSIONS = require('../permissions');

const ForbiddenError  = require('../../errors/ForbiddenError');

const canCreate = async (req, res, next) => {
    try {
        if (hasPermissions(getActor(req), PERMISSIONS.CREATE_CATEGORY)) {
            return next()
        }

        throw new ForbiddenError({ message: "You don't have permission to create a category" });

    } catch (error) {
        next(error);
    }
}

const canEdit = async (req, res, next) => {
    try {
        if (hasPermissions(getActor(req), PERMISSIONS.EDIT_ANY_CATEGORY)) {
            return next()
        }

        throw new ForbiddenError({ message: "You don't have permission to edit a category" });

    } catch (error) {
        next(error);
    }
}

const canDelete = async (req, res, next) => {
    try {
        if (hasPermissions(getActor(req), PERMISSIONS.DELETE_ANY_CATEGORY)) {
            return next()
        }

        throw new ForbiddenError({ message: "You don't have permission to delete a category" });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    canCreate,
    canEdit,
    canDelete
}
