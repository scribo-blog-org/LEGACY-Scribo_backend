const ROLES = require("./roles");

module.exports = {
    [ROLES.USER]: [],

    [ROLES.AUTHOR]: [],

    [ROLES.MODERATOR]: [],

    [ROLES.ADMIN]: [
        ROLES.USER,
        ROLES.AUTHOR,
        ROLES.MODERATOR,
    ],

    [ROLES.TECH_ADMIN]: [
        ROLES.USER,
        ROLES.AUTHOR,
        ROLES.MODERATOR,
        ROLES.ADMIN,
        ROLES.TECH_ADMIN,
    ],
};