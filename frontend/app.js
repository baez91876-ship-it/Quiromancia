const $ = (selector) => document.querySelector(selector);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sessionKey = "quiromancia_session";
const apiBaseUrl = location.hostname === "baez91876-ship-it.github.io"
    ? "https://quiromancia.onrender.com"
    : "";
const readingsCache = [];
let activeSession = readSession();
let toastTimer;

function readSession() {
    for (const storage of [sessionStorage, localStorage]) {
        try {
            const session = JSON.parse(storage.getItem(sessionKey) || "null");
            if (session?.token && session.usuario?._id) return { ...session, storage };
            if (session !== null) storage.removeItem(sessionKey);
        } catch {
            storage.removeItem(sessionKey);
        }
    }
    return null;
}

function saveSession(session, remember) {
    clearSession();
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(sessionKey, JSON.stringify({ token: session.token, usuario: session.usuario }));
    activeSession = { token: session.token, usuario: session.usuario, storage };
}

function clearSession() {
    localStorage.removeItem(sessionKey);
    sessionStorage.removeItem(sessionKey);
    activeSession = null;
}

function showToast(message, type = "success") {
    clearTimeout(toastTimer);
    const toast = $("#toast");
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    toastTimer = setTimeout(() => { toast.className = "toast"; }, 3500);
}

function setFieldError(id, message = "") {
    const input = $(`#${id}`);
    const output = $(`[data-error="${id}"]`);
    input?.classList.toggle("invalid", Boolean(message));
    if (output) output.textContent = message;
}

function showAuth(view = "login") {
    $("#dashboardView").classList.remove("active");
    $("#authView").classList.add("active");
    switchView(view);
}

function switchView(view) {
    const showRegister = view === "register";
    $("#loginPanel").classList.toggle("active", !showRegister);
    $("#registerPanel").classList.toggle("active", showRegister);
    if (location.hash !== `#${view}`) location.hash = view;
}

function showDashboard(usuario) {
    $("#authView").classList.remove("active");
    $("#dashboardView").classList.add("active");
    $("#welcomeName").textContent = usuario.nombre;
    void loadDashboard();
}

function updatePasswordStrength() {
    const password = $("#registerPassword").value;
    const score = [
        password.length >= 8,
        /\d/.test(password),
        /[^A-Za-z0-9]/.test(password),
        password.length >= 12,
    ].filter(Boolean).length;
    $("#strengthFill").style.width = `${score * 25}%`;
    $("#strengthFill").style.background = score <= 1 ? "var(--danger)" : score === 2 ? "var(--gold)" : "var(--success)";
    $("#strengthText").textContent = ["Sin contraseña", "Débil", "Media", "Fuerte", "Muy fuerte"][score];
    validateRegister(false);
}

function validateLogin(showErrors = true) {
    const email = $("#loginEmail").value.trim();
    const password = $("#loginPassword").value;
    const errors = {
        loginEmail: email && !emailPattern.test(email) ? "Escribe un correo válido." : "",
        loginPassword: password ? "" : "La contraseña es obligatoria.",
    };
    if (showErrors) Object.entries(errors).forEach(([id, message]) => setFieldError(id, message));
    return Boolean(email && password && !errors.loginEmail && !errors.loginPassword);
}

function validateRegister(showErrors = true) {
    const name = $("#registerName").value.trim();
    const email = $("#registerEmail").value.trim();
    const password = $("#registerPassword").value;
    const confirmation = $("#confirmPassword").value;
    const errors = {
        registerName: name ? "" : "Escribe tu nombre completo.",
        registerEmail: !email ? "El correo es obligatorio." : !emailPattern.test(email) ? "Escribe un correo válido." : "",
        registerBirthDate: $("#registerBirthDate").value ? "" : "La fecha de nacimiento es obligatoria.",
        registerPhone: $("#registerPhone").value.trim() ? "" : "El teléfono es obligatorio.",
        registerPassword: password.length >= 8 && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
            ? ""
            : "Usa 8 caracteres, un número y un símbolo.",
        confirmPassword: confirmation && confirmation === password ? "" : "Las contraseñas no coinciden.",
        termsAccepted: $("#termsAccepted").checked ? "" : "Debes aceptar los términos.",
    };
    if (showErrors) Object.entries(errors).forEach(([id, message]) => setFieldError(id, message));
    const valid = name && email && $("#registerBirthDate").value && $("#registerPhone").value.trim()
        && password && confirmation && Object.values(errors).every((message) => !message);
    $("#registerSubmit").disabled = !valid;
    return Boolean(valid);
}

function setLoading(button, loading, label) {
    button.classList.toggle("loading", loading);
    button.disabled = loading;
    button.querySelector(".label").textContent = loading ? "Procesando..." : label;
}

async function api(path, { method = "GET", body, authenticated = true } = {}) {
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (authenticated && activeSession?.token) headers.Authorization = `Bearer ${activeSession.token}`;

    const response = await fetch(`${apiBaseUrl}${path}`, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    let data;
    try {
        data = await response.json();
    } catch (error) {
        throw new Error(response.ok ? "La API devolvió una respuesta no válida." : `Error HTTP ${response.status}.`, { cause: error });
    }

    if (response.status === 401 && authenticated) {
        clearSession();
        showAuth("login");
    }
    if (!response.ok) throw new Error(data.error || data.errors?.[0]?.msg || "No se pudo completar la solicitud.");
    return data;
}

async function loadPrompts() {
    const prompts = await api("/api/v1/promptsConfig", { authenticated: false });
    const select = $("#readingType");
    select.replaceChildren(new Option("Selecciona el tipo de lectura", ""));
    prompts.forEach((prompt) => {
        const type = prompt.tipo_lectura || prompt.categoria || prompt.nombre;
        select.add(new Option(prompt.nombre, prompt._id));
        select.options[select.options.length - 1].dataset.type = type;
    });
    select.value = prompts[0]?._id || "";
    $("#createReading").disabled = prompts.length === 0;
    if (prompts.length === 0) $("#dashboardStatus").textContent = "No hay plantillas de lectura activas.";
    return prompts;
}

async function loadDashboard() {
    $("#dashboardStatus").textContent = "Cargando lecturas...";
    try {
        const [prompts, readings] = await Promise.all([
            loadPrompts(),
            api("/api/v1/lecturasIA"),
        ]);
        renderReadings(readings);
        if (prompts.length) $("#dashboardStatus").textContent = readings.length
            ? `${readings.length} lectura(s) registrada(s).`
            : "Aún no hay lecturas registradas.";
    } catch (error) {
        $("#dashboardStatus").textContent = error.message;
        if (error.message.includes("iniciar sesión") || error.message.includes("sesión")) {
            showToast(error.message, "error");
        }
    }
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
    })[character]);
}

function renderReadings(readings) {
    readingsCache.splice(0, readingsCache.length, ...readings.slice(0, 5));
    $("#readings").innerHTML = readingsCache.map((item, index) => `
        <li class="reading">
            <strong>${escapeHtml(item.resultado || "Lectura numerológica")}</strong>
            <div class="reading-meta">${escapeHtml(item.respuesta || "Sin respuesta")}</div>
            <div class="reading-actions">
                <button class="ghost print-reading" type="button" data-reading-index="${index}">Imprimir lectura</button>
            </div>
        </li>
    `).join("");
}

function printReading(index) {
    const item = readingsCache[index];
    if (!item) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        showToast("Permite las ventanas emergentes para imprimir.", "error");
        return;
    }
    printWindow.opener = null;
    const date = item.fecha || item.createdAt;
    printWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Lectura numerológica</title>
        <link rel="stylesheet" href="print.css"></head>
        <body><main><h1>Lectura numerológica</h1>
        <p class="date">${escapeHtml(date ? new Date(date).toLocaleString("es-ES") : "Fecha no disponible")}</p>
        <h2>Respuesta</h2><p>${escapeHtml(item.respuesta || "Sin respuesta")}</p>
        <h2>Análisis</h2><p>${escapeHtml(item.analisis || "Sin análisis")}</p>
        <h2>Resultado</h2><p>${escapeHtml(item.resultado || "Sin resultado")}</p></main></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}

