import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";

const verifyJwt = catchAsync(async (req, _, next) => {
    const token = req.cookie?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token || token === "null" || token === "undefined") {
        throw new ApiError(401, "Unauthorised request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken -__v -FCMToken -isGoogleVerified -isVerified");

    if (!user) {
        throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
})

export { verifyJwt };