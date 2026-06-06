import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../db/interfaces/IUser";
import { log } from "../utils/logger";
import { CityController } from "../controllers/CityController";
import { Utils } from "../utils/utils";

const CityRouter = Router();

CityRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(UserRole.PATIENT),
  async (_, res) => {
    try {
      const cities = await CityController.getCities();
      res.status(200).json({ cities });
    } catch (err) {
      log({
        type: "error",
        method: "CityRouter.get('/')",
        info: { error: (err as Error).message },
      });
      res.status(500).json({
        cities: [],
        error: "Internal server error",
      });
    }
  }
);

CityRouter.get(
  "/:cityId/hospitals",
  authMiddleware,
  roleMiddleware(UserRole.PATIENT),
  async (req, res) => {
    try {
      const cityId = Utils.parsePositiveInteger(req.params.cityId);
      if (!cityId) {
        res.status(400).json({
          error: "cityId must be a positive integer",
        });
        return;
      }

      const hospitals = await CityController.getHospitalsByCityId(cityId);
      res.status(200).json({ hospitals });
    } catch (err) {
      log({
        type: "error",
        method: "CityRouter.get('/:cityId/hospitals')",
        info: { error: (err as Error).message },
      });
      res.status(500).json({
        hospitals: [],
        error: "Internal server error",
      });
    }
  }
);

export default CityRouter;
