import { Router } from "express";
import { createSuperAdmin, getCurrentUser, loginUser, logoutUser, refreshAccessToken, updateFCMToken } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/login').post(loginUser);

//Secure routes
router.route('/create-admin').post(createSuperAdmin);
router.route('/logout').get(verifyJwt, logoutUser);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/update-fcm').post(verifyJwt, updateFCMToken);
router.route('/get-current-user').get(verifyJwt, getCurrentUser);

export default router;