import { CityService } from "../services/city/City.service";
import { ICity, IHospital } from "../services/city/interfaces";

export class CityController {
  public static async getCities(): Promise<ICity[]> {
    const cities = await CityService.getCities();
    return cities;
  }

  public static async getHospitalsByCityId(cityId: number): Promise<IHospital[]> {
    const hospitals = await CityService.getHospitalsByCityId(cityId);
    return hospitals;
  }
}
