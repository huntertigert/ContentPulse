import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pagesRouter from "./pages";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/pages", pagesRouter);

export default router;
