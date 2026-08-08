const roleManagement = require("./roleManagement");
const rolePermissions = require("./rolePermissions");
const PERMISSIONS = require("./permissions");

const hasPermissions = (profile, permission) => {
    return rolePermissions[profile.role]?.includes(permission);
};

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
    hasPermissions,
    canManageRole,
}