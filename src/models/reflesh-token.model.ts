import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  token: "string",
  userId: "string",
  expiresAt: "date",
});
const refreshToken = mongoose.model("refreshToken", refreshTokenSchema);
export default refreshToken;