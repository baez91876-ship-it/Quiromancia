const lecturasList = document.getElementById('lecturasList');
const lecturasStatus = document.getElementById('lecturasStatus');
const btnLecturas = document.getElementById('btnLecturas');
const refreshLecturas = document.getElementById('refreshLecturas');
const lecturaForm = document.getElementById('lecturaForm');
const usuarioSelect = document.getElementById('usuarioId');
const promptSelect = document.getElementById('promptId');
const formMessage = document.getElementById('formMessage');
const API_KEY = 'secret123';

async function obtenerUsuarios() {
  const res = await fetch('/api/v1/usuarios');

  if (!res.ok) {
    throw new Error('No se pudieron cargar los usuarios');
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function obtenerPrompts() {
  const res = await fetch('/api/v1/promptsConfig');

  if (!res.ok) {
    throw new Error('No se pudieron cargar los prompts');
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function completarSelect(select, items, labelFallback) {
  if (!select) return;

  select.innerHTML = '';

  if (!Array.isArray(items) || items.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = labelFallback;
    select.appendChild(option);
    return;
  }

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecciona una opción';
  select.appendChild(placeholder);

  items.forEach((item) => {
    const option = document.createElement('option');
    option.value = item._id;
    option.textContent = item.nombre || item.prompt || item.email || item.resultado || 'Sin nombre';
    select.appendChild(option);
  });

  if (!select.value && items[0]) {
    select.value = items[0]._id;
  }
}

async function cargarCatalogos() {
  try {
    const [usuarios, prompts] = await Promise.all([obtenerUsuarios(), obtenerPrompts()]);
    completarSelect(usuarioSelect, usuarios, 'No hay usuarios disponibles');
    completarSelect(promptSelect, prompts, 'No hay prompts disponibles');
  } catch (error) {
    completarSelect(usuarioSelect, [], 'No hay usuarios disponibles');
    completarSelect(promptSelect, [], 'No hay prompts disponibles');
    lecturasStatus.textContent = error.message;
  }
}

async function cargarLecturas() {
  try {
    lecturasStatus.textContent = 'Cargando lecturas...';

    const res = await fetch('/api/v1/lecturasIA');
    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}`);
    }

    const lecturas = await res.json();

    if (!Array.isArray(lecturas) || lecturas.length === 0) {
      lecturasList.innerHTML = '<li class="empty-state">No hay lecturas registradas todavía.</li>';
      lecturasStatus.textContent = 'Sin lecturas disponibles';
      return;
    }

    lecturasList.innerHTML = lecturas
      .slice(0, 10)
      .map((lectura) => {
        const fecha = lectura.fecha ? new Date(lectura.fecha).toLocaleString() : 'Sin fecha';
        const resultado = lectura.resultado || 'Sin resultado';
        const analisis = lectura.analisis || 'Sin análisis';

        return `
          <li class="lectura-item">
            <strong>${resultado}</strong>
            <div class="lectura-meta">${fecha}</div>
            <div class="lectura-meta">${analisis}</div>
          </li>
        `;
      })
      .join('');

    lecturasStatus.textContent = `Mostrando ${lecturas.length} lectura(s).`;
  } catch (error) {
    lecturasStatus.textContent = 'No se pudieron cargar las lecturas.';
    lecturasList.innerHTML = `<li class="empty-state">${error.message}</li>`;
  }
}

async function crearLectura(event) {
  event.preventDefault();

  if (!usuarioSelect.value || !promptSelect.value) {
    await cargarCatalogos();
  }

  const formData = new FormData(lecturaForm);

  const data = {
    usuario_id: formData.get('usuario_id') || usuarioSelect.value,
    prompt_usado_id: formData.get('prompt_usado_id') || promptSelect.value,
    respuesta: formData.get('respuesta'),
    analisis: formData.get('analisis'),
    metadata: (() => {
      const raw = String(formData.get('metadata') || '').trim();
      try {
        return raw ? JSON.parse(raw) : {};
      } catch {
        return { fuente: 'web', raw };
      }
    })(),
    resultado: formData.get('resultado'),
  };

  if (!data.usuario_id || !data.prompt_usado_id || !data.respuesta || !data.analisis || !data.resultado) {
    formMessage.textContent = 'Completa todos los campos obligatorios.';
    formMessage.className = 'form-message error';
    return;
  }

  try {
    formMessage.textContent = 'Guardando lectura...';
    formMessage.className = 'form-message';

    const res = await fetch('/api/v1/lecturasIA', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(data),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.error || 'No se pudo guardar la lectura');
    }

    formMessage.textContent = 'Lectura creada correctamente.';
    formMessage.className = 'form-message success';
    lecturaForm.reset();
    document.getElementById('metadata').value = '{"fuente":"web"}';
    await cargarLecturas();
  } catch (error) {
    formMessage.textContent = error.message;
    formMessage.className = 'form-message error';
  }
}

btnLecturas?.addEventListener('click', cargarLecturas);
refreshLecturas?.addEventListener('click', cargarLecturas);
lecturaForm?.addEventListener('submit', crearLectura);

window.cargarCatalogos = cargarCatalogos;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await cargarCatalogos();
    cargarLecturas();
  });
} else {
  cargarCatalogos();
  cargarLecturas();
}
