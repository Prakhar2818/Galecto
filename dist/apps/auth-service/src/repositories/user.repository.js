"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const client_1 = require("../prisma/client");
class UserRepository {
    async create(data) {
        return client_1.prisma.user.create({ data });
    }
    async findByEmail(email) {
        return client_1.prisma.user.findUnique({ where: { email } });
    }
}
exports.UserRepository = UserRepository;
