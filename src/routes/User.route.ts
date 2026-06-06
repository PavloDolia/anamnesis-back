import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { AUTH_COOKIE_OPTIONS } from "../services/user/constants";
import { log } from "../utils/logger";
import { internalApiMiddleware } from "../middlewares/internalApiMiddleware";

const UserRouter = Router();

UserRouter.post("/signup", async (req, res) => {
  try {
    const { user, accessToken, refreshToken } =
      await UserController.createPatientUser(req.body);
    res.cookie("Authorization", accessToken, AUTH_COOKIE_OPTIONS);
    res.cookie("Refresh", refreshToken, AUTH_COOKIE_OPTIONS);
    res.status(201).json(user);
  } catch (error) {
    log({
      type: "error",
      method: "UserRouter.post('/signup')",
      info: { error: (error as Error).message },
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

UserRouter.post("/login", async (req, res) => {
  try {
    const tokens = await UserController.loginUser(req.body);
    if (!tokens) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    res.cookie("Authorization", tokens.accessToken, AUTH_COOKIE_OPTIONS);
    res.cookie("Refresh", tokens.refreshToken, AUTH_COOKIE_OPTIONS);
    res.status(200).json({ message: "Login successful" });
  } catch (error) {
    log({
      type: "error",
      method: "UserRouter.post('/login')",
      info: { error: (error as Error).message },
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

UserRouter.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.Refresh as string | undefined;
    if (!refreshToken) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const tokens = await UserController.refreshUserToken(
      refreshToken,
      req.cookies.Authorization
    );
    if (!tokens) {
      res.clearCookie("Authorization", AUTH_COOKIE_OPTIONS);
      res.clearCookie("Refresh", AUTH_COOKIE_OPTIONS);
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.cookie("Authorization", tokens.accessToken, AUTH_COOKIE_OPTIONS);
    res.cookie("Refresh", tokens.refreshToken, AUTH_COOKIE_OPTIONS);
    res.status(200).json({ message: "Token refreshed" });
  } catch (error) {
    log({
      type: "error",
      method: "UserRouter.post('/refresh')",
      info: { error: (error as Error).message },
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

UserRouter.post("/logout", async (req, res) => {
  try {
    const accessToken = req.cookies?.Authorization as string | undefined;
    const refreshToken = req.cookies?.Refresh as string | undefined;
    const tokensToRevoke = [accessToken, refreshToken].filter(
      (token): token is string => Boolean(token)
    );

    if (tokensToRevoke.length > 0) {
      await UserController.logoutUser(tokensToRevoke);
    }

    res.clearCookie("Authorization", AUTH_COOKIE_OPTIONS);
    res.clearCookie("Refresh", AUTH_COOKIE_OPTIONS);
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    log({
      type: "error",
      method: "UserRouter.post('/logout')",
      info: { error: (error as Error).message },
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

UserRouter.get("/profile", authMiddleware, async (_, res) => {
  res.status(200).json(res.locals.user);
});

UserRouter.get("/verify-email", async (req, res) => {
  try {
    const token = req.query.token;
    if (typeof token !== "string" || !token.trim()) {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    await UserController.verifyEmail(token);

    res.redirect(process.env.FRONTEND_URL!);
  } catch (error) {
    const message = (error as Error).message;
    log({
      type: "error",
      method: "UserRouter.get('/verify-email')",
      info: { error: message },
    });
    res.status(400).json({ error: message });
  }
});

UserRouter.post("/admin", internalApiMiddleware, async (req, res) => {
  try {
    const user = await UserController.createAdminUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    log({
      type: "error",
      method: "UserRouter.post('/admin')",
      info: { error: (error as Error).message },
    });
    res.status(500).json({ error: (error as Error).message });
  }
});

export default UserRouter;
