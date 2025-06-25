import mongoose from 'mongoose'

const AddressInfoSchema = new mongoose.Schema(
    {
        fullAddress: {
            type: String,
            required: true,
            index: true,
        },
        city: {
            type: String,
            required: true,
        },
        street: {
            type: String,
            required: true,
        },
        building: {
            type: Number,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        mark: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

export default mongoose.model('AddressInfo', AddressInfoSchema)
