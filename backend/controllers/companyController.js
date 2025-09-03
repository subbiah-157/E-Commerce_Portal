const Company = require("../models/CompanyDetails");
const path = require("path");
const fs = require("fs");

// Get company details
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findOne();
    res.status(200).json({ data: company || {} });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Save or update company details
exports.saveCompany = async (req, res) => {
  try {
    let data = { ...req.body };
    
    // Handle logo upload if present
    if (req.files?.logo) {
      const logoFile = req.files.logo;
      const uploadPath = path.join(__dirname, "../uploads/", logoFile.name);
      await logoFile.mv(uploadPath);
      data.logo = `/uploads/${logoFile.name}`;
    }

    let company = await Company.findOne();
    if (company) {
      company = await Company.findByIdAndUpdate(company._id, data, { new: true });
    } else {
      company = new Company(data);
      await company.save();
    }
    res.status(200).json({ data: company });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

 // Get company details (assuming single company)
router.get("/", async (req, res) => {
  try {
    const company = await Company.findOne(); // fetch first company
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

};
