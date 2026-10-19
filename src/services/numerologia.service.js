import { MatrizNumerologica } from "../../models/matricesNumerologicas.model.js";

export const reducirNumero = (valor) => {
  const numericValue = Number(valor);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  let total = Math.abs(Math.trunc(numericValue));

  while (total > 9) {
    total = String(total).split("").reduce((sum, digit) => sum + Number(digit), 0);
  }

  return total || 0;
};

export const calcularNumeroNombre = (nombre) => {
  const letras = (nombre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  if (!letras) {
    return 0;
  }

  const valor = [...letras].reduce((sum, letra) => {
    const codigo = letra.charCodeAt(0) - 64;
    return sum + codigo;
  }, 0);

  return reducirNumero(valor);
};

export const calcularNumeroDestino = (fechaNacimiento) => {
  const fecha = new Date(fechaNacimiento);

  if (Number.isNaN(fecha.getTime())) {
    return 0;
  }

  const valor = [
    fecha.getUTCDate(),
    fecha.getUTCMonth() + 1,
    fecha.getUTCFullYear(),
  ].join('');

  return reducirNumero(valor);
};

export const calcularPerfilNumerologico = ({ nombre, fechaNacimiento }) => {
  const numeroVida = calcularNumeroNombre(nombre);
  const numeroDestino = calcularNumeroDestino(fechaNacimiento);

  const descripcion = [
    'Este perfil refleja la energía personal y el propósito asociado al nombre y la fecha de nacimiento.',
    `Número de vida: ${numeroVida || 'No disponible'}.`,
    `Número de destino: ${numeroDestino || 'No disponible'}.`,
  ].join(' ');

  return {
    numeroVida: numeroVida || 0,
    numeroDestino: numeroDestino || 0,
    descripcion,
    resultado: {
      nombre,
      fechaNacimiento,
      numeroVida: numeroVida || 0,
      numeroDestino: numeroDestino || 0,
    },
  };
};

export const asegurarMatrizNumerologica = async (usuario) => {
  const matrizExistente = await MatrizNumerologica.findOne({ usuario_id: usuario._id });
  if (matrizExistente) {
    return matrizExistente;
  }

  const perfil = calcularPerfilNumerologico({
    nombre: usuario.nombre,
    fechaNacimiento: usuario.fechaNacimiento,
  });

  return MatrizNumerologica.create({
    usuario_id: usuario._id,
    ...perfil,
    resultado: JSON.stringify(perfil.resultado),
  });
};

export const actualizarMatrizNumerologica = async (usuario) => {
  const perfil = calcularPerfilNumerologico({
    nombre: usuario.nombre,
    fechaNacimiento: usuario.fechaNacimiento,
  });

  return MatrizNumerologica.findOneAndUpdate(
    { usuario_id: usuario._id },
    {
      ...perfil,
      resultado: JSON.stringify(perfil.resultado),
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
};
