const { default: mongoose } = require("mongoose");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model")
  


async function authMiddleware(req, res, next) {

     const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
     // req.header.autherization me user ka name token (related details), dono chije hoti h to usme space lga do amd 1 index jo token vo de do 
     // split lagana needed h kyuki ydi value nhi h to undefined and space se obect khali hoga to feel ho jayega isliiye split lagaya


     if(!token){
        return res.status(401).json({
            Message: "Unauthorized access, token is missing"
        })
     }

     const isBlasklisted = await tokenBlacklistModel.findOne({token})

        if(isBlasklisted){
            return res.status(401).json({
                message: "Unauthorized access, token is Invalid"
            })
        }


     // lets verify your token
     try{
        const decoded = jwt.verify(token, process.env.JWT_SECRETS);

        const user = await userModel.findById(decoded.userId)

        req.user = user

        return next()


     }catch(err){
       return res.status(401).json({
           Message: "Unauthorized access, token is missing"
       })
     }
    
}

async function authSystemUserMiddleware(req, res, next) {
    
   const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

   if(!token){
        return res.status(401).json({
            Message: "Unauthorized access, token is missing"
        })
     }

    const isBlasklisted = await tokenBlacklistModel.findOne({token})

        if(isBlasklisted){
            return res.status(401).json({
                message: "Unauthorized access, token is Invalid"
            })
        }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRETS)

        const user = await userModel.findById(decoded.userId).select("+systemUser")
        
        if(!user.systemUser){
            return res.status(403).json({
                message:"Forbidean access, not a system user"
            })
        }

       req.user = user

       return next()

    }
    catch(err){
        return res.status(401).json({
            message: "Unautherized access, token is invalid"
        })
    }

}


module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}