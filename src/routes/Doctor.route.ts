import { Router } from "express";
import { DoctorController } from "../controllers/DoctorController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { DoctorUpdatePayload, UserRole } from "../db/interfaces/IUser";
import { log } from "../utils/logger";
import { AUTH_COOKIE_OPTIONS } from "../services/user/constants";
import { Utils } from "../utils/utils";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
} from "../services/doctor/constants";

const DoctorRouter = Router();

DoctorRouter.post("/password", async (req, res) => {
  const { token, password } = req.body ?? {};

  if (
    typeof token !== "string" ||
    !token.trim() ||
    typeof password !== "string" ||
    !password.trim()
  ) {
    res.status(400).json({ error: "Token and password are required" });
    return;
  }

  try {
    const tokens = await DoctorController.setPassword(token, password);

    res.cookie("Authorization", tokens.accessToken, AUTH_COOKIE_OPTIONS);
    res.cookie("Refresh", tokens.refreshToken, AUTH_COOKIE_OPTIONS);
    res.status(200).json({ message: "Password set successfully" });
  } catch (error) {
    const message = (error as Error).message;
    log({
      type: "error",
      method: "DoctorRouter.post('/password')",
      info: { error: message },
    });

    res.status(400).json({ error: message });
  }
});

DoctorRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(UserRole.ADMIN),
  async (req, res) => {
    try {
      const doctor = await DoctorController.createDoctor(req.body);
      res.status(201).json(doctor);
    } catch (error) {
      log({
        type: "error",
        method: "DoctorRouter.post('/')",
        info: { error: (error as Error).message },
      });
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

DoctorRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(UserRole.ADMIN),
  async (req, res) => {
    try {
      const pageNumberQuery = req.query.PAGE_NUMBER;
      const pageSizeQuery = req.query.PAGE_SIZE;
      const pageNumber = pageNumberQuery
        ? Utils.parsePositiveInteger(pageNumberQuery)
        : DEFAULT_PAGE_NUMBER;
      const pageSize = pageSizeQuery
        ? Utils.parsePositiveInteger(pageSizeQuery)
        : DEFAULT_PAGE_SIZE;

      if (!pageNumber || !pageSize) {
        res.status(400).json({
          error:
            "PAGE_NUMBER and PAGE_SIZE must be positive integers when provided",
        });
        return;
      }

      const doctorsInfo = await DoctorController.getDoctors(
        pageNumber,
        pageSize
      );
      res.status(200).json(doctorsInfo);
    } catch (error) {
      log({
        type: "error",
        method: "DoctorRouter.get('/')",
        info: { error: (error as Error).message },
      });
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

DoctorRouter.put(
  "/:doctorId",
  authMiddleware,
  roleMiddleware(UserRole.ADMIN),
  async (req, res) => {
    try {
      const doctorId = Utils.parsePositiveInteger(req.params.doctorId);
      if (!doctorId) {
        throw new Error("doctorId must be a positive integer");
      }

      if (!Utils.isDoctorUpdatePayload(req.body)) {
        throw new Error("Payload is invalid");
      }

      const updatedDoctor = await DoctorController.updateDoctor(
        doctorId,
        req.body
      );
      res.status(200).json(updatedDoctor);
    } catch (error) {
      const message = (error as Error).message;
      log({
        type: "error",
        method: "DoctorRouter.put('/:doctorId')",
        info: { error: message },
      });
      res.status(400).json({ error: message });
    }
  }
);

DoctorRouter.get(
  "/hospital/:hospitalId",
  authMiddleware,
  roleMiddleware(UserRole.PATIENT),
  async (req, res) => {
    try {
      const hospitalId = Utils.parsePositiveInteger(req.params.hospitalId);
      if (!hospitalId) {
        throw new Error("hospitalId must be a positive integer");
      }

      const doctors = await DoctorController.getDoctorsByHospitalId(hospitalId);
      res.status(200).json({ doctors });
    } catch (err) {
      const message = (err as Error).message;
      log({
        type: "error",
        method: "DoctorRouter.get('/hospital/:hospitalId')",
        info: { error: message },
      });
      res.status(400).json({ error: message });
    }
  }
);

DoctorRouter.get(
  "/patients",
  authMiddleware,
  roleMiddleware(UserRole.DOCTOR),
  async (req, res) => {
    try {
      const doctorId = res.locals.user.id;

      const pageNumberQuery = req.query.PAGE_NUMBER;
      const pageSizeQuery = req.query.PAGE_SIZE;
      const pageNumber = pageNumberQuery
        ? Utils.parsePositiveInteger(pageNumberQuery)
        : DEFAULT_PAGE_NUMBER;
      const pageSize = pageSizeQuery
        ? Utils.parsePositiveInteger(pageSizeQuery)
        : DEFAULT_PAGE_SIZE;

      if (!pageNumber || !pageSize) {
        res.status(400).json({
          error:
            "PAGE_NUMBER and PAGE_SIZE must be positive integers when provided",
          patients: [],
        });
        return;
      }

      const result = await DoctorController.getPatients(
        doctorId,
        pageNumber,
        pageSize
      );
      res.status(200).json(result);
    } catch (err) {
      const message = (err as Error).message;
      log({
        type: "error",
        method: "DoctorRouter.get('/patients')",
        info: { error: message },
      });
      res.status(400).json({ error: message, patients: [], pagesCount: 0 });
    }
  }
);

export default DoctorRouter;
