import mongoose from 'mongoose'

const accessDataSchema = new mongoose.Schema({
  userId: Number,
  nickname: String,
  currentDate: Date,
})

const AccessData = mongoose.model('AccessData', accessDataSchema)

export default AccessData