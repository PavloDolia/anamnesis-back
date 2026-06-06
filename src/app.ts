import dotenv from "dotenv";
dotenv.config({ override: true, quiet: true });
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectToDatabase } from "./db/data-source";
import { Utils } from "./utils/utils";
import ChatRouter from "./routes/Chat.route";
import UserRouter from "./routes/User.route";
import DoctorRouter from "./routes/Doctor.route";
import CityRouter from "./routes/City.route";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:8100",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/user", UserRouter);
app.use("/chat", ChatRouter);
app.use("/doctors", DoctorRouter);
app.use("/city", CityRouter);

const startServer = async (): Promise<void> => {
  await connectToDatabase();
  Utils.startInvalidJwtTokensCleanup();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
