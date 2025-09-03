const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const { getCompany, saveCompany } = require("../controllers/companyController");

router.use(fileUpload());
router.get("/", getCompany);
router.post("/", saveCompany);

module.exports = router;
