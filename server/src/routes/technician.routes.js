import {Router} from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addComplaintResolution, getAssignedComplaints, getTechnicianDetails, startWorkingOnComplaint } from "../controllers/technician.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyTechnician } from "../middlewares/technician.middleware.js";

const router = Router();

router.route('/get-assigned-complaints').get(verifyJwt, verifyTechnician, getAssignedComplaints);
router.route('/get-technician-details').post(verifyJwt, verifyTechnician, getTechnicianDetails);
router.route('/add-complaint-resolution').post(verifyJwt, verifyTechnician, upload.single('file'), addComplaintResolution);
router.route('/start-work/:id').get(verifyJwt, verifyTechnician, startWorkingOnComplaint);

export default router;