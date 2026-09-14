const MASTER_NUMBERS = new Set([11, 22, 33]);

export const reducirNumero = (value) => {
    const digits = String(value).replace(/\D/g, "");
    if (!digits) {
        throw new Error("El valor debe contener al menos un número");
    }

    let number = Number(digits);
    while (number > 9 && !MASTER_NUMBERS.has(number)) {
        number = String(number)
            .split("")
            .reduce((total, digit) => total + Number(digit), 0);
    }
    return number;
};

export const sumarFechaNacimiento = (fechaNacimiento) => {
    const normalized = new Date(fechaNacimiento);
    if (Number.isNaN(normalized.getTime())) {
        throw new Error("La fecha de nacimiento no es válida");
    }

    const isoDate = normalized.toISOString().slice(0, 10).replace(/-/g, "");
    return reducirNumero(isoDate);
};

export const sumarNombre = (nombre) => {
    const normalized = String(nombre)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");

    if (!normalized) {
        throw new Error("El nombre debe contener letras");
    }

    const total = [...normalized].reduce((sum, letter) => sum + letter.charCodeAt(0) - 96, 0);
    return reducirNumero(total);
};

export const calcularPerfilNumerologico = ({ nombre, fechaNacimiento }) => ({
    numeroVida: sumarFechaNacimiento(fechaNacimiento),
    numeroDestino: sumarNombre(nombre),
});
