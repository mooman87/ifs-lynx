import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: [
      'Canvasser',
      'Field Director',
      'Deputy State Director',
      'State Director',
      'Political Director',
      'C Suite',
      'HR',
      'Payroll',
      'Travel',
      'Super Admin'
    ],
    default: 'Canvasser'
  },
      organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      // required: true, 
      },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
