const reducirNumero = (valor) => {
  let total = Number(valor) || 0;

  while (total > 9) {
    total = Array.from(String(total), Number).reduce((sum, digit) => sum + digit, 0);
  }

  return total || 0;
};

const calcularNumeroNombre = (nombre) => {
  const letras = (nombre || '').toUpperCase().replace(/[^A-Z]/g, '');

  if (!letras) {
    return 0;
  }

  const valor = [...letras].reduce((sum, letra) => {
    const codigo = letra.charCodeAt(0) - 64;
    return sum + codigo;
  }, 0);

  return reducirNumero(valor);
};

const calcularNumeroDestino = (fechaNacimiento) => {
  const fecha = new Date(fechaNacimiento);

  if (Number.isNaN(fecha.getTime())) {
    return 0;
  }

  const valor = [
    fecha.getDate(),
    fecha.getMonth() + 1,
    fecha.getFullYear(),
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

export default {
  calcularPerfilNumerologico,
};
