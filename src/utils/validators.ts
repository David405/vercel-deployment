import { PrismaClient } from "@prisma/client"
import axios from "axios";
import { account } from "../services/users";


const prisma = new PrismaClient();


//?  List of Banned words to be provided
const bannedWords:string[] = []; 


// Validate Username
      // - Checks uniqueness
      // - Checks characters
      // - Checks banned word list

export const validateUsername = async (username :string):Promise<{ valid: boolean; message: string; }>=> {

    // Check characters
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return { valid: false, message: "Invalid characters in username" };
    }

    //TODO: Check if username contains banned words
    if (bannedWords.some(word => username.toLowerCase().includes(word))) {
        return { valid: false, message: "Username contains banned words" };
    }

    //Check if username already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
        return { valid: false, message: "Username already taken" };
    }

    return { valid: true, message: "Username is available" };
    
}

// Validate Email
        // - Check unique
        // - Check format
        // - Check domain

export const validateEmail = async(email:string):Promise<{valid:boolean , message:string}> => {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
        return { valid: false, message: "Email already registered" };
    }
    
    return { valid: true, message: "Email is valid" };
}

// Validates Account Address with Adamik API

export const validateAddressWithAdamik= async({address , nonce ,chainId}:account):Promise<{valid:boolean , message:string}> => {
    console.log({
        address : address ,
        chainId : chainId ,
    })
    const apiKey = process.env.ADAMIK_API_KEY;
    

    try{
        const response = await axios.post(`https://api.adamik.io/api/${chainId}/address/validate`,
            {address},
            {headers:{
                Authorization : apiKey,
                "Content-Type":'application/json'
            }}
        );
        if(response.data.valid){
            return {
                valid:true,
                message:"Address is valid"
            }
        }

        else {
            return { valid: false, message: 'Address is invalid' };
        }
    } catch(err){
        console.error("Error Validating Address: " , err);
        return {
            valid : false ,
            message : "Error Validating Address!"
        }
    }
}