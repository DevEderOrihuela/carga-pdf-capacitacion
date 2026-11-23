const CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbx5JBrhxPJG2oCHmLZ6XkdeaIyzS61bu-x-c5kNGzu8T9bH2wLXSWqQar-halbhmJbX/exec",
  MAX_SIZE_MB: 15
};

const SEDES_OPERATIVAS = [
  "AMAZONAS-BAGUA GRANDE", "AMAZONAS-CHACHAPOYAS", "APURÍMAC-ABANCAY",
  "APURÍMAC-ANDAHUAYLAS", "AREQUIPA-AREQUIPA", "AREQUIPA-CAMANÁ",
  "AYACUCHO-HUAMANGA", "AYACUCHO-PUQUIO", "CAJAMARCA-CAJAMARCA",
  "CAJAMARCA-CHOTA", "CAJAMARCA-JAÉN", "CALLAO", "CUSCO-CUSCO",
  "CUSCO-LA CONVENCIÓN", "CUSCO-SICUANI", "HUANCAVELICA-HUANCAVELICA",
  "HUANCAVELICA-PAMPAS", "HUÁNUCO-HUÁNUCO", "HUÁNUCO-TINGO MARÍA",
  "ICA-CHINCHA", "ICA-ICA", "JUNÍN-HUANCAYO", "JUNÍN-TARMA",
  "LA LIBERTAD-HUAMACHUCO", "LA LIBERTAD-TRUJILLO", "LAMBAYEQUE-CHICLAYO",
  "LIMA METROPOLITANA-CENTRO", "LIMA METROPOLITANA-ESTE",
  "LIMA METROPOLITANA-NORTE", "LIMA METROPOLITANA-SUR",
  "LIMA PROVINCIAS-CAÑETE", "LIMA PROVINCIAS-HUACHO", "LORETO-IQUITOS",
  "LORETO-YURIMAGUAS", "MADRE DE DIOS", "MOQUEGUA", "PASCO",
  "PIURA-PIURA", "PIURA-SULLANA", "PUNO-AZÁNGARO", "PUNO-JULIACA",
  "PUNO-PUNO", "SAN MARTÍN-MOYOBAMBA", "SAN MARTÍN-TARAPOTO",
  "TACNA", "TUMBES", "UCAYALI-PUCALLPA", "ÁNCASH-CHIMBOTE",
  "ÁNCASH-HUARAZ", "ÁNCASH-POMABAMBA"
];

let sesionActual = null;
let archivoSeleccionado = null;

// ELEMENTOS DOM
const vistaLogin = document.getElementById("vistaLogin");
const vistaApp = document.getElementById("vistaApp");
const userBadge = document.getElementById("userBadge");
const loginForm = document.getElementById("loginForm");
const loginMensaje = document.getElementById("loginMensaje");
const btnLogin = document.getElementById("btnLogin");

const buscarSede = document.getElementById("buscarSede");
const selectSede = document.getElementById("sede");
const selectTipo = document.getElementById("tipoDocumento");
const grupoNivel = document.getElementById("grupoNivel");
const selectNivel = document.getElementById("nivel");
const rutaPreview = document.getElementById("rutaPreview");

const dropZone = document.getElementById("dropZone");
const inputArchivo = document.getElementById("archivo");
const fileInfo = document.getElementById("fileInfo");
const uploadForm = document.getElementById("uploadForm");
const btnSubir = document.getElementById("btnSubir");
const mensaje = document.getElementById("mensaje");
const panelHistorial = document.getElementById("panelHistorial");
const listaHistorial = document.getElementById("listaHistorial");

// --- 1. AUTENTICACIÓN ---
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const usuario = document.getElementById("loginUsuario").value.trim();
  const clave = document.getElementById("loginClave").value.trim();

  btnLogin.disabled = true;
  mostrarAlerta(loginMensaje, "Verificando credenciales...", "info");

  try {
    const res = await fetch(CONFIG.WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({ accion: "login", usuario, clave })
    });
    const data = await res.json();

    if (!data.ok) {
      mostrarAlerta(loginMensaje, data.error, "error");
      return;
    }

    sesionActual = { usuario: data.usuario, clave, nombre: data.nombre, sedeAsignada: data.sedeAsignada };
    iniciarInterfazUsuario();
  } catch (err) {
    mostrarAlerta(loginMensaje, "Error de conexión con el servidor.", "error");
  } finally {
    btnLogin.disabled = false;
  }
});

function iniciarInterfazUsuario() {
  vistaLogin.classList.add("hidden");
  vistaApp.classList.remove("hidden");
  userBadge.classList.remove("hidden");

  document.getElementById("lblNombreUsuario").textContent = sesionActual.nombre;
  document.getElementById("lblSedeUsuario").textContent =
    sesionActual.sedeAsignada === "TODAS" ? "Acceso Nacional (50 Sedes)" : `Sede: ${sesionActual.sedeAsignada}`;

  if (sesionActual.sedeAsignada === "TODAS") {
    buscarSede.classList.remove("hidden");
    renderizarSedes(SEDES_OPERATIVAS);
    selectSede.disabled = false;
  } else {
    buscarSede.classList.add("hidden");
    renderizarSedes([sesionActual.sedeAsignada]);
    selectSede.disabled = true;
  }
  actualizarVistaRuta();
}

