const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const dotenv = require("dotenv").config();
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

//@desc Register User
//route POST /api/users/register
//@access public

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    res.status(400);
    throw new Error("All fields are mandotary");
  }
  const userAvailable = await User.findOne({ email });
  if (userAvailable) {
    res.status(400);
    throw new Error("User already exist");
  }
  //Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);
  const customer = await stripe.customers.create({
    email: email,
    description: fullName,
  });
  const payment = await Payment.create({
    customerId: customer.id,
  });
  const user = await User.create({
    fullName,
    email,
    password: hashedPassword,
    paymentId: payment._id,
  });
  if (user) {
    res.status(201).json({
      message: "User Registered Please Login",
    });
  } else {
    res.status(400);
    throw new Error("User Data is not valid");
  }
});

//@desc Login User
//route POST /api/users/current
//@access public

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(401).json({ message: "All fields are mandotary" });
  }
  const user = await User.findOne({ email }).populate("paymentId");
  if (user && bcrypt.compare(password, user.password)) {
    const accessToken = jwt.sign(
      {
        user: {
          id: user._id,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.EXPIRES_IN }
    );
    user.password = null;
    res.status(200).json({ user, accessToken, message: "Logged in" });
  } else {
    res.status(401);
    throw new Error("Email or password not valid!");
  }
});

//@desc Update User Information
//route PUT /api/users/updateUser
//@access private

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { fullName } = req.body;
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const updatedUser = await User.findByIdAndUpdate(req.user._id, fullName, {
    new: true,
  });
  res.status(200).json(updatedUser);
});

// // create reusable transporter object using the default SMTP transport
// let transporter = nodemailer.createTransport({
//   host: "smtp.ethereal.email",
//   port: 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: testAccount.user, // generated ethereal user
//     pass: testAccount.pass, // generated ethereal password
//   },
// });

// // send mail with defined transport object
// let info = await transporter.sendMail({
//   from: '"Fred Foo 👻" <foo@example.com>', // sender address
//   to: "bar@example.com, baz@example.com", // list of receivers
//   subject: "Hello ✔", // Subject line
//   text: "Hello world?", // plain text body
//   html: "<b>Hello world?</b>", // html body
// });

// var nodemailer = require('nodemailer');
// var smtpTransport = require('nodemailer-smtp-transport');

// var transporter = nodemailer.createTransport(smtpTransport({
//   service: 'gmail',
//   host: 'smtp.gmail.com',
//   auth: {
//     user: 'somerealemail@gmail.com',
//     pass: 'realpasswordforaboveaccount'
//   }
// }));

// var mailOptions = {
//   from: 'somerealemail@gmail.com',
//   to: 'friendsgmailacc@gmail.com',
//   subject: 'Sending Email using Node.js[nodemailer]',
//   text: 'That was easy!'
// };

// transporter.sendMail(mailOptions, function(error, info){
//   if (error) {
//     console.log(error);
//   } else {
//     console.log('Email sent: ' + info.response);
//   }
// });

module.exports = { loginUser, registerUser, updateUser };
