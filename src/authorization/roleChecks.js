const roleManagement = require("./roleManagement");
const rolePermissions = require("./rolePermissions");
const PERMISSIONS = require("./permissions");
const ForbiddenError = require("../errors/ForbiddenError");

const actorFromProfile = (profile) => {
    if (!profile) {
        return { id: null, role: null }
    }

    return {
        id: profile.id || (profile._id ? String(profile._id) : null),
        role: profile.role || null
    }
}

const getActor = (req) => {
    if (req.auth?.id) {
        return req.auth
    }

    return actorFromProfile(req.profile)
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

    const authorId = resourceAuthorId._id || resourceAuthorId

    return String(authorId) === String(actorId)
}

const assertPermission = (actor, permission, message) => {
    if (hasPermissions(actor, permission)) {
        return
    }

    throw new ForbiddenError({
        message: message || "You don't have permission to perform this action!"
    })
}

const assertOwnerOrPermission = (resourceAuthorId, actor, permission, message) => {
    if (isResourceOwner(resourceAuthorId, actor.id)) {
        return
    }

    assertPermission(actor, permission, message)
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
    actorFromProfile,
    getActor,
    hasPermissions,
    isResourceOwner,
    assertPermission,
    assertOwnerOrPermission,
    canManageRole,
}
