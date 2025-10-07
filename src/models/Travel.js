import mongoose from 'mongoose';

const TravelSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  flights: [{
    airline: String,
    flightNumber: String,
    departureDate: Date,
    returnDate: Date,
    status: { type: String, enum: ['Booked', 'Pending', 'Cancelled'], default: 'Pending' }
  }],
  hotel: {
    name: String,
    address: String,
    roomNumber: String,
    checkInDate: Date,
    checkOutDate: Date
  },
  rentalCar: {
    provider: String,
    makeAndModel: String, 
    licensePlate: String,
    pickUpDate: Date,
    dropOffDate: Date
  }
}, { timestamps: true });

export default mongoose.models.Travel || mongoose.model('Travel', TravelSchema);