export interface IUser {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  password: string | null;
  isEmailVerified: boolean;
  role: UserRole;
}

export type AdminPayload = Omit<IUser, "id" | "isEmailVerified" | "role"> & {
  password: string;
};

export enum UserRole {
  ADMIN = "admin",
  PATIENT = "patient",
  DOCTOR = "doctor",
}

export interface PatientPayload {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
  birthDate: string;
  sex: "male" | "female";
  weight?: number;
  height?: number;
  chronicDiseases?: string[];
  dailyMedication?: string;
}

export type UserLoginPayload = {
  email: string;
  password: string;
};

export type UserProfile = Omit<IUser, "password">;

export enum Sex {
  MALE = "male",
  FEMALE = "female",
}

export interface DoctorPayload {
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  specialty: string;
  hospitalName: string;
  hospitalAddress: string;
  city: string;
}

export interface DoctorUpdatePayload {
  firstName: string;
  lastName: string;
  middleName: string | null;
  specialty: string;
  city: string;
  hospitalName: string;
  hospitalAddress: string;
  isActive: boolean;
}
