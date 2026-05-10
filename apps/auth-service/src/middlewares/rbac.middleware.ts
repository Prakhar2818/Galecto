import { FastifyRequest, FastifyReply } from "fastify";

export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  DEVELOPER = "DEVELOPER",
  OBSERVER = "OBSERVER"
}

const roleHierarchy: Record<Role, number> = {
  [Role.OWNER]: 4,
  [Role.ADMIN]: 3,
  [Role.DEVELOPER]: 2,
  [Role.OBSERVER]: 1,
};

export function requireRole(...allowedRoles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    const userRole = user?.role as Role;

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

export const rbac = {
  requireOwner: requireRole(Role.OWNER),
  requireAdmin: requireRole(Role.OWNER, Role.ADMIN),
  requireDeveloper: requireRole(Role.OWNER, Role.ADMIN, Role.DEVELOPER),
  requireObserver: requireRole(Role.OWNER, Role.ADMIN, Role.DEVELOPER, Role.OBSERVER),
};