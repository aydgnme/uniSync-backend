import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema({
    key: {type: String},
    isActive: {type: Boolean, default: true},
    createdAt: {type: Date, default: Date.now},
});

const ApiKey = mongoose.model("ApiKey", apiKeySchema);

export default ApiKey;