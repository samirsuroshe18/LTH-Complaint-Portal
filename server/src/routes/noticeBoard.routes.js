import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createNotice, deleteNotice, getNotices, updateNotice } from "../controllers/noticeBoard.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifySectorAdmin } from "../middlewares/sectoradmin.middleware.js";

const router = Router();

router.route('/create-notice').post(verifyJwt, verifySectorAdmin, upload.single("file"), createNotice);
router.route('/get-notices').get(getNotices);
router.route('/update-notice/:id').put(verifyJwt, verifySectorAdmin, upload.single("file"), updateNotice);
router.route('/delete-notice/:id').delete(verifyJwt, verifySectorAdmin, deleteNotice)

export default router;