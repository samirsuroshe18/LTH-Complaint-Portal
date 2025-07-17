import { Router } from "express";
import { changeCurrentPassword, createSuperAdmin, forgotPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, updateFCMToken } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/login').post(loginUser);
router.route('/forgot-password').post(forgotPassword);
router.route('/create-admin').post(createSuperAdmin);

//Secure routes
router.route('/logout').get(verifyJwt, logoutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/update-fcm').post(verifyJwt, updateFCMToken);
router.route('/get-current-user').get(verifyJwt, getCurrentUser);
router.route('/change-password').post(verifyJwt, changeCurrentPassword);

export default router;