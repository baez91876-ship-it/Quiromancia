import express from "express";
import usuariosRoutes from "./usuarios.routes.js";
import matricesNumerologicasRoutes from "./matricesNumerologicas.routes.js";
import promptsConfigRoutes from "./promptsConfig.routes.js";
import lecturasIARoutes from "./lecturasIA.routes.js";
import bitacoraTransaccionesRoutes from "./bitacoraTransacciones.routes.js";

const router = express.Router();

router.use(express.json());
router.use("/usuarios", usuariosRoutes);
router.use("/matricesNumerologicas", matricesNumerologicasRoutes);
router.use("/promptsConfig", promptsConfigRoutes);
router.use("/lecturasIA", lecturasIARoutes);
router.use("/bitacoraTransacciones", bitacoraTransaccionesRoutes);

export default router;
