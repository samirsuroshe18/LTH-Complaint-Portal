import {Router} from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addComplaintResolution, getAssignedComplaints, getTechnicianDetails } from "../controllers/technician.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route('/get-assigned-complaints').get(verifyJwt, getAssignedComplaints);
router.route('/get-technician-details').post(verifyJwt, getTechnicianDetails);
router.route('/add-complaint-resolution').post(verifyJwt, upload.single('file'), addComplaintResolution);

export default router;