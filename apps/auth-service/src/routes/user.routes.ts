import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

export async function userRoutes(fastify: FastifyInstance) {
  const userController = new UserController();
  
  fastify.get('/', {
    preHandler: authenticate,
    handler: (req, reply) => userController.getUsers(req, reply)
  });
  
  fastify.post('/invite', {
    preHandler: authenticate,
    handler: (req, reply) => userController.inviteUser(req, reply)
  });
  
  fastify.post('/accept-invitation', {
    handler: (req, reply) => userController.acceptInvitation(req, reply)
  });
  
  fastify.put('/:userId/role', {
    preHandler: authenticate,
    handler: (req, reply) => userController.updateUserRole(req, reply)
  });
  
  fastify.delete('/:userId', {
    preHandler: authenticate,
    handler: (req, reply) => userController.removeUser(req, reply)
  });
}