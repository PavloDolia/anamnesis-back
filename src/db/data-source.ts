import { DataSource } from "typeorm";
import winston from "winston";

import { Chat } from "./entities/Chat";
import { ChatMessage } from "./entities/ChatMessage";
import { City } from "./entities/City";
import { DoctorDetails } from "./entities/DoctorDetails";
import { Hospital } from "./entities/Hospital";
import { InvalidJwtToken } from "./entities/InvalidJwtToken";
import { PatientAnamnesis } from "./entities/PatientAnamnesis";
import { PatientDiseaseXref } from "./entities/PatientDiseaseXref";
import { PatientDetails } from "./entities/PatientDetails";
import { User } from "./entities/User";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: ["error", "warn", "query"],
  entities: [
    User,
    PatientDetails,
    PatientAnamnesis,
    PatientDiseaseXref,
    DoctorDetails,
    Chat,
    ChatMessage,
    City,
    Hospital,
    InvalidJwtToken,
  ],
  subscribers: [],
  migrations: ["src/db/migrations/**/*.ts"],
});

export const connectToDatabase = async (): Promise<void> => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    console.log("Database connection established successfully");
  } catch (err) {
    console.error("Error connecting to database", err);
    process.exit(1);
  }
};
