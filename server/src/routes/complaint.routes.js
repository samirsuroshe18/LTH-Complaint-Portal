import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { getComplaints, submitComplaint } from "../controllers/complaint.controller.js";

const router = Router();

router.route('/submit').post(upload.single("file"), submitComplaint);
router.route('/get-complaints').get(getComplaints);

export default router;