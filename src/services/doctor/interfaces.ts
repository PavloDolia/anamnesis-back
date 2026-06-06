export interface DoctorListRawItem {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  specialty: string;
  isActive: boolean | number | string;
  hospitalName: string;
  hospitalAddress: string;
  city: string;
}

export interface DoctorListItem {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  specialty: string;
  isActive: boolean;
  hospitalName: string;
  hospitalAddress: string;
  city: string;
}

export interface GetDoctorsResponse {
  doctors: DoctorListItem[];
  pagesCount: number;
}

export interface DoctorByHospitalItem {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  specialty: string;
}

export interface PatientListItem {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  address: string;
  phoneNumber: string;
  date: string;
}

export interface GetPatientsResponse {
  patients: PatientListItem[];
  pagesCount: number;
}
