import express from "express";
import usuariosRoutes from "./usuarios.routes.js";
import matricesNumerologicasRoutes from "./matricesNumerologicas.routes.js";
import promptsConfigRoutes from "./promptsConfig.routes.js";
import lecturasIARoutes from "./lecturasIA.routes.js";
import bitacoraTransaccionesRoutes from "./bitacoraTransacciones.routes.js";

const app = express();

app.use(express.json());
app.use("/api/v1/usuarios", usuariosRoutes);
app.use("/api/v1/matricesNumerologicas", matricesNumerologicasRoutes);
app.use("/api/v1/promptsConfig", promptsConfigRoutes);
app.use("/api/v1/lecturasIA", lecturasIARoutes);
app.use("/api/v1/bitacoraTransacciones", bitacoraTransaccionesRoutes);

export default app;
