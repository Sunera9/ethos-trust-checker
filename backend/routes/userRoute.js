const express = require("express");
const router = express.Router();
const { getUserInfo } = require("../controller/userController");

router.post("/get-user-info", getUserInfo);

module.exports = router;
