import { FastifyReply, FastifyRequest } from "fastify";

export function errorHandler(
  error: any,
  request: FastifyRequest,
  reply: FastifyReply
) {
  reply.status(400).send({
    message: error.message || "Something went wrong",
  });
}