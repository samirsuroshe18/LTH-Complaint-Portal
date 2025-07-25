import dotenv from "dotenv";
dotenv.config()
import express from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";
import initializeFirebaseAdmin from "./utils/firebaseAdminSdk.js";
import { errorHandler } from "./utils/errorHandler.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const app = express();
initializeFirebaseAdmin();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const staticPath = path.join(__dirname, '../public');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));

// this use for cross origin sharing 
app.use(
  cors({
      origin: process.env.CORS_ORIGIN, // Allow frontend origin
      methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
      allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
      credentials: true, // Allow cookies/auth headers if needed
  })
);
// this middleware use for parsing the json data
app.use(express.json());
// this is used for parsing url data extended is used for nessted object
app.use(express.urlencoded({ extended: true }));
// this is used for accessing public resources from server
app.use(express.static(staticPath));
// this is used to parse the cookie
app.use(cookieParser());

// routes import
import userRouter from './routes/user.routes.js';
import verifyRouter from './routes/verify.routes.js';
import complaintRouter from './routes/complaint.routes.js';
import adminRouter from './routes/admin.routes.js';
import sectorAdminRouter from './routes/sectoradmin.routes.js';
import technicianRouter from './routes/technician.routes.js';
import noticeBoardRouter from './routes/noticeBoard.routes.js';

//Routes declaration
app.use("/api/v1/user", userRouter);
app.use("/api/v1/verify", verifyRouter);
app.use("/api/v1/complaint", complaintRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/sectoradmin", sectorAdminRouter);
app.use("/api/v1/technician", technicianRouter);
app.use("/api/v1/notice", noticeBoardRouter);

// Custom error handeling
app.use(errorHandler)

export default app