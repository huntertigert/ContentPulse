import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pagesRouter from "./pages";
import settingsRouter from "./settings";
import syncRouter from "./sync";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/pages", requireAuth, pagesRouter);
router.use("/settings", requireAuth, settingsRouter);
router.use("/sync", requireAuth, syncRouter);

export default router;
