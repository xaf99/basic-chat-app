const express = require("express");
const {
  loginUser,
  registerUser,
  updateUser,
} = require("../controllers/userController");
const { validateToken } = require("../middleware/validateTokenHandler");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/updateUser", validateToken, updateUser);

module.exports = router;
