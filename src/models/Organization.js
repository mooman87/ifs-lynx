import mongoose from "mongoose";

const { Schema } = mongoose;

const OrganizationSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    settings: {
      orgType: {type: String, enum: [
        "Vendor",
        "Campaign",
        "PAC",
        "Party"
      ]},
      timezone: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Organization ||
  mongoose.model("Organization", OrganizationSchema);
