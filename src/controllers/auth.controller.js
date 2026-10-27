//const { default: mongoose } = require("mongoose");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlacklistModel = require("../models/blacklist.model")


/**
 *  user register page
 **  POST /api/auth/register
 */
async function userRegisterController(req, res) {
  const { email, password, name } = req.body;

  // check user email if they enter second time
  const isExist = await userModel.findOne({
    email: email,
  });

  if (isExist) {
    return res.status(402).json({
      message: "User already exist with email",
      status: "failed",
    });
  }

  // user exist nhi krta then new account create rko
  const user = await userModel.create({
    email,
    password,
    name,
  });
  // and token bhi asign kro
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRETS, {
    expiresIn: "3d",
  });

  // token is created store in cookie
  res.cookie("token", token);



  res.status(201).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
    
  });

  console.log(user.email, user.name);

   //to send email , can be time taken processs so write down after successfully registration
   await emailService.sendRegistrationEmail(user.email, user.name);

}

/**
 * User login controller
 ** POST /api/auth/login
 */
async function userLoginController(req, res) {
    console.log("LOGIN CONTROLLER HIT");
  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password")

  if (!user) {
    return res.status(401).json({
      message: "User email or password is INVALID"
    });
  }

  // ydi user mil jata h to compare kro kya password shi h
  const isValidPassword = await user.comparePassword(password);
   

  if (!isValidPassword) {
    return res.status(401).json({
      message: "User email or password is INVALID",
    });
  }

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRETS, {
    expiresIn: "3d",
  });

  // token is created store in cookie
  res.cookie("token", token);

  res.status(200).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token
  });
}

/**
 * POST /api/auth/logout
 */
async function userLogoutController(req, res) {

  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

  if(!token){
    return res.status(201).json({
      message: "User logged out successfully"
    });
  }

  // add token to blacklist
  await tokenBlacklistModel.create({
     token: token 
  })

  res.clearCookie("token")

  res.status(200).json({
     message: "User logged out successfully"
  })
}

module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController
};
