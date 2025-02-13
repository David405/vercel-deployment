import { NextFunction, Request, Response } from "express";
import { error } from "console";
import { UserProfile } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  


    //? QUESTIONS :   1.Onboarding Flow.
    //?               2.Linking of Web3 Account / Social Accounts while creating the profile. 
    //?               3.types of Validation required. 
    
   
// * Initial Basic Implementation 

export const createUserProfile = asyncHandler(
    async (req:Request , res : Response) => {
        try{
            const {username , email , bio , avatar , nonce , turnkeyWallet}  = req.body;
            const existingUser = await prisma.user.findFirst({
                where : {OR : [{email}, {username}]},
            });

            //TODO : VALIDATE User Before creating profile 

            if(existingUser) res.status(400).json({
                message:"User Already Exists"
            });
            const newUser = await prisma.user.create({
                data:{username , email , bio , avatar , nonce , turnkeyWallet
                }
            });
            res.status(201).json({
                message:"User added Successfully",
                data : newUser
            });
        }
        catch(err){
            console.log(err);
            res.status(500).json({
                error:err
            });
        }
    }
);

//* Fetching UserProfile from DB with id param

export const getUserProfile = asyncHandler(
    async (req:Request , res:Response) => {
        try{
            const {id} = req.params;
            const user = await 
            prisma.user.findUnique({
                where:{id},
                include:{
                    web3Accounts:true,
                    socialAccounts:true,
                    followers:true,
                    following:true,
                },
            });

            if(!user){
                res.status(400).json({
                    error:"User not found"
                })
            } else {
                const userProfile : UserProfile = {
                    id: user.id,
                    username: user.username,
                    bio: user.bio || undefined,
                    avatar: user.avatar || undefined,
                    email: user.email || undefined,
                    web3Accounts: user.web3Accounts.map((acc) => ({
                      address: acc.address,
                      chain: acc.chain,
                      isVerified: acc.isVerified,
                    })),
                    socialAccounts: user.socialAccounts.map((acc) => ({
                      platform: acc.platform,
                      username: acc.username,
                      isVerified: acc.isVerified,
                    })),
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                };

                res.status(200).json({
                    message:"User profile retrieved",
                    data : userProfile
                });
            }
        } catch (err){
            console.log(err);
            res.status(400).json({
                error : err
            });
        }
    }
)

