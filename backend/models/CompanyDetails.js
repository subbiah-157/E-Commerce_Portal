const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: String,
    type: String,
    registrationNumber: String,
    about: String,
    mission: String,
    vision: String,
    street: String,
    city: String,
    district: String,
    state: String,
    postalCode: String,
    country: String,
    email: String,
    phone: String,
    whatsapp: String,
    website: String,
    facebook: String,
    twitter: String,
    instagram: String,
    youtube: String, // added YouTube since you used in React
    bankName: String,
    accountNumber: String,
    ifsc: String,
    swift: String,
    taxNumber: String,
    logo: String, // store filename or URL
  },
  { timestamps: true }
);

// ✅ Virtual field to combine address parts
companySchema.virtual("address").get(function () {
  return [
    this.street,
    this.city,
    this.district,
    this.state,
    this.postalCode,
    this.country,
  ]
    .filter(Boolean) // remove empty values
    .join(", ");
});

// ✅ Ensure virtuals show up in JSON output
companySchema.set("toJSON", { virtuals: true });
companySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Company", companySchema);
