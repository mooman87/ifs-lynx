import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
  organization: {
  type: Schema.Types.ObjectId,
  ref: "Organization",
  required: true,
  index: true,
},
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, required: true },
  dob: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  address2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  email: { type: String, required: true },
  availableStart: { type: String, required: true },
  role: { type: String, required: true },
  reportsTo: { type: String, required: true },
  homeAirport: { type: String, required: true },
  altAirport: { type: String, required: true },
  assignedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
  doorsKnocked: { type: Number, default: 0 },
  doorsKnockedPerDay: {
    type: Map,
    of: Number,  
    default: {},
  },
  travel: { type: mongoose.Schema.Types.ObjectId, ref: 'Travel', default: null },
  contactsMadePerDay: {  
    type: Map,
    of: Number, 
    default: {},
  },
  rentalCarEligible: { type: Boolean, default: true },
}, { timestamps: true }
);

export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
