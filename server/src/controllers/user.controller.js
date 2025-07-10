import dotenv from "dotenv";
dotenv.config()
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import mailSender from '../utils/mailSender.js';
import { User } from '../models/user.model.js';

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        // when we use save() method is used then all the fields are neccesary so to avoid that we have to pass an object with property {validatBeforeSave:false}
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}

const createSuperAdmin = catchAsync(async (req, res, next) => {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if superadmin already exists
    const existingUser = await User.findOne({ email, role: 'superadmin' });

    if (existingUser) {
      return res.status(409).json({ message: "Superadmin with this email already exists." });
    }

    // Create user
    const superadmin = await User.create({
      userName,
      email,
      password,
      role: 'superadmin'
    });

    if (!superadmin) {
        throw new ApiError(500, "Failed to create superadmin");
    }

    return res.status(201).json(
        new ApiResponse(201, {}, "Superadmin created successfully")
    );
});

const loginUser = catchAsync(async (req, res) => {
    const { email, password, FCMToken, role } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findOne({ email, role });

    if (!user) {
        throw new ApiError(404, "Invalid credential");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credential");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    user.FCMToken = FCMToken;
    user.lastLogin = new Date();
    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    //option object is created beacause we dont want to modified the cookie to front side
    const option = {
        httpOnly: true,
        secure: true
    }

    const loggedInUser = {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        profileImage: user?.profileImage,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin
    }

    return res.status(200).cookie('accessToken', accessToken, option).cookie('refreshToken', refreshToken, option).json(
        new ApiResponse(200, {
            loggedInUser,
            accessToken,
            refreshToken
        }, "User logged in successfully")
    );
});

const logoutUser = catchAsync(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
                FCMToken: 1
            }
        },
        {
            new: true
        }
    );

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", option).clearCookie("refreshToken", option).json(
        new ApiResponse(200, {}, "User logged out")
    )
});

const getCurrentUser = catchAsync(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "Current user fetched successfully")
    );
});

const refreshAccessToken = catchAsync(async (req, res) => {
    try {
        const incomingRefreshToken = req.cookie?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken != user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const option = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        return res.status(200).clearCookie("accessToken", accessToken, option).clearCookie("refreshToken", refreshToken, option).json(
            new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed")
        );
    } catch (error) {
        throw new ApiError(401, "Something went wrong : Invalid refresh token");
    }
});

const updateFCMToken = catchAsync(async (req, res) => {
    const { FCMToken } = req.body;
    if (!FCMToken) {
        throw new ApiError(400, "FCM Token is required");
    }
    const user = req.user;
    user.FCMToken = FCMToken;
    const isUpdate = await user.save({ validateBeforeSave: false });
    if (!isUpdate) {
        throw new ApiError(500, "Something went wrong");
    }
    return res.status(200).json(
        new ApiResponse(200, {}, "FCM Token updated successfully")
    );
});

const changeCurrentPassword = catchAsync(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

const forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "Invalid email or email is not verified");
    }

    const mailResponse = await mailSender(email, "RESET", undefined, user._id);

    if (mailResponse) {
        return res.status(200).json(
            new ApiResponse(200, {}, "An email sent to your account please reset your password in 10 minutes")
        );
    }

    throw new ApiError(500, "Something went wrong!! An email couldn't sent to your account");
});

export {
    createSuperAdmin,
    loginUser,
    logoutUser,
    getCurrentUser,
    refreshAccessToken,
    updateFCMToken,
    changeCurrentPassword,
    forgotPassword
};
