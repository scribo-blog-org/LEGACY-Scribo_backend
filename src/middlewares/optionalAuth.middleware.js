const { decodeAccess } = require('../services/auth/utils/jwt')
const rolePermissions = require('../authorization/rolePermissions')
const roleManagement = require('../authorization/roleManagement')
const ROLES = require('../authorization/roles')

const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader) {
            return next()
        }

        const token = authHeader.split(' ')[1]

        if (!token) {
            return next()
        }

        const auth = decodeAccess(token)

        if (!auth?.id || !auth.role || !Object.values(ROLES).includes(auth.role)) {
            return next()
        }

        req.auth = auth
        req.profile = {
            _id: auth.id,
            email: auth.email,
            nick_name: auth.nick_name,
            role: auth.role,
            permissions: rolePermissions[auth.role] ?? []
        }

        if (roleManagement[auth.role]) {
            req.profile.role_management = roleManagement[auth.role]
        }

        next()
    }
    catch {
        next()
    }
}

module.exports = optionalAuthMiddleware
