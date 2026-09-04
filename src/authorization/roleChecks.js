const roleManagement = require("./roleManagement");
const rolePermissions = require("./rolePermissions");
const PERMISSIONS = require("./permissions");

const getActor = (req) => {
    if (req.auth?.id) {
        return req.auth
    }

    return {
        id: req.profile?._id ? String(req.profile._id) : null,
        role: req.profile?.role || null
    }
}

const hasPermissions = (actor, permission) => {
    if (!actor?.role) {
        return false
    }

    return rolePermissions[actor.role]?.includes(permission);
};

const isResourceOwner = (resourceAuthorId, actorId) => {
    if (!resourceAuthorId || !actorId) {
        return false
    }

    return String(resourceAuthorId) === String(actorId)
}

const canManageRole = (actorRole, newRole, currentRole) => {
    if (!rolePermissions[actorRole]?.includes(PERMISSIONS.MANAGE_ROLES)) {
        return false;
    }

    const allowedRoles = roleManagement[actorRole] ?? [];

    return (
        allowedRoles.includes(newRole) &&
        allowedRoles.includes(currentRole)
    );
};

module.exports = {
    getActor,
    hasPermissions,
    isResourceOwner,
    canManageRole,
}