document.getElementById("btnCerrarSesion").addEventListener("click", () => {
  sesionActual = null;
  archivoSeleccionado = null;
  loginForm.reset();
  uploadForm.reset();
  loginMensaje.classList.add("hidden");
  mensaje.classList.add("hidden");
  vistaApp.classList.add("hidden");
  userBadge.classList.add("hidden");
  vistaLogin.classList.remove("hidden");
});

// --- 2. FILTRO Y SELECTORES ---
function renderizarSedes(lista) {
  selectSede.innerHTML = "";
  lista.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    selectSede.appendChild(opt);
  });
  actualizarVistaRuta();
}

buscarSede.addEventListener("input", () => {
  const filtro = buscarSede.value.trim().toUpperCase();
  const filtradas = SEDES_OPERATIVAS.filter((s) => s.includes(filtro));
  renderizarSedes(filtradas.length ? filtradas : ["SIN COINCIDENCIAS"]);
});

function actualizarVistaRuta() {
  const esLista = selectTipo.value === "LISTAS DE ASISTENCIA";
  grupoNivel.style.display = esLista ? "flex" : "none";
  selectNivel.required = esLista;

  const ruta = esLista
    ? `CAPACITACIÓN / ${selectTipo.value} / ${selectSede.value} / ${selectNivel.value}`
    : `CAPACITACIÓN / ${selectTipo.value}`;
  rutaPreview.textContent = ruta;
}

selectSede.addEventListener("change", actualizarVistaRuta);
selectTipo.addEventListener("change", actualizarVistaRuta);
selectNivel.addEventListener("change", actualizarVistaRuta);

// --- 3. DRAG & DROP ARCHIVOS ---
dropZone.addEventListener("click", () => inputArchivo.click());

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files.length) {
    procesarArchivoSeleccionado(e.dataTransfer.files[0]);
  }
});

inputArchivo.addEventListener("change", () => {
  if (inputArchivo.files.length) {
    procesarArchivoSeleccionado(inputArchivo.files[0]);
  }
});

function procesarArchivoSeleccionado(file) {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    mostrarAlerta(mensaje, "Formato no válido. Selecciona únicamente un archivo PDF.", "error");
    return;
  }
  if (file.size > CONFIG.MAX_SIZE_MB * 1024 * 1024) {
    mostrarAlerta(mensaje, `El archivo supera el límite de ${CONFIG.MAX_SIZE_MB} MB.`, "error");
    return;
  }
  archivoSeleccionado = file;
  const mb = (file.size / (1024 * 1024)).toFixed(2);
  fileInfo.textContent = `Listo para subir: ${file.name} (${mb} MB)`;
  dropZone.classList.add("has-file");
  mensaje.classList.add("hidden");
}

// --- 4. ENVÍO CON CONTROL DE DUPLICADOS ---
uploadForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!archivoSeleccionado || selectSede.value === "SIN COINCIDENCIAS") {
    mostrarAlerta(mensaje, "Verifica la sede seleccionada y adjunta un archivo PDF.", "error");
    return;
  }
  enviarArchivo(false);
});

function enviarArchivo(forzarReemplazo) {
  btnSubir.disabled = true;
  mostrarAlerta(mensaje, forzarReemplazo ? "Reemplazando archivo en Drive..." : "Subiendo PDF y registrando en bitácora...", "info");

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(",")[1];
    try {
      const response = await fetch(CONFIG.WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify({
          accion: "upload",
          usuario: sesionActual.usuario,
          clave: sesionActual.clave,
          sede: selectSede.value,
          tipoDocumento: selectTipo.value,
          nivel: selectNivel.value,
          nombreArchivo: archivoSeleccionado.name,
          forzarReemplazo,
          base64
        })
      });

      const res = await response.json();

      // Si el archivo ya existe, pedir confirmación al usuario
      if (res.duplicado) {
        const confirmar = confirm(
          `AVISO DE DUPLICADO:\n\nEl archivo "${res.nombreExistente}" ya fue subido anteriormente en esta carpeta.\n\n¿Deseas REEMPLAZARLO por esta nueva versión?`
        );
        if (confirmar) {
          enviarArchivo(true);
        } else {
          mostrarAlerta(mensaje, "Carga cancelada. Se conservó el archivo existente en Drive.", "info");
          btnSubir.disabled = false;
        }
        return;
      }

      if (res.ok) {
        mostrarAlerta(
          `[${res.accionRealizada}] Guardado como "${res.nombreGuardado}" en ${res.ruta}.`,
          "success"
        );
        agregarAlHistorial(res);
        archivoSeleccionado = null;
        inputArchivo.value = "";
        dropZone.classList.remove("has-file");
        fileInfo.textContent = "Solo formato .PDF • Tamaño máximo 15 MB";
      } else {
        mostrarAlerta(mensaje, `Error: ${res.error}`, "error");
      }
    } catch (err) {
      mostrarAlerta(mensaje, "Error de red al conectar con Google Drive.", "error");
    } finally {
      btnSubir.disabled = false;
    }
  };
  reader.readAsDataURL(archivoSeleccionado);
}

function agregarAlHistorial(res) {
  panelHistorial.classList.remove("hidden");
  const li = document.createElement("li");
  li.innerHTML = `
    <div>
      <strong>${res.nombreGuardado}</strong><br>
      <small style="color:#64748b">${res.ruta} • ${res.hora} (${res.accionRealizada})</small>
    </div>
    <a href="${res.url}" target="_blank" rel="noopener">Ver PDF ↗</a>
  `;
  listaHistorial.prepend(li);
}

function mostrarAlerta(el, texto, tipo) {
  el.textContent = texto;
  el.className = `alert ${tipo}`;
}
