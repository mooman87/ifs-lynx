import mongoose from 'mongoose';

const HotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  checkInDate: { type: String, required: true },
  checkOutDate: { type: String, required: true }
});

const SurveySchema = new mongoose.Schema({
  introduction: { type: String, default: "" },
  questions: [
    {
      questionText: { type: String, required: true },
      responses: [{ type: String, required: true }]
    }
  ],
  closeMessage: { type: String, default: "" }
});

const ProjectSchema = new mongoose.Schema({
  campaignName: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  doorCount: { type: Number },
  doorsRemaining: { type: Number, required: true },
  totalDoorsKnocked: { type: Number, default: 0 },
  dailyStaffNeeded: { type: Map, of: Number, default: {} },
  stateDirector: { type: String, required: true },
  managerHotel: { type: HotelSchema, required: false },
  staffHotel: { type: HotelSchema, required: false },
  assignedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  schedule: [
    {
      date: String, 
      employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    },
  ],
  survey: { type: SurveySchema, default: {} }
}, { timestamps: true });

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);


