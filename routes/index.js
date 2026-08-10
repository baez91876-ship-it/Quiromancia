import express from "express";
import usuariosRoutes from "./usuarios.routes.js";
import matricesNumerologicasRoutes from "./matricesNumerologicas.routes.js";
import promptsConfigRoutes from "./promptsConfig.routes.js";
import lecturasIARoutes from "./lecturasIA.routes.js";
import bitacoraTransaccionesRoutes from "./bitacoraTransacciones.routes.js";

const app = express();

app.use(express.json());
app.use("/usuarios", usuariosRoutes);
app.use("/matricesNumerologicas", matricesNumerologicasRoutes);
app.use("/promptsConfig", promptsConfigRoutes);
app.use("/lecturasIA", lecturasIARoutes);
app.use("/bitacoraTransacciones", bitacoraTransaccionesRoutes);

export default app;