document.querySelectorAll("[data-switch]").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.switch));
});

document.querySelectorAll(".eye").forEach((button) => {
    button.addEventListener("click", () => {
        const input = $(`#${button.dataset.eye}`);
        const visible = input.type === "password";
        input.type = visible ? "text" : "password";
        button.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
        button.textContent = visible ? "Ocultar" : "Mostrar";
    });
});

["loginEmail", "loginPassword"].forEach((id) => {
    $(`#${id}`).addEventListener("input", () => validateLogin());
});
["registerName", "registerEmail", "registerBirthDate", "registerPhone", "confirmPassword"].forEach((id) => {
    $(`#${id}`).addEventListener("input", () => validateRegister());
});
$("#registerPassword").addEventListener("input", updatePasswordStrength);
$("#termsAccepted").addEventListener("change", () => validateRegister());

$("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateLogin()) return;

    const button = event.currentTarget.querySelector(".primary");
    setLoading(button, true, "Iniciar sesión");
    try {
        const session = await api("/api/v1/usuarios/login", {
            method: "POST",
            authenticated: false,
            body: {
                email: $("#loginEmail").value.trim().toLowerCase(),
                password: $("#loginPassword").value,
            },
        });
        saveSession(session, $("#rememberMe").checked);
        showToast("Sesión iniciada correctamente.");
        showDashboard(session.usuario);
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        setLoading(button, false, "Iniciar sesión");
    }
});

$("#registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateRegister()) return;

    const form = event.currentTarget;
    const button = event.currentTarget.querySelector(".primary");
    setLoading(button, true, "Crear cuenta");
    try {
        const credentials = {
            nombre: $("#registerName").value.trim(),
            email: $("#registerEmail").value.trim().toLowerCase(),
            fechaNacimiento: $("#registerBirthDate").value,
            genero: $("#registerGender").value,
            telefono: $("#registerPhone").value.trim(),
            password: $("#registerPassword").value,
        };
        await api("/api/v1/usuarios", { method: "POST", authenticated: false, body: credentials });
        const session = await api("/api/v1/usuarios/login", {
            method: "POST",
            authenticated: false,
            body: { email: credentials.email, password: credentials.password },
        });
        saveSession(session, true);
        form.reset();
        $("#registerSubmit").disabled = true;
        showToast("Cuenta creada correctamente.");
        showDashboard(session.usuario);
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        setLoading(button, false, "Crear cuenta");
        validateRegister(false);
    }
});

$("#readingForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const promptId = $("#readingType").value;
    if (!promptId) {
        showToast("Selecciona una plantilla de lectura activa.", "error");
        return;
    }

    const button = $("#createReading");
    setLoading(button, true, "Generar lectura");
    try {
        const result = await api("/api/v1/lecturasIA", {
            method: "POST",
            body: { prompt_usado_id: promptId },
        });
        showToast(result.cached ? "Se recuperó tu lectura guardada." : "Lectura generada correctamente.");
        await loadDashboard();
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        setLoading(button, false, "Generar lectura");
    }
});

$("#readings").addEventListener("click", (event) => {
    const button = event.target.closest("[data-reading-index]");
    if (button) printReading(Number(button.dataset.readingIndex));
});

$("#logoutButton").addEventListener("click", () => {
    clearSession();
    showAuth("login");
    showToast("Sesión cerrada.");
});

$("#termsLink").addEventListener("click", () => {
    $("#modalBg").classList.add("show");
});
$("#closeModal").addEventListener("click", () => {
    $("#modalBg").classList.remove("show");
});
$("#modalBg").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) event.currentTarget.classList.remove("show");
});

if (activeSession) showDashboard(activeSession.usuario);
else if (location.hash === "#register") switchView("register");
