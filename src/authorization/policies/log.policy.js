const ForbiddenError  = require('../../errors/ForbiddenError');
const { getActor, hasPermissions } = require('../roleChecks');
const PERMISSIONS = require('../permissions');


const canView = async (req, res, next) => {
    try {
        if (hasPermissions(getActor(req), PERMISSIONS.VIEW_LOGS)) {
            return next()
        }

        throw new ForbiddenError({ message: "You don't have permission to view logs" });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    canView
}
