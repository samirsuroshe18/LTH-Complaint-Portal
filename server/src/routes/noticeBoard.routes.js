import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createNotice, deleteNotice, getNotices, updateNotice } from "../controllers/noticeBoard.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.route('/create-notice').post(verifyJwt, verifyAdmin, upload.single("file"), createNotice);
router.route('/get-notices').get(getNotices);
router.route('/update-notice/:id').put(verifyJwt, verifyAdmin, upload.single("file"), updateNotice);
router.route('/delete-notice/:id').delete(verifyJwt, verifyAdmin, deleteNotice)

export default router;