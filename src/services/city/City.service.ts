import { AppDataSource } from "../../db/data-source";
import { City } from "../../db/entities/City";
import { DoctorDetails } from "../../db/entities/DoctorDetails";
import { Hospital } from "../../db/entities/Hospital";
import { ICity, IHospital } from "./interfaces";

const cityRepo = AppDataSource.getRepository(City);
const hospitalRepo = AppDataSource.getRepository(Hospital);

export class CityService {
  public static async getCities(): Promise<ICity[]> {
    const cities = await cityRepo
      .createQueryBuilder("city")
      .innerJoin(
        DoctorDetails,
        "doctorDetails",
        "doctorDetails.cityId = city.id AND doctorDetails.isActive = :isActive",
        { isActive: true }
      )
      .select(["city.id AS id", "city.name AS name"])
      .distinct(true)
      .orderBy("city.name", "ASC")
      .getRawMany();

    return cities;
  }

  public static async getHospitalsByCityId(
    cityId: number
  ): Promise<IHospital[]> {
    const hospitals = await hospitalRepo
      .createQueryBuilder("hospital")
      .innerJoin(
        DoctorDetails,
        "doctorDetails",
        `doctorDetails.hospitalId = hospital.id
         AND doctorDetails.cityId = :cityId
         AND doctorDetails.isActive = true`,
        { cityId }
      )
      .select([
        "hospital.id AS id",
        "hospital.name AS name",
        "hospital.address AS address",
      ])
      .distinct(true)
      .orderBy("hospital.name", "ASC")
      .getRawMany();

    return hospitals;
  }
}
