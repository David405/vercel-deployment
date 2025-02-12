import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { Chain } from "../types";

const prisma = new PrismaClient();

// Utility function to wrap async functions
const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  export const checkAccountAddress = asyncHandler(
    async (req: Request, res: Response) => {
      const { address, chain } = req.query;
  
      if (!address || typeof address !== "string") {
        return res.status(400).json({ error: "Invalid account address" });
      }
  
      if (!chain || typeof chain !== "string") {
        return res.status(400).json({ error: "Missing or invalid chain parameter" });
      }
  
      const chainEnum = chain as Chain;
  
      const account = await prisma.web3Account.findUnique({
        where: { address_chain: { address, chain: chainEnum } }, 
        include: { user: true },
      });
  
      if (!account) {
        return res.status(404).json({ exists: false, ownedByUser: false });
      }
  
      res.status(200).json({ exists: true, ownedByUser: !!account.userId });
    }
  );
  