import { fileURLToPath } from 'url';

const BASE_URL = process.argv[2] || process.env.API_URL || 'http://127.0.0.1:3000/api/v1';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const req = async (endpoint, method = 'GET', body = null, headers = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'secret123',
      ...headers,
    },
  };
  if (body !== null) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    return { status: res.status, ok: res.ok, data: parsed };
  } catch (err) {
    return { status: 0, ok: false, data: { error: err.message } };
  }
};

const runAttacks = async () => {
  console.log(`${colors.bright}${colors.cyan}=====================================================${colors.reset}`);
  console.log(`${colors.bright} EJECUTANDO LOS 14 ATAQUES CONTRA: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}=====================================================${colors.reset}\n`);

  let defendidos = 0;
  let vulnerables = 0;

  // SETUP: Crear recursos base para los ataques que los requieren
  const userSetup = await req('/usuarios', 'POST', {
    nombre: 'Usuario Base',
    email: `setup.${Date.now()}@example.com`,
    fechaNacimiento: '1995-05-15',
    genero: 'M',
    telefono: '3001234567',
    password: 'password123',
  });

  const setupUserId = userSetup.data?._id;

  const promptSetup = setupUserId
    ? await req('/promptsConfig', 'POST', {
        nombre: 'Prompt Base',
        prompt: 'Generar lectura',
        descripcion: 'Prompt de setup',
        categoria: 'general',
        tipo_lectura: 'general',
        creadoPor: setupUserId,
      })
    : null;

  const setupPromptId = promptSetup?.data?._id;

  if (setupUserId) {
    await req('/matricesNumerologicas', 'POST', {
      usuario_id: setupUserId,
      numeroVida: 7,
      numeroDestino: 3,
      descripcion: 'Matriz Base',
      resultado: 'Resultado Base',
    });
  }

  const printResult = (num, nombre, metodo, ruta, payload, response, esDefendido, nota) => {
    if (esDefendido) defendidos++;
    else vulnerables++;

    const veredictoStr = esDefendido
      ? `${colors.green}[DEFENDIDO]${colors.reset}`
      : `${colors.red}[VULNERABLE]${colors.reset}`;

    console.log(`${colors.bright}ATAQUE #${num} : ${nombre}${colors.reset}`);
    console.log(`Petición:    ${metodo} ${ruta}`);
    if (payload !== undefined) {
      const payloadStr = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
      console.log(`Body:        ${payloadStr.length > 80 ? payloadStr.substring(0, 80) + '...' : payloadStr}`);
    }
    console.log(`Respondió:   HTTP ${response.status} -> ${JSON.stringify(response.data).substring(0, 100)}`);
    console.log(`Veredicto:   ${veredictoStr}`);
    console.log(`Qué noté:    ${nota}\n-----------------------------------------------------\n`);
  };

  // 1. Falta lo obligatorio
  {
    const payload = { nombre: 'Carlos' };
    const res = await req('/usuarios', 'POST', payload);
    const defendido = res.status === 400;
    printResult(
      1,
      'Falta lo obligatorio',
      'POST',
      '/usuarios',
      payload,
      res,
      defendido,
      defendido ? 'Respondió 400 Bad Request por campos faltantes.' : 'Permitió guardar sin campos obligatorios.'
    );
  }

  // 2. Body totalmente vacío
  {
    const payload = {};
    const res = await req('/usuarios', 'POST', payload);
    const defendido = res.status === 400;
    printResult(
      2,
      'Body totalmente vacío',
      'POST',
      '/usuarios',
      payload,
      res,
      defendido,
      defendido ? 'Respondió 400 Bad Request.' : 'Respondió con error interno o creó objeto vacío.'
    );
  }

  // 3. Tipos cambiados
  {
    const payload = {
      nombre: 12345,
      email: 'no-es-un-email',
      fechaNacimiento: 'fecha-falsa',
      genero: 'M',
      telefono: '3001234567',
      password: '123',
    };
    const res = await req('/usuarios', 'POST', payload);
    const defendido = res.status === 400;
    printResult(
      3,
      'Tipos cambiados',
      'POST',
      '/usuarios',
      payload,
      res,
      defendido,
      defendido ? 'Rechazó tipos/formatos inválidos con 400.' : 'Aceptó tipos/formatos incorrectos.'
    );
  }

  // 4. Vacío disfrazado
  {
    const payload = {
      nombre: '   ',
      email: `espacios.${Date.now()}@example.com`,
      fechaNacimiento: '1990-01-01',
      genero: 'M',
      telefono: '3000000000',
      password: 'password123',
    };
    const res = await req('/usuarios', 'POST', payload);
    const defendido = res.status === 400;
    printResult(
      4,
      'Vacío disfrazado',
      'POST',
      '/usuarios',
      payload,
      res,
      defendido,
      defendido ? 'El trim() recortó y notEmpty() lo rechazó con 400.' : 'Guardó un nombre compuesto solo de espacios.'
    );
  }

  // 5. Valor inventado en un enum
  {
    const payload = {
      nombre: 'Pedro',
      email: `enum.${Date.now()}@example.com`,
      fechaNacimiento: '1990-01-01',
      genero: 'INVENTADO',
      telefono: '3000000000',
      password: 'password123',
    };
    const res = await req('/usuarios', 'POST', payload);
    const defendido = res.status === 400;
    printResult(
      5,
      'Valor inventado en enum',
      'POST',
      '/usuarios',
      payload,
      res,
      defendido,
      defendido ? 'El validador de enum rechaza valores no permitidos.' : 'Aceptó un valor fuera de la lista enum.'
    );
  }

  // 6. Texto gigante
  {
    const payload = {
      nombre: 'Prompt Gigante',
      prompt: 'A'.repeat(10000),
      descripcion: 'Descripción',
      categoria: 'general',
      tipo_lectura: 'general',
      creadoPor: setupUserId || '60d5ec49f1b2c81111111111',
    };
    const res = await req('/promptsConfig', 'POST', payload);
    const defendido = res.status === 400;
    printResult(
      6,
      'Texto gigante',
      'POST',
      '/promptsConfig',
      { ...payload, prompt: 'A... (10,000 chars)' },
      res,
      defendido,
      defendido ? 'Rechazó el texto por exceder la longitud máxima (400).' : 'Aceptó 10,000 caracteres sin límite.'
    );
  }

  // 7. Mass assignment (POST)
  {
    const payload = {
      nombre: 'User MassPost',
      email: `masspost.${Date.now()}@example.com`,
      fechaNacimiento: '1990-01-01',
      genero: 'M',
      telefono: '3000000000',
      password: 'password123',
      rol: 'admin',
      esAdministrador: true,
    };
    const res = await req('/usuarios', 'POST', payload);
    const defendido = res.status === 201 && !res.data?.rol && !res.data?.esAdministrador;
    printResult(
      7,
      'Mass assignment (POST)',
      'POST',
      '/usuarios',
      payload,
      res,
      defendido,
      defendido ? 'Ignoró los campos no permitidos (rol, esAdministrador).' : 'Guardó los campos no permitidos.'
    );
  }

  // 8. Mass assignment (PUT)
  {
    if (setupUserId) {
      const payload = { nombre: 'User MassPut', rol: 'admin', esAdministrador: true };
      const res = await req(`/usuarios/${setupUserId}`, 'PUT', payload);
      const defendido = res.status === 200 && !res.data?.rol && !res.data?.esAdministrador;
      printResult(
        8,
        'Mass assignment (PUT)',
        'PUT',
        `/usuarios/${setupUserId}`,
        payload,
        res,
        defendido,
        defendido ? 'Actualizó solo los campos permitidos.' : 'Inyectó campos no autorizados.'
      );
    }
  }

  // 9. Id que no es un id
  {
    const res = await req('/usuarios/123abc', 'GET');
    const defendido = res.status === 400;
    printResult(
      9,
      'Id que no es un id',
      'GET',
      '/usuarios/123abc',
      undefined,
      res,
      defendido,
      defendido ? 'El idValidator devolvió 400 por MongoId inválido.' : 'Surgió un CastError / 500 no controlado.'
    );
  }

  // 10. Id válido pero que no existe
  {
    const res = await req('/usuarios/60d5ec49f1b2c81111111111', 'GET');
    const defendido = res.status === 404;
    printResult(
      10,
      'Id válido que no existe',
      'GET',
      '/usuarios/60d5ec49f1b2c81111111111',
      undefined,
      res,
      defendido,
      defendido ? 'Retornó 404 Not Found explícito.' : 'Devolvió null con 200 u otro estado.'
    );
  }

  // 11. Método que no existe
  {
    const res = await req('/usuarios', 'DELETE');
    const defendido = res.status === 404;
    printResult(
      11,
      'Método que no existe',
      'DELETE',
      '/usuarios',
      undefined,
      res,
      defendido,
      defendido ? 'Express respondió 404 Not Found.' : 'Respondió un código inesperado.'
    );
  }

  // 12. Referencia a la nada
  {
    const payload = {
      usuario_id: '60d5ec49f1b2c81111111111',
      prompt_usado_id: '60d5ec49f1b2c82222222222',
      respuesta: 'Test',
      analisis: 'Test',
      metadata: { fuente: 'test' },
      resultado: 'Test',
    };
    const res = await req('/lecturasIA', 'POST', payload);
    const defendido = res.status === 400;
    printResult(
      12,
      'Referencia a la nada',
      'POST',
      '/lecturasIA',
      payload,
      res,
      defendido,
      defendido ? 'El validador de existencia rechazó IDs inexistentes con 400.' : 'Permitió guardar referencias huérfanas.'
    );
  }

  // 13. Borrar algo del que otros dependen
  {
    if (setupUserId && setupPromptId) {
      // Crear lectura para tener dependencia
      const lecturaCreated = await req('/lecturasIA', 'POST', {
        usuario_id: setupUserId,
        prompt_usado_id: setupPromptId,
        respuesta: 'Respuesta test',
        analisis: 'Analisis test',
        metadata: { fuente: 'test' },
        resultado: 'Resultado test',
      });

      // Intentar borrar usuario
      const res = await req(`/usuarios/${setupUserId}`, 'DELETE');
      const defendido = res.status === 400;
      printResult(
        13,
        'Borrar algo con dependencias',
        'DELETE',
        `/usuarios/${setupUserId}`,
        undefined,
        res,
        defendido,
        defendido ? 'Bloqueó la eliminación con 400 protegiendo la integridad.' : 'Permitió borrar el usuario dejando registros huérfanos.'
      );
    }
  }

  // 14. Actualizar solo un campo
  {
    if (setupUserId) {
      const payload = { nombre: 'Nombre Solo Parcial' };
      const res = await req(`/usuarios/${setupUserId}`, 'PUT', payload);
      const getRes = await req(`/usuarios/${setupUserId}`, 'GET');

      const defendido =
        res.status === 200 &&
        getRes.data?.nombre === 'Nombre Solo Parcial' &&
        !!getRes.data?.email &&
        !!getRes.data?.genero;

      printResult(
        14,
        'Actualizar solo un campo',
        'PUT',
        `/usuarios/${setupUserId}`,
        payload,
        res,
        defendido,
        defendido ? 'Mantuvo los otros 4 campos intactos tras actualizar uno sola.' : 'Borró o borró los otros campos.'
      );
    }
  }

  console.log(`${colors.bright}${colors.cyan}=====================================================${colors.reset}`);
  console.log(`${colors.bright} RESULTADO FINAL: ${defendidos} DEFENDIDOS / ${vulnerables} VULNERABLES${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}=====================================================${colors.reset}\n`);
};

runAttacks();