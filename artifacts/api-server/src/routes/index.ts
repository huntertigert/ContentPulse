import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pagesRouter from "./pages";
import settingsRouter from "./settings";
import syncRouter from "./sync";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/pages", pagesRouter);
router.use("/settings", settingsRouter);
router.use("/sync", syncRouter);

export default router;
