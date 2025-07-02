import catchAsync from "../utils/catchAsync.js";
import ApiError from "../utils/ApiError.js";

const verifyAdmin = catchAsync(async (req, _, next) => {
    try {
        if (req.user.role !== 'superadmin') {
            throw new ApiError(401, "You are not admin.");
        }

        req.admin = req.user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Access denied");
    }
});

export { verifyAdmin };