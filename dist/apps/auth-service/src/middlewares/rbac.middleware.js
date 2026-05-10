"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbac = exports.Role = void 0;
exports.requireRole = requireRole;
var Role;
(function (Role) {
    Role["OWNER"] = "OWNER";
    Role["ADMIN"] = "ADMIN";
    Role["DEVELOPER"] = "DEVELOPER";
    Role["OBSERVER"] = "OBSERVER";
})(Role || (exports.Role = Role = {}));
const roleHierarchy = {
    [Role.OWNER]: 4,
    [Role.ADMIN]: 3,
    [Role.DEVELOPER]: 2,
    [Role.OBSERVER]: 1,
};
function requireRole(...allowedRoles) {
    return async (request, reply) => {
        const user = request.user;
        const userRole = user?.role;
        if (!userRole) {
            reply.status(403).send({ error: "Access denied. No role assigned." });
            return;
        }
        const userLevel = roleHierarchy[userRole];
        const hasAccess = allowedRoles.some(role => roleHierarchy[role] <= userLevel);
        if (!hasAccess) {
            reply.status(403).send({
                error: "Access denied. Insufficient permissions.",
                required: allowedRoles,
                current: userRole
            });
        }
    };
}
exports.rbac = {
    requireOwner: requireRole(Role.OWNER),
    requireAdmin: requireRole(Role.OWNER, Role.ADMIN),
    requireDeveloper: requireRole(Role.OWNER, Role.ADMIN, Role.DEVELOPER),
    requireObserver: requireRole(Role.OWNER, Role.ADMIN, Role.DEVELOPER, Role.OBSERVER),
};
