const { decodeAccess } = require('../services/auth/utils/jwt')
const UnauthorizedError = require('../errors/UnAuthorizedError')
const rolePermissions = require('../authorization/rolePermissions')
const roleManagement = require('../authorization/roleManagement')
const ROLES = require('../authorization/roles')

const authMiddleware = async (req, res, next) => {
    try { 
        const authHeader = req.headers.authorization;
    
        if (!authHeader) {
            return next(new UnauthorizedError());
        }
    
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return next(new UnauthorizedError());
        }

        const auth = decodeAccess(token)

        if (!auth?.id || !auth.role) {
            return next(new UnauthorizedError());
        }

        if (!Object.values(ROLES).includes(auth.role)) {
            return next(new UnauthorizedError());
        }

        req.auth = auth

        req.profile = {
            _id: auth.id,
            email: auth.email,
            nick_name: auth.nick_name,
            role: auth.role,
            permissions: rolePermissions[auth.role] ?? [],
        }

        if (roleManagement[auth.role]) {
            req.profile.role_management = roleManagement[auth.role]
        }

        next();
    }
    catch(error) {
        next(error)
    }
};

module.exports = authMiddleware;
