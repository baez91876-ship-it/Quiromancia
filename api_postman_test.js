const base = 'http://127.0.0.1:3000/api/v1';
const json = (obj) => JSON.stringify(obj, null, 2);
const r = async (url, opts) => {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, ok: res.ok, body };
};

const run = async () => {
  console.log('CREATE USER');
  const user = await r(`${base}/usuarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: 'Test Usuario',
      email: `test.${Math.random().toString(36).substring(2, 10)}@example.com`,
      fechaNacimiento: '1990-01-01',
      genero: 'M',
      telefono: '5551234567',
    }),
  });
  console.log(json(user));
  if (!user.ok) throw new Error('Create user failed: ' + JSON.stringify(user.body));
  const userId = user.body._id;

  console.log('CREATE PROMPT');
  const prompt = await r(`${base}/promptsConfig`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: 'Prompt prueba',
      prompt: 'Generar lectura numerológica',
      descripcion: 'Prompt de prueba',
      categoria: 'numerologia',
      creadoPor: userId,
    }),
  });
  console.log(json(prompt));
  if (!prompt.ok) throw new Error('Create prompt failed: ' + JSON.stringify(prompt.body));
  const promptId = prompt.body._id;

  console.log('CREATE MATRIZ');
  const matriz = await r(`${base}/matricesNumerologicas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario_id: userId,
      numeroVida: 5,
      numeroDestino: 7,
      descripcion: 'Descripcion prueba',
      resultado: 'Resultado prueba',
    }),
  });
  console.log(json(matriz));
  if (!matriz.ok) throw new Error('Create matriz failed: ' + JSON.stringify(matriz.body));
  const matrizId = matriz.body._id;

  console.log('CREATE LECTURA');
  const lectura = await r(`${base}/lecturasIA`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario_id: userId,
      prompt_usado_id: promptId,
      respuesta: 'Respuesta de prueba',
      analisis: 'Analisis de prueba',
      metadata: { fuente: 'terminal' },
      resultado: 'Exito',
    }),
  });
  console.log(json(lectura));
  if (!lectura.ok) throw new Error('Create lectura failed: ' + JSON.stringify(lectura.body));
  const lecturaId = lectura.body._id;

  console.log('CREATE BITACORA');
  const bitacora = await r(`${base}/bitacoraTransacciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario_id: userId,
      lectura_id: lecturaId,
      tipo: 'venta',
      monto: 100.5,
      estado: 'pendiente',
      detalles: 'Transacción de prueba',
    }),
  });
  console.log(json(bitacora));
  if (!bitacora.ok) throw new Error('Create bitacora failed: ' + JSON.stringify(bitacora.body));
  const bitacoraId = bitacora.body._id;

  console.log('GET USER BY ID');
  console.log(json(await r(`${base}/usuarios/${userId}`, { method: 'GET' })));
  console.log('GET PROMPT BY ID');
  console.log(json(await r(`${base}/promptsConfig/${promptId}`, { method: 'GET' })));
  console.log('GET MATRIZ COMPLETE');
  console.log(json(await r(`${base}/matricesNumerologicas/completa/${matrizId}`, { method: 'GET' })));
  console.log('GET LECTURA DETALLADA');
  console.log(json(await r(`${base}/lecturasIA/detallada/${lecturaId}`, { method: 'GET' })));
  console.log('GET BITACORA BY ID');
  console.log(json(await r(`${base}/bitacoraTransacciones/${bitacoraId}`, { method: 'GET' })));

  console.log('UPDATE BITACORA');
  console.log(json(await r(`${base}/bitacoraTransacciones/${bitacoraId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: 'completado' }),
  })));

  console.log('DELETE BITACORA');
  console.log(json(await r(`${base}/bitacoraTransacciones/${bitacoraId}`, { method: 'DELETE' })));

  console.log('CLEANUP');
  console.log(json(await r(`${base}/lecturasIA/${lecturaId}`, { method: 'DELETE' })));
  console.log(json(await r(`${base}/matricesNumerologicas/${matrizId}`, { method: 'DELETE' })));
  console.log(json(await r(`${base}/promptsConfig/${promptId}`, { method: 'DELETE' })));
  console.log(json(await r(`${base}/usuarios/${userId}`, { method: 'DELETE' })));
};

await run();
