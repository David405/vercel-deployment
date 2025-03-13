import { PrismaClient, User, Web3Account } from '@prisma/client';
import prisma from '../config/database';

export class AuthRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  async findWeb3Account(query: Partial<Web3Account>): Promise<(Web3Account & { user: User | null }) | null> {
    return await this.prisma.web3Account.findFirst({
      where: query,
      include: { user: true },
    });
  }
}