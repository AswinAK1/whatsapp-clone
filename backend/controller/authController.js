import jwt from 'jsonwebtoken';
import generateOtp from "../middleware/nodeMailer.js";
import User from "../model/useModel.js";
import generateToken from "../utils/generateToken.js";
import path from 'path';
import bcrypt from "bcryptjs";





const signUp = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, password } = req.body;

    const userEmail = await User.findOne({ email });

    if (userEmail) {
      return res.json({ success: false, error: "This Email already registered" });
    }

    // Generate OTP
    const otp = generateOtp(email);

    console.log("Generated OTP before JWT:", otp);  // Debugging step

    const numericOtp = Number(otp);
    console.log("Numeric OTP after conversion:", numericOtp);  // Debugging

    // Store OTP in JWT
    const otpToken = jwt.sign(
      { email, otp:numericOtp, fullName, phoneNumber, password },  // Include user data
      process.env.JWT_SECRET_KEY,
      { expiresIn: "5m" }  // OTP expires in 5 minutes
    );

    console.log("Generated OTP Token:", otpToken);  // Debugging step

    res.json({
      success: true,
      message: "OTP sent to your email. Please verify.",
      otpToken
    });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Some error occurred in Signup" });
  }
};




const verifyOtp = async (req, res) => {
  try {
    const { otp, otpToken } = req.body;

    // Verify the token
    const decoded = jwt.verify(otpToken, process.env.JWT_SECRET_KEY);
    
    console.log("Decoded OTP:", decoded.otp);
    console.log("Entered OTP:", otp);

    // Check if OTP matches
    if (Number(decoded.otp) !== Number(otp)) {
      return res.status(400).json({ success: false, message: "Incorrect OTP" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(decoded.password, 10);

    // Generate profile picture
    const randomProfilePic = `https://avatar.iran.liara.run/public?fullName=${decoded.fullName}`;

    // Save user in database
    const newUser = new User({
      fullName: decoded.fullName,
      phoneNumber: decoded.phoneNumber,
      email: decoded.email,
      password: hashedPassword,
      profilePic: randomProfilePic,
    });

    await newUser.save();

    // Generate authentication token
    generateToken(newUser._id, res);

    res.json({
      success: true,
      message: "Signup successful.",
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      phoneNumber: newUser.phoneNumber,
      profilePic: newUser.profilePic,
      about:newUser.about
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Some error occurred in OTP verification" });
  }
};





const login = async(req,res) =>{
  const {email,password} = req.body
  try {
    const user = await User.findOne({email})
    if(!user){
      return res.status(404).json({error:"User not found"})
    }
    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch){
      return res.status(400).json({error:"Invalid credentials"})
    }

    const token = await generateToken(user._id, res);
    console.log("Generated Token:", token);


    res.json({
      success:true,
      message:"Login successfully..",
      token,
      _id:user._id,
      fullName:user.fullName,
      email:user.email,
      phoneNumber:user.phoneNumber,
      profilePic:user.profilePic,
      about:user.about,
      lastSeen:user.lastSeen,
      staredMessages:user.staredMessages
    })
    
  } catch (error) {
    console.log(error);
    res.json({success:false,message:"Some error occur in Login"})
  }
}




const logout = async(req,res)=>{
  try {
    res.cookie("jwt","",{maxAge:0})
    res.status(200).json({success:true,message:"Logout successfully..."})
  } catch (error) {
    console.log(error);
    res.json({success:false,message:"Error"})
  }
}


const editUser = async(req,res) =>{
  try {
    const userId = req.params.id;
    const {fullName, about} = req.body;

    const user = await User.findById(userId)
    if(!user){
      res.status(404).json({success:false,message:"User not found"})
    }

    if(fullName) user.fullName = fullName;
    if(about) user.about = about;

    if(req.file){
      if (req.file) {
        user.profilePic = req.file.path.replace(/\\/g, '/');
      }
      
    }
    await user.save()

    res.json({success:true,user})

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error updating user" });
  }
}


const resentOtp = async (req, res) => {
  try {
    const { otpToken } = req.body;

    if (!otpToken) {
      return res.status(400).json({ success: false, message: "OTP Token is required" });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(otpToken, process.env.JWT_SECRET_KEY);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        console.log("OTP Token Expired. Generating new OTP.");
      } else {
        return res.status(400).json({ success: false, message: "Invalid OTP Token" });
      }
    }

    // Generate a new OTP
    const otp = generateOtp(decoded.email);

    console.log("New OTP Generated:", otp);

    // Store new OTP in JWT
    const newOtpToken = jwt.sign(
      {
        email: decoded.email,
        otp: Number(otp),
        fullName: decoded.fullName,
        phoneNumber: decoded.phoneNumber,
        password: decoded.password,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "5m" }
    );

    res.json({
      success: true,
      message: "OTP resent to your email.",
      otpToken: newOtpToken,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error occurred while resending OTP" });
  }
};





export { editUser, login, logout, signUp, verifyOtp, resentOtp };

