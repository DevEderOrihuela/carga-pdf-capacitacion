const CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbx5JBrhxPJG2oCHmLZ6XkdeaIyzS61bu-x-c5kNGzu8T9bH2wLXSWqQar-halbhmJbX/exec",
  TOKEN: "25082025",
  MAX_SIZE_MB: 15
};

const SEDES_OPERATIVAS = [
  "AMAZONAS-BAGUA GRANDE",
  "AMAZONAS-CHACHAPOYAS",
  "APURÍMAC-ABANCAY",
  "APURÍMAC-ANDAHUAYLAS",
  "AREQUIPA-AREQUIPA",
  "AREQUIPA-CAMANÁ",
  "AYACUCHO-HUAMANGA",
  "AYACUCHO-PUQUIO",
  "CAJAMARCA-CAJAMARCA",
  "CAJAMARCA-CHOTA",
  "CAJAMARCA-JAÉN",
  "CALLAO",
  "CUSCO-CUSCO",
  "CUSCO-LA CONVENCIÓN",
  "CUSCO-SICUANI",
  "HUANCAVELICA-HUANCAVELICA",
  "HUANCAVELICA-PAMPAS",
  "HUÁNUCO-HUÁNUCO",
  "HUÁNUCO-TINGO MARÍA",
  "ICA-CHINCHA",
  "ICA-ICA",
  "JUNÍN-HUANCAYO",
  "JUNÍN-TARMA",
  "LA LIBERTAD-HUAMACHUCO",
  "LA LIBERTAD-TRUJILLO",
  "LAMBAYEQUE-CHICLAYO",
  "LIMA METROPOLITANA-CENTRO",
  "LIMA METROPOLITANA-ESTE",
  "LIMA METROPOLITANA-NORTE",
  "LIMA METROPOLITANA-SUR",
  "LIMA PROVINCIAS-CAÑETE",
  "LIMA PROVINCIAS-HUACHO",
  "LORETO-IQUITOS",
  "LORETO-YURIMAGUAS",
  "MADRE DE DIOS",
  "MOQUEGUA",
  "PASCO",
  "PIURA-PIURA",
  "PIURA-SULLANA",
  "PUNO-AZÁNGARO",
  "PUNO-JULIACA",
  "PUNO-PUNO",
  "SAN MARTÍN-MOYOBAMBA",
  "SAN MARTÍN-TARAPOTO",
  "TACNA",
  "TUMBES",
  "UCAYALI-PUCALLPA",
  "ÁNCASH-CHIMBOTE",
  "ÁNCASH-HUARAZ",
  "ÁNCASH-POMABAMBA"
];

const selectSede = document.getElementById("sede");
const selectTipo = document.getElementById("tipoDocumento");
const grupoNivel = document.getElementById("grupoNivel");
const selectNivel = document.getElementById("nivel");
const rutaPreview = document.getElementById("rutaPreview");
const inputArchivo = document.getElementById("archivo");
const fileInfo = document.getElementById("fileInfo");
const form = document.getElementById("uploadForm");
const btnSubir = document.getElementById("btnSubir");
const mensaje = document.getElementById("mensaje");

// Cargar las 50 sedes
SEDES_OPERATIVAS.forEach((sede) => {
  const opt = document.createElement("option");
  opt.value = sede;
  opt.textContent = sede;
  selectSede.appendChild(opt);
});

// Mostrar/ocultar Nivel según el tipo de documento y actualizar vista previa de ruta
function actualizarFormulario() {
  const esLista = selectTipo.value === "LISTAS DE ASISTENCIA";
  grupoNivel.style.display = esLista ? "flex" : "none";
  selectNivel.required = esLista;

  const ruta = esLista
    ? `CAPACITACIÓN / ${selectTipo.value} / ${selectSede.value} / ${selectNivel.value}`
    : `CAPACITACIÓN / ${selectTipo.value}`;

  rutaPreview.textContent = `Destino en Drive: ${ruta}`;
}

selectSede.addEventListener("change", actualizarFormulario);
selectTipo.addEventListener("change", actualizarFormulario);
selectNivel.addEventListener("change", actualizarFormulario);

inputArchivo.addEventListener("change", () => {
  const file = inputArchivo.files[0];
  if (!file) {
    fileInfo.textContent = "Ningún archivo seleccionado.";
    return;
  }
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  fileInfo.textContent = `Seleccionado: ${file.name} (${sizeMB} MB)`;
});

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `alert ${tipo}`;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const file = inputArchivo.files[0];

  if (!file) {
    mostrarMensaje("Debes seleccionar un archivo PDF.", "error");
    return;
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    mostrarMensaje("Solo se permiten archivos en formato PDF.", "error");
    return;
  }
  if (file.size > CONFIG.MAX_SIZE_MB * 1024 * 1024) {
    mostrarMensaje(`El archivo supera el máximo permitido (${CONFIG.MAX_SIZE_MB} MB).`, "error");
    return;
  }

  btnSubir.disabled = true;
  mostrarMensaje("Subiendo archivo PDF a Google Drive...", "info");

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(",")[1];
    try {
      const response = await fetch(CONFIG.WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify({
          token: CONFIG.TOKEN,
          sede: selectSede.value,
          tipoDocumento: selectTipo.value,
          nivel: selectNivel.value,
          nombreArchivo: file.name,
          base64: base64
        })
      });

      const res = await response.json();
      if (res.ok) {
        mostrarMensaje(`Guardado como "${res.nombreGuardado}" en: ${res.ruta}`, "success");
        inputArchivo.value = "";
        fileInfo.textContent = "Ningún archivo seleccionado.";
      } else {
        mostrarMensaje(`Error: ${res.error}`, "error");
      }
    } catch (err) {
      mostrarMensaje("Error de red al conectar con Google Drive.", "error");
    } finally {
      btnSubir.disabled = false;
    }
  };

  reader.readAsDataURL(file);
});

actualizarFormulario();