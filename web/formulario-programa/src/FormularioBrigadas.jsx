import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
 Save,
 AlertCircle,
 Users,
 Package,
 Wrench,
 Fuel,
 Utensils,
 Tent,
 Droplets,
 Heart,
 PawPrint,
 ChevronLeft,
 ChevronRight,
 Loader,
 Check,
 X,
 CheckCircle,
 MessageSquare,
} from "lucide-react";
import "./FormularioBrigadas.css"; // Asegúrate de tener un archivo CSS para estilos
const FormularioBrigadas = ({ brigadaId = null, onSuccess = () => {} }) => {
 // Estados principales
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState(null);
 const [success, setSuccess] = useState(null);

 // Datos de la API
 const [tallas, setTallas] = useState([]);
 const [tiposRecursos, setTiposRecursos] = useState({});
 const [, setBrigadaExistente] = useState(null);
 // Estado del formulario
 const [brigada, setBrigada] = useState({
  nombre: "",
  cantidad_bomberos_activos: "",
  contacto_celular_comandante: "",
  encargado_logistica: "",
  contacto_celular_logistica: "",
  numero_emergencia_publico: "",
 });

 const [inventario, setInventario] = useState({});
 const [pasoActual, setPasoActual] = useState(0);

 const [showConfirmModal, setShowConfirmModal] = useState(false);
 const [resumenData, setResumenData] = useState(null);
 // Configuración de pasos
 const pasos = [
  {
   id: "brigada",
   label: "Información Brigada",
   icono: Users,
   color: "icon-blue",
  },
  { id: "epp", label: "EPP", icono: Package, color: "icon-orange" },
  {
   id: "herramientas",
   label: "Herramientas",
   icono: Wrench,
   color: "icon-gray",
  },
  { id: "logistica", label: "Logística", icono: Fuel, color: "icon-blue" },
  {
   id: "alimentacion",
   label: "Alimentación",
   icono: Utensils,
   color: "icon-green",
  },
  { id: "campo", label: "Equipo Campo", icono: Tent, color: "icon-purple" },
  { id: "limpieza", label: "Limpieza", icono: Droplets, color: "icon-cyan" },
  {
   id: "medicamentos",
   label: "Medicamentos",
   icono: Heart,
   color: "icon-red",
  },
  {
   id: "rescate_animal",
   label: "Rescate Animal",
   icono: PawPrint,
   color: "icon-amber",
  },
  {
   id: "revisión",
   label: "Revisión Final",
   icono: Check,
   color: "icon-green",
  },
 ];

 // Mapeo de categorías API a pasos
 const categoriaMap = useMemo(
  () => ({
   EPP: "epp",
   HERRAMIENTAS: "herramientas",
   LOGISTICA: "logistica",
   ALIMENTACION: "alimentacion",
   CAMPO: "campo",
   LIMPIEZA: "limpieza",
   MEDICAMENTOS: "medicamentos",
   RESCATE_ANIMAL: "rescate_animal",
  }),
  []
 );

 // API Base URL (ajustar según tu configuración)
 const API_BASE = "https://proyecto-de-ultimo-minuto.online/api"; // Cambiar por tu URL base

 // Funciones API
 const apiCall = async (endpoint, options = {}) => {
  try {
   const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
     "Content-Type": "application/json",
     ...options.headers,
    },
    ...options,
   });

   if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}`);
   }

   return await response.json();
  } catch (error) {
   console.error(
    `API Error ${endpoint} con opciones ${JSON.stringify(options.body)}:`,
    error
   );
   throw error;
  }
 };

 // Pausa controlada entre requests para evitar saturación del backend
 const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

 // Cargar datos iniciales
 useEffect(() => {
  const cargarDatos = async () => {
   try {
    setLoading(true);
    setError(null);

    // Cargar tallas
    const tallasData = await apiCall("/tallas");
    setTallas(tallasData);

    // Cargar tipos de recursos
    const tiposData = await apiCall("/tipos-recursos?activo=true");
    const tiposPorCategoria = tiposData.reduce((acc, tipo) => {
     const categoria = categoriaMap[tipo.categoria];
     if (categoria) {
      if (!acc[categoria]) acc[categoria] = [];
      acc[categoria].push(tipo);
     }
     return acc;
    }, {});
    console.log("Tipos de recursos por categoría:", tiposPorCategoria);
    setTiposRecursos(tiposPorCategoria);

    // Si es edición, cargar brigada existente
    if (brigadaId) {
     const brigadaData = await apiCall(`/brigadas/${brigadaId}`);
     setBrigada(brigadaData);
     setBrigadaExistente(brigadaData);

     // Cargar inventario existente
     const inventarioData = await apiCall(`/inventario/brigada/${brigadaId}`);
     setInventario(procesarInventarioAPI(inventarioData));
    }
   } catch (err) {
    setError(`Error al cargar datos: ${err.message}`);
   } finally {
    setLoading(false);
   }
  };

  cargarDatos();
 }, [brigadaId, categoriaMap]);

 // Procesar inventario de la API al formato del formulario
 const procesarInventarioAPI = (inventarioAPI) => {
  const inventarioFormato = {};

  Object.entries(inventarioAPI).forEach(([categoria, items]) => {
   inventarioFormato[categoria] = {};

   items.forEach((item) => {
    const nombreRecurso = item.tipo_recurso_nombre;

    if (!inventarioFormato[categoria][nombreRecurso]) {
     inventarioFormato[categoria][nombreRecurso] = {
      observaciones: item.observaciones || "",
     };
    }

    if (item.talla_codigo) {
     inventarioFormato[categoria][nombreRecurso][item.talla_codigo] =
      item.cantidad || 0;
    } else {
     inventarioFormato[categoria][nombreRecurso].cantidad = item.cantidad || 0;
    }
   });
  });

  return inventarioFormato;
 };

 // Actualizar inventario
 const actualizarInventario = (categoria, recurso, campo, valor) => {
  setInventario((prev) => ({
   ...prev,
   [categoria]: {
    ...prev[categoria],
    [recurso]: {
     ...prev[categoria]?.[recurso],
     [campo]: campo === "observaciones" ? valor : parseInt(valor) || 0,
    },
   },
  }));
 };

 // Observación específica por talla
 const actualizarObservacionPorTalla = (
  categoria,
  recurso,
  tallaCodigo,
  observacion
 ) => {
  setInventario((prev) => {
   const recursoActual = prev[categoria]?.[recurso] || {};
   const obsTallasActual = recursoActual.observaciones_tallas || {};
   return {
    ...prev,
    [categoria]: {
     ...prev[categoria],
     [recurso]: {
      ...recursoActual,
      observaciones_tallas: { ...obsTallasActual, [tallaCodigo]: observacion },
     },
    },
   };
  });
 };

 // Navegación
 const siguientePaso = () => {
  if (pasoActual < pasos.length - 1) {
   const siguientePaso = pasoActual + 1;
   const pasoInfo = pasos[siguientePaso];

   setNextStepInfo({
    currentStep: pasos[pasoActual],
    nextStep: pasoInfo,
    currentIndex: pasoActual,
    nextIndex: siguientePaso,
   });

   setShowTransitionModal(true);
  }
 };
 const pasoAnterior = () => {
  if (pasoActual > 0) {
   setPasoActual(pasoActual - 1);
  }
 };

 const validarPasoActual = () => {
  if (pasoActual === 0) {
   return brigada.nombre.trim() !== "";
  }
  return true;
 };

 // Enviar formulario
 // Agregar este estado al componente (junto con los otros useState)

 // Función auxiliar para procesar el submit después de la confirmación
 const procesarSubmit = async () => {
  try {
   setSaving(true);
   setError(null);
   setSuccess(null);

   // 1. Guardar/actualizar brigada
   let brigadaGuardada;
   if (brigadaId) {
    brigadaGuardada = await apiCall(`/brigadas/${brigadaId}`, {
     method: "PUT",
     body: JSON.stringify(brigada),
    });
   } else {
    brigadaGuardada = await apiCall("/brigadas", {
     method: "POST",
     body: JSON.stringify(brigada),
    });
   }

   const brigadaIdFinal = brigadaGuardada.id;

   // 2. Guardar inventario
   await guardarInventario(brigadaIdFinal);

   setSuccess("Brigada guardada exitosamente");
   onSuccess(brigadaGuardada);

   // 3. Completar la barra de progreso
   setPasoActual(pasos.length);
   console.log(
    `Formulario enviado exitosamente: ${pasos.length} y paso actual ${pasoActual}`
   );
  } catch (err) {
   setError(`Error al guardar: ${err.message}`);
  } finally {
   setSaving(false);
   setShowConfirmModal(false);
  }
 };

 // HandleSubmit actualizado
 const handleSubmit = async (e) => {
  e.preventDefault();

  if (pasoActual !== pasos.length - 1) {
   console.log("Submit bloqueado - no estamos en el último paso");
   return;
  }

  // Evitar doble envío si ya está guardando
  if (saving) {
   return;
  }

  // Calcular datos para el resumen
  const categoriasConDatos = Object.entries(inventario).filter(([, recursos]) =>
   Object.values(recursos).some((recurso) => {
    if (recurso.cantidad && recurso.cantidad > 0) return true;
    return Object.entries(recurso).some(
     ([key, valor]) =>
      key !== "observaciones" && typeof valor === "number" && valor > 0
    );
   })
  );

  const totalRecursos = categoriasConDatos.reduce((total, [, recursos]) => {
   return (
    total +
    Object.keys(recursos).filter((recurso) => {
     const datos = recursos[recurso];
     if (datos.cantidad && datos.cantidad > 0) return true;
     return Object.entries(datos).some(
      ([key, valor]) =>
       key !== "observaciones" && typeof valor === "number" && valor > 0
     );
    }).length
   );
  }, 0);

  // Preparar datos para el modal
  setResumenData({
   brigada: brigada.nombre || "(sin nombre)",
   categorias: categoriasConDatos.length,
   recursos: totalRecursos,
  });

  // Mostrar modal en lugar de window.confirm
  setShowConfirmModal(true);
 };

 // Modal de confirmación para agregar al JSX del componente
 const ModalConfirmacion = () => {
  if (!showConfirmModal || !resumenData) return null;

  return (
   <div className="modal-overlay">
    <div className="modal-container">
     <div className="modal-content">
      <div className="modal-icon-container">
       <div className="modal-icon">
        <svg
         className="modal-check-icon"
         fill="none"
         viewBox="0 0 24 24"
         stroke="currentColor"
        >
         <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
         />
        </svg>
       </div>
      </div>

      <h3 className="modal-title">¿Está seguro de guardar?</h3>

      <div className="modal-summary">
       <div className="modal-summary-box">
        <p>
         <span className="modal-label">Brigada:</span> {resumenData.brigada}
        </p>
        <p>
         <span className="modal-label">Categorías con datos:</span>{" "}
         {resumenData.categorias}
        </p>
        <p>
         <span className="modal-label">Tipos de recursos:</span>{" "}
         {resumenData.recursos}
        </p>
       </div>
      </div>

      <div className="modal-buttons">
       <button
        onClick={() => setShowConfirmModal(false)}
        disabled={saving}
        className="modal-btn modal-btn-cancel"
       >
        Cancelar
       </button>

       <button
        onClick={procesarSubmit}
        disabled={saving}
        className="modal-btn modal-btn-confirm"
       >
        {saving ? (
         <>
          <svg className="modal-spinner" fill="none" viewBox="0 0 24 24">
           <circle
            className="modal-spinner-circle"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
           ></circle>
           <path
            className="modal-spinner-path"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
           ></path>
          </svg>
          Guardando...
         </>
        ) : (
         "Confirmar"
        )}
       </button>
      </div>
     </div>
    </div>
   </div>
  );
 };

 // Modal de transición entre pasos
 const ModalTransicion = () => {
  if (!showTransitionModal || !nextStepInfo) return null;

  const { currentStep, nextStep } = nextStepInfo;
  const CurrentIcon = currentStep.icono;
  const NextIcon = nextStep.icono;

  // Función para generar el resumen del paso actual
  const generarResumenPasoActual = () => {
   if (currentStep.id === "brigada") {
    // Resumen del paso de información de brigada (mostrar valores)
    const camposConValores = [
     { label: "Nombre de la brigada", value: brigada.nombre?.trim() },
     {
      label: "Cantidad de bomberos activos",
      value: brigada.cantidad_bomberos_activos,
     },
     {
      label: "Celular del comandante",
      value: brigada.contacto_celular_comandante,
     },
     { label: "Encargado de logística", value: brigada.encargado_logistica },
     {
      label: "Celular de logística",
      value: brigada.contacto_celular_logistica,
     },
     {
      label: "Número de emergencia público",
      value: brigada.numero_emergencia_publico,
     },
    ].filter((c) => c.value && String(c.value).trim() !== "");

    if (camposConValores.length === 0) {
     return "No se ha ingresado información en este paso";
    }

    return (
     <div className="modal-resumen-paso">
      <div className="modal-resumen-header">
       <span className="modal-resumen-title">Información ingresada:</span>
      </div>
      <div className="modal-resumen-items">
       {camposConValores.map((campo, index) => (
        <div key={index} className="modal-resumen-item">
         <Check className="icon-sm icon-green" />
         <div className="modal-resumen-recurso">
          <span className="modal-resumen-nombre">{campo.label}</span>
          <span className="modal-resumen-valor">{campo.value}</span>
         </div>
        </div>
       ))}
      </div>
     </div>
    );
   } else {
    // Resumen del inventario del paso actual
    const categoria = currentStep.id;
    const recursos = inventario[categoria] || {};

    // Filtrar recursos que tienen cantidades
    const recursosConCantidades = Object.entries(recursos).filter(
     ([, datos]) => {
      if (datos.cantidad && datos.cantidad > 0) return true;
      return Object.entries(datos).some(
       ([key, valor]) =>
        key !== "observaciones" && typeof valor === "number" && valor > 0
      );
     }
    );

    if (recursosConCantidades.length === 0) {
     return (
      <div className="warning-container">
       <span className="warning-icon">⚠️</span>
       <span className="warning-text">
        No se han configurado recursos en este paso.
        <span className="warning-highlight">
         ¡Por favor, selecciona al menos uno!
        </span>
       </span>
      </div>
     );
    }

    return (
     <div className="modal-resumen-paso">
      <div className="modal-resumen-header">
       <span className="modal-resumen-title">Recursos configurados:</span>
       <span className="modal-resumen-count">
        {recursosConCantidades.length} recurso
        {recursosConCantidades.length !== 1 ? "s" : ""}
       </span>
      </div>
      <div className="modal-resumen-items">
       {recursosConCantidades.map(([nombreRecurso, datos]) => {
        const tieneQuantity = datos.cantidad !== undefined;
        let cantidadTotal = 0;
        let detalles = "";

        if (tieneQuantity) {
         cantidadTotal = datos.cantidad;
         detalles = `${cantidadTotal} unidades`;
        } else {
         // Calcular total de tallas
         cantidadTotal = Object.entries(datos)
          .filter(
           ([key]) => key !== "observaciones" && key !== "observaciones_tallas"
          )
          .reduce(
           (sum, [, val]) => sum + (typeof val === "number" ? val : 0),
           0
          );

         const tallasConCantidad = Object.entries(datos)
          .filter(
           ([key, val]) =>
            key !== "observaciones" &&
            key !== "observaciones_tallas" &&
            typeof val === "number" &&
            val > 0
          )
          .map(([talla, cant]) => `${talla}: ${cant}`)
          .join(", ");

         detalles = tallasConCantidad
          ? `${cantidadTotal} unidades (${tallasConCantidad})`
          : `${cantidadTotal} unidades`;
        }

        return (
         <div key={nombreRecurso} className="modal-resumen-item">
          <Package className="icon-sm icon-blue" />
          <div className="modal-resumen-recurso">
           <span className="modal-resumen-nombre">{nombreRecurso}</span>
           <span className="modal-resumen-cantidad">{detalles}</span>
           {datos.observaciones && datos.observaciones.trim() && (
            <div className="modal-resumen-observaciones">
             <div className="modal-resumen-observaciones-header">
              <MessageSquare className="icon-sm" />
              <span>Observaciones</span>
             </div>
             <p className="modal-resumen-observaciones-text">
              {datos.observaciones}
             </p>
            </div>
           )}
           {datos.observaciones_tallas && (
            <div className="modal-resumen-observaciones">
             <div className="modal-resumen-observaciones-header">
              <MessageSquare className="icon-sm" />
              <span>Observaciones por talla</span>
             </div>
             <ul className="modal-resumen-observaciones-list">
              {Object.entries(datos.observaciones_tallas)
               .filter(([, txt]) => typeof txt === "string" && txt.trim())
               .map(([talla, txt]) => (
                <li key={talla} className="modal-resumen-observaciones-item">
                 <span className="size-label">{talla}:</span> {txt}
                </li>
               ))}
             </ul>
            </div>
           )}
          </div>
         </div>
        );
       })}
      </div>
     </div>
    );
   }
  };

  return (
   <div className="modal-overlay">
    <div className="modal-container modal-transition">
     <div className="modal-content">
      <div className="modal-icon-container">
       <div className="modal-icon modal-icon-transition">
        <CurrentIcon className="modal-icon-current" />
        <div className="modal-arrow">→</div>
        <NextIcon className="modal-icon-next" />
       </div>
      </div>

      <h3 className="modal-title">Cambiando de paso</h3>
      <p className="modal-label">
       {" "}
       Estas seguro de seguir con esta informacion para la creacion de tu
       Brigada?
      </p>

      <div className="modal-summary">
       <div className="modal-summary-box">
        <p>
         <span className="modal-label">Yendo del paso</span> {currentStep.label}
         <span style={{ paddingRight: "var(--space-sm)" }}></span>
         <span className="modal-label">al paso</span> {nextStep.label}
        </p>
        {/* <p>
         <span className="modal-label">Progreso:</span> {nextIndex} de{" "}
         {pasos.length}
        </p> */}
       </div>
      </div>

      {/* Resumen del paso actual */}
      {generarResumenPasoActual()}

      <div className="modal-buttons">
       <button
        onClick={() => setShowTransitionModal(false)}
        className="modal-btn modal-btn-cancel"
       >
        Cancelar
       </button>
       <button
        onClick={confirmarCambioPaso}
        className="modal-btn modal-btn-confirm"
       >
        Continuar
       </button>
      </div>
     </div>
    </div>
   </div>
  );
 };

 // Agregar este estado para el modal de transición
 const [showTransitionModal, setShowTransitionModal] = useState(false);
 const [nextStepInfo, setNextStepInfo] = useState(null);

 // Función para confirmar el cambio de paso
 const confirmarCambioPaso = () => {
  setPasoActual((prev) => prev + 1);
  setShowTransitionModal(false);
  setNextStepInfo(null);
 };

 // Guardar inventario por categorías
 const guardarInventario = async (brigadaIdParam) => {
  const categorias = Object.keys(inventario);

  for (const categoria of categorias) {
   const recursos = inventario[categoria];

   for (const [nombreRecurso, datos] of Object.entries(recursos)) {
    // Encontrar el tipo de recurso
    const tipoRecurso = tiposRecursos[categoria]?.find(
     (t) => t.nombre === nombreRecurso
    );
    if (!tipoRecurso) continue;

    const observacionesGenerales = datos.observaciones || "";

    if (tipoRecurso.requiere_talla) {
     // Guardar por cada talla
     for (const [talla, cantidad] of Object.entries(datos)) {
      if (
       talla !== "cantidad" &&
       talla !== "observaciones" &&
       talla !== "observaciones_tallas" &&
       cantidad > 0
      ) {
       const tallaObj = tallas.find((t) => t.codigo === talla);
       if (tallaObj) {
        // Usar la categoría real del tipoRecurso, no hardcodear EPP
        const categoriaReal = tipoRecurso.categoria
         .toLowerCase()
         .replace("_", "-");

        // Observación específica por talla o fallback a general
        const observacionPorTalla =
         datos.observaciones_tallas?.[talla] || observacionesGenerales;

        await apiCall(`/inventario/${categoriaReal}`, {
         method: "POST",
         body: JSON.stringify({
          brigada_id: brigadaIdParam,
          tipo_recurso_id: tipoRecurso.id,
          talla_id: tallaObj.id,
          cantidad: cantidad,
          observaciones: observacionPorTalla,
         }),
        });
        await sleep(80);
       }
      }
     }
    } else {
     // Guardar cantidad simple
     if (datos.cantidad > 0) {
      // Usar la categoría real del tipoRecurso, no la del mapeo local
      const categoriaReal = tipoRecurso.categoria
       .toLowerCase()
       .replace("_", "-");
      const endpoint = `/inventario/${categoriaReal}`;
      await apiCall(endpoint, {
       method: "POST",
       body: JSON.stringify({
        brigada_id: brigadaIdParam,
        tipo_recurso_id: tipoRecurso.id,
        cantidad: datos.cantidad,
        observaciones: observacionesGenerales,
       }),
      });
      await sleep(80);
     }
    }
   }
  }
 };
 // Renderizado de pasos
 const renderPaso = () => {
  if (pasoActual === pasos.length) {
   return null; // No renderizar nada
  }
  return (
   // Renderizado de la navegación por pasos con la condicion de que no sea el paso final
   <div className="step-navigation">
    <div className="step-nav-left">
     <button
      type="button"
      onClick={pasoAnterior}
      disabled={pasoActual === 0 || saving}
      className="step-button step-button-prev"
     >
      <ChevronLeft className="icon" />
      Anterior
     </button>
    </div>

    <div className="step-info-container">
     <span className="step-info">
      Paso {pasoActual} de {pasos.length}:{" "}
      {pasoActual < pasos.length ? pasos[pasoActual].label : ""}
     </span>
    </div>

    <div className="step-nav-right">
     {pasoActual < pasos.length - 1 ? (
      <button
       type="button" // ✅ Asegurar que es tipo button
       onClick={(e) => {
        e.preventDefault(); // ✅ Prevenir cualquier comportamiento de submit
        e.stopPropagation(); // ✅ Prevenir propagación del evento
        siguientePaso();
       }}
       disabled={!validarPasoActual() || saving}
       className="step-button step-button-next"
      >
       Siguiente
       <ChevronRight className="icon" />
      </button>
     ) : (
      <button
       type="submit" // ✅ Solo este botón debe hacer submit
       disabled={saving || !validarPasoActual()}
       className="step-button step-button-submit"
      >
       {saving ? (
        <Loader className="icon icon-spin" />
       ) : (
        <Save className="icon" />
       )}
       {saving ? "Guardando..." : "Guardar Brigada"}
      </button>
     )}
    </div>
   </div>
  );
 };

 // Renderizado de campos
 const renderCampoTallas = (recurso, categoria) => {
  const tipoRecurso = tiposRecursos[categoria]?.find(
   (t) => t.nombre === recurso
  );
  if (!tipoRecurso) return null;

  // Autoajuste de altura para textareas compactos
  const handleAutoResize = (e) => {
   const el = e.target;
   el.style.height = "auto";
   el.style.height = `${el.scrollHeight}px`;
  };

  // Total de cantidades asignadas en tallas
  const totalTallas = Object.entries(inventario[categoria]?.[recurso] || {})
   .filter(
    ([key, val]) =>
     key !== "observaciones" &&
     key !== "observaciones_tallas" &&
     typeof val === "number"
   )
   .reduce((sum, [, val]) => sum + (parseInt(val) || 0), 0);

  const observacionGeneralHabilitada = totalTallas > 0;

  return (
   <div className="resource-content">
    {/* Titulo de Tallas */}
    <h3 className="tallas-title">Tallas</h3>
    <p className="talla-label">
     Por favor, poner al menos 1 en cantidad para añadir observacion al recurso
     correspondiente.
    </p>
    <div className="tallas-grid">
     {tallas.map((talla) => (
      <div key={talla.codigo} className="talla-group">
       <label className="talla-label">{talla.codigo}</label>
       <input
        type="number"
        min="0"
        className="talla-input"
        placeholder="0"
        value={inventario[categoria]?.[recurso]?.[talla.codigo] || ""}
        onChange={(e) =>
         actualizarInventario(categoria, recurso, talla.codigo, e.target.value)
        }
       />
      </div>
     ))}
    </div>

    {/* Panel de observaciones por talla (sin hooks) */}
    <details className="tallas-obs-panel">
     <summary className="tallas-obs-toggle">
      <span>Observaciones por talla</span>
      <svg
       className="tallas-obs-arrow"
       fill="none"
       stroke="currentColor"
       viewBox="0 0 24 24"
      >
       <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
       />
      </svg>
     </summary>
     <div className="tallas-obs-list">
      {tallas.map((talla) => (
       <div key={talla.codigo} className="tallas-obs-row">
        <span className="tallas-obs-size">{talla.codigo}</span>
        <textarea
         rows="1"
         className="tallas-obs-input"
         placeholder={`Observación para ${talla.codigo}`}
         value={
          (inventario[categoria]?.[recurso]?.[talla.codigo] || 0) > 0
           ? inventario[categoria]?.[recurso]?.observaciones_tallas?.[
              talla.codigo
             ] || ""
           : ""
         }
         onChange={(e) =>
          actualizarObservacionPorTalla(
           categoria,
           recurso,
           talla.codigo,
           e.target.value
          )
         }
         onInput={handleAutoResize}
         style={{ height: "28px" }}
         disabled={
          !((inventario[categoria]?.[recurso]?.[talla.codigo] || 0) > 0)
         }
        />
       </div>
      ))}
     </div>
    </details>

    {/* Observación general opcional */}
    <div className="observaciones-container">
     <div className="observaciones-header">
      <MessageSquare className="icon-sm" />
      <label className="observaciones-label">
       Observación general (opcional):
      </label>
     </div>
     <textarea
      className="observaciones-input"
      placeholder="Comentarios generales sobre este recurso para todas las tallas..."
      rows="2"
      value={inventario[categoria]?.[recurso]?.observaciones || ""}
      onChange={(e) =>
       actualizarInventario(categoria, recurso, "observaciones", e.target.value)
      }
      disabled={!observacionGeneralHabilitada}
     />
    </div>
   </div>
  );
 };

 const RenderCampoSimple = ({ recurso, categoria }) => {
  const [showSelector, setShowSelector] = React.useState(false);
  const [tempValue, setTempValue] = React.useState(null);
  const [observacionLocal, setObservacionLocal] = React.useState("");
  const selectorRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const observacionesRef = React.useRef(null);

  const numbers = Array.from({ length: 101 }, (_, i) => i);
  const currentValue = inventario[categoria]?.[recurso]?.cantidad || 0;
  const observacionHabilitada = currentValue > 0;

  // Sincronizar el estado local con el valor del inventario
  React.useEffect(() => {
   setObservacionLocal(inventario[categoria]?.[recurso]?.observaciones || "");
  }, [categoria, recurso]);

  const handleNumberSelect = (value) => {
   actualizarInventario(categoria, recurso, "cantidad", value);
   setShowSelector(false);
   setTempValue(null);
  };

  const handleOpenSelector = () => {
   setTempValue(currentValue);
   setShowSelector(!showSelector);
  };

  // Cerrar el selector al hacer clic fuera
  React.useEffect(() => {
   const handleClickOutside = (event) => {
    if (
     showSelector &&
     selectorRef.current &&
     !selectorRef.current.contains(event.target) &&
     containerRef.current &&
     !containerRef.current.contains(event.target) &&
     !(
      observacionesRef.current &&
      observacionesRef.current.contains(event.target)
     )
    ) {
     setShowSelector(false);
     setTempValue(null);
    }
   };

   document.addEventListener("mousedown", handleClickOutside);
   return () => {
    document.removeEventListener("mousedown", handleClickOutside);
   };
  }, [showSelector]);

  React.useEffect(() => {
   if (showSelector && selectorRef.current) {
    const currentElement = selectorRef.current.querySelector(
     `[data-value="${currentValue}"]`
    );
    if (currentElement) {
     setTimeout(() => {
      currentElement.scrollIntoView({ behavior: "smooth", block: "center" });
     }, 100);
    }
   }
  }, [showSelector, currentValue]);

  // Función para renderizar el modal usando portal
  const renderModal = () => {
   if (!showSelector) return null;

   return createPortal(
    <div className="cantidad-selector-modal" ref={selectorRef}>
     <div className="cantidad-selector-header">Seleccionar cantidad</div>

     <div className="cantidad-selector-current">
      <span>Valor: </span>
      <span className="cantidad-current-value">
       {tempValue !== null ? tempValue : currentValue}
      </span>
     </div>

     <div className="cantidad-selector-list">
      {numbers.map((num) => (
       <button
        key={num}
        data-value={num}
        className={`cantidad-selector-item ${
         (tempValue !== null ? tempValue : currentValue) === num
          ? "cantidad-selector-item-active"
          : ""
        }`}
        onClick={() => handleNumberSelect(num)}
        onMouseEnter={() => setTempValue(num)}
       >
        <span>{num}</span>
        {(tempValue !== null ? tempValue : currentValue) === num && (
         <svg
          className="cantidad-check-icon"
          fill="currentColor"
          viewBox="0 0 20 20"
         >
          <path
           fillRule="evenodd"
           d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
           clipRule="evenodd"
          />
         </svg>
        )}
       </button>
      ))}
     </div>

     <div className="cantidad-selector-footer">
      <button
       className="cantidad-btn-cancel"
       onClick={() => {
        setShowSelector(false);
        setTempValue(null);
       }}
      >
       Cancelar
      </button>
      <button
       className="cantidad-btn-confirm"
       onClick={() =>
        handleNumberSelect(tempValue !== null ? tempValue : currentValue)
       }
      >
       Confirmar
      </button>
     </div>
    </div>,
    document.body
   );
  };

  return (
   <div className="resource-content">
    <div className="cantidad-container" ref={containerRef}>
     <div className="cantidad-input-wrapper">
      <input
       type="text"
       className="cantidad-input"
       placeholder="Cantidad"
       value={currentValue}
       readOnly
       onClick={handleOpenSelector}
      />
      <button
       className="cantidad-selector-trigger"
       onClick={handleOpenSelector}
      >
       <svg
        className={`cantidad-arrow ${
         showSelector ? "cantidad-arrow-open" : ""
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
       >
        <path
         strokeLinecap="round"
         strokeLinejoin="round"
         strokeWidth={2}
         d="M19 9l-7 7-7-7"
        />
       </svg>
      </button>
     </div>
    </div>

    {/* Campo de observaciones corregido */}
    <div className="observaciones-container" ref={observacionesRef}>
     <div className="observaciones-header">
      <MessageSquare className="icon-sm" />
      <label className="observaciones-label">Observaciones:</label>
     </div>
     <textarea
      className="observaciones-input"
      placeholder="Comentarios adicionales sobre este recurso..."
      rows="2"
      value={observacionLocal}
      onChange={(e) => {
       setObservacionLocal(e.target.value);
      }}
      onBlur={() => {
       actualizarInventario(
        categoria,
        recurso,
        "observaciones",
        observacionLocal
       );
      }}
      disabled={!observacionHabilitada}
     />
    </div>

    {/* Renderizar el modal usando portal */}
    {renderModal()}
   </div>
  );
 };

 const renderSeccionInventario = (
  categoria,
  titulo,
  IconComponent,
  iconColor
 ) => {
  const recursos = tiposRecursos[categoria] || [];

  if (recursos.length === 0) {
   return (
    <div className="resources-container">
     <div className="section-header">
      <IconComponent className={`icon-lg ${iconColor}`} />
      <h3 className="section-title">{titulo}</h3>
     </div>
     <div className="empty-state">
      <p>No hay recursos disponibles en esta categoría</p>
     </div>
    </div>
   );
  }

  return (
   <div className="resources-container">
    <div className="section-header">
     <IconComponent className={`icon-lg ${iconColor}`} />
     <h3 className="section-title">{titulo}</h3>
    </div>

    <div
     className={`resources-grid ${
      categoria === "epp" ? "one-col" : "three-cols"
     }`}
    >
     {recursos.map((recurso) => (
      <div key={recurso.id} className="resource-card">
       <h4 className="resource-title">{recurso.nombre}</h4>
       {recurso.requiere_talla ? (
        renderCampoTallas(recurso.nombre, categoria)
       ) : (
        <RenderCampoSimple recurso={recurso.nombre} categoria={categoria} />
       )}
      </div>
     ))}
    </div>
   </div>
  );
 };

 // Estados de carga
 if (loading) {
  return (
   <div className="loading-container">
    <Loader className="icon-spin" />
    <p>Cargando datos...</p>
   </div>
  );
 }

 return (
  <div className="formulario-container">
   <div className="container">
    {/* Header */}
    <div className="header">
     <div className="header-content">
      <div className="header-icon">
       <Users className="icon-xl icon-green" />
      </div>
      <div>
       <h1 className="header-title">
        {brigadaId ? "Editar Brigada Forestal" : "Nueva Brigada Forestal"}
       </h1>
       <p className="header-subtitle">Gestión de recursos y equipamiento</p>
      </div>
     </div>
    </div>

    {/* Mensajes */}
    {error && (
     <div className="alert alert-error">
      <X className="icon" />
      {error}
     </div>
    )}

    {success && (
     <div className="alert alert-success">
      <Check className="icon" />
      {success}
     </div>
    )}

    <form
     id="brigada-form"
     onSubmit={(e) => {
      e.preventDefault();
      console.log("Formulario enviado");
      handleSubmit(e);
     }}
    >
     {/* Indicador de progreso */}
     <div className="progress-container">
      <div className="progress-header">
       <span className="progress-title">Progreso del formulario:</span>
       <span className="progress-counter">
        {pasoActual} de {pasos.length}
       </span>
      </div>
      <div className="progress-bar">
       <div
        className="progress-fill"
        style={{ width: `${(pasoActual / pasos.length) * 100}%` }}
       />
      </div>
      {pasoActual <= pasos.length - 1 && (
       <div className="current-step-info">
        {React.createElement(pasos[pasoActual].icono, { className: "icon" })}
        <span className="current-step-name">{pasos[pasoActual].label}</span>
       </div>
      )}
     </div>

     {/* Navegación por pestañas */}
     <div className="nav-container">
      <div className="nav-title">Navegación por pasos:</div>

      <div className="nav-tabs">
       {pasos.map((item, index) => {
        const IconComponent = item.icono;
        return (
         <div
          key={item.id}
          className={`nav-tab ${index === pasoActual ? "active" : ""} ${
           index < pasoActual ? "completed" : ""
          }`}
          style={{ opacity: index <= pasoActual ? 1 : 0.5 }}
         >
          <IconComponent className="icon" />
          {item.label}
         </div>
        );
       })}
      </div>
      <div>{/* Completa todos los pasos para crear tu brigada digital */}</div>
     </div>

     {/* Navegación por pasos */}
     {renderPaso()}

     {/* Contenido */}
     <div className="content-container">
      {pasoActual === 0 && (
       <div className="resources-container">
        <div className="section-header">
         <Users className="icon-lg icon-blue" />
         <h3 className="section-title">Información de la Brigada</h3>
        </div>

        <div className="form-grid two-cols">
         <div className="form-group">
          <label className="form-label">Nombre de la Brigada *</label>
          <input
           type="text"
           required
           className="form-input"
           value={brigada.nombre}
           onChange={(e) => setBrigada({ ...brigada, nombre: e.target.value })}
           placeholder="Ej: Brigada Central"
          />
         </div>

         <div className="form-group">
          <label className="form-label">Cantidad de Bomberos Activos</label>
          <input
           type="number"
           min="0"
           className="form-input"
           value={brigada.cantidad_bomberos_activos}
           onChange={(e) =>
            setBrigada({
             ...brigada,
             cantidad_bomberos_activos: e.target.value,
            })
           }
           placeholder="Ej: 25"
          />
         </div>

         <div className="form-group">
          <label className="form-label">Celular del Comandante</label>
          <input
           type="tel"
           className="form-input"
           value={brigada.contacto_celular_comandante}
           onChange={(e) =>
            setBrigada({
             ...brigada,
             contacto_celular_comandante: e.target.value,
            })
           }
           placeholder="Ej: +591 70123456"
          />
         </div>

         <div className="form-group">
          <label className="form-label">Encargado de Logística</label>
          <input
           type="text"
           className="form-input"
           value={brigada.encargado_logistica}
           onChange={(e) =>
            setBrigada({ ...brigada, encargado_logistica: e.target.value })
           }
           placeholder="Nombre completo"
          />
         </div>

         <div className="form-group">
          <label className="form-label">Celular de Logística</label>
          <input
           type="tel"
           className="form-input"
           value={brigada.contacto_celular_logistica}
           onChange={(e) =>
            setBrigada({
             ...brigada,
             contacto_celular_logistica: e.target.value,
            })
           }
           placeholder="Ej: +591 70123456"
          />
         </div>

         <div className="form-group">
          <label className="form-label">Número de Emergencia Público</label>
          <input
           type="tel"
           className="form-input"
           value={brigada.numero_emergencia_publico}
           onChange={(e) =>
            setBrigada({
             ...brigada,
             numero_emergencia_publico: e.target.value,
            })
           }
           placeholder="Ej: 119"
          />
         </div>
        </div>
       </div>
      )}

      {pasoActual === 1 &&
       renderSeccionInventario(
        "epp",
        "Equipo de Protección Personal (EPP)",
        Package,
        "icon-orange"
       )}
      {pasoActual === 2 &&
       renderSeccionInventario(
        "herramientas",
        "Herramientas",
        Wrench,
        "icon-gray"
       )}
      {pasoActual === 3 &&
       renderSeccionInventario(
        "logistica",
        "Logística y Vehículos",
        Fuel,
        "icon-blue"
       )}
      {pasoActual === 4 &&
       renderSeccionInventario(
        "alimentacion",
        "Alimentación y Bebidas",
        Utensils,
        "icon-green"
       )}
      {pasoActual === 5 &&
       renderSeccionInventario("campo", "Equipo de Campo", Tent, "icon-purple")}
      {pasoActual === 6 &&
       renderSeccionInventario(
        "limpieza",
        "Productos de Limpieza",
        Droplets,
        "icon-cyan"
       )}
      {pasoActual === 7 &&
       renderSeccionInventario(
        "medicamentos",
        "Medicamentos y Primeros Auxilios",
        Heart,
        "icon-red"
       )}
      {pasoActual === 8 &&
       renderSeccionInventario(
        "rescate_animal",
        "Rescate Animal",
        PawPrint,
        "icon-amber"
       )}
      {/* Paso de revisión final - VERSIÓN MEJORADA */}
      {pasoActual === 9 && (
       <div className="resources-container">
        <div className="section-header">
         <Check className="icon-lg icon-green" />
         <h2 className="section-title">Revisión Final</h2>
        </div>
        <div className="section-content">
         {/* Información General de la Brigada */}
         <div className="review-section">
          <div className="review-section-header">
           <Users className="icon-lg icon-blue" />
           <h3 className="review-section-title">Información de la Brigada</h3>
          </div>
          <div className="review-grid">
           <div className="review-item">
            <span className="review-label">Nombre de la Brigada:</span>
            <span className="review-value primary">
             {brigada.nombre || "No especificado"}
            </span>
           </div>
           <div className="review-item">
            <span className="review-label">Cantidad de Bomberos Activos:</span>
            <span className="review-value">
             {brigada.cantidad_bomberos_activos || "No especificado"}
            </span>
           </div>
           <div className="review-item">
            <span className="review-label">Celular del Comandante:</span>
            <span className="review-value">
             {brigada.contacto_celular_comandante || "No especificado"}
            </span>
           </div>
           <div className="review-item">
            <span className="review-label">Encargado de Logística:</span>
            <span className="review-value">
             {brigada.encargado_logistica || "No especificado"}
            </span>
           </div>
           <div className="review-item">
            <span className="review-label">Celular de Logística:</span>
            <span className="review-value">
             {brigada.contacto_celular_logistica || "No especificado"}
            </span>
           </div>
           <div className="review-item">
            <span className="review-label">Número de Emergencia Público:</span>
            <span className="review-value emergency">
             {brigada.numero_emergencia_publico || "No especificado"}
            </span>
           </div>
          </div>
         </div>

         {/* Resumen de Inventario */}
         <div className="review-section">
          <div className="review-section-header">
           <Package className="icon-lg icon-orange" />
           <h3 className="review-section-title">Resumen de Inventario</h3>
          </div>
          <div className="inventory-summary">
           {(() => {
            const categoriasConRecursos = Object.entries(inventario).filter(
             ([, recursos]) => {
              return Object.values(recursos).some((recurso) => {
               if (recurso.cantidad && recurso.cantidad > 0) return true;
               return Object.entries(recurso).some(
                ([key, valor]) =>
                 key !== "observaciones" &&
                 typeof valor === "number" &&
                 valor > 0
               );
              });
             }
            );

            const totalCategorias = categoriasConRecursos.length;
            const totalRecursos = categoriasConRecursos.reduce(
             (total, [, recursos]) => {
              return (
               total +
               Object.keys(recursos).filter((recurso) => {
                const datos = recursos[recurso];
                if (datos.cantidad && datos.cantidad > 0) return true;
                return Object.entries(datos).some(
                 ([key, valor]) =>
                  key !== "observaciones" &&
                  typeof valor === "number" &&
                  valor > 0
                );
               }).length
              );
             },
             0
            );
            const totalUnidades = categoriasConRecursos.reduce(
             (total, [, recursos]) => {
              return (
               total +
               Object.values(recursos).reduce((subtotal, recurso) => {
                if (recurso.cantidad) {
                 return subtotal + (parseInt(recurso.cantidad) || 0);
                } else {
                 return (
                  subtotal +
                  Object.entries(recurso).reduce((sum, [key, val]) => {
                   return key !== "observaciones"
                    ? sum + (typeof val === "number" ? val : 0)
                    : sum;
                  }, 0)
                 );
                }
               }, 0)
              );
             },
             0
            );

            return (
             <div className="summary-stats">
              <div className="summary-stat">
               <span className="stat-number">{totalCategorias}</span>
               <span className="stat-label">Categorías con recursos</span>
              </div>
              <div className="summary-stat">
               <span className="stat-number">{totalRecursos}</span>
               <span className="stat-label">Tipos de recursos</span>
              </div>
              <div className="summary-stat">
               <span className="stat-number">{totalUnidades}</span>
               <span className="stat-label">Unidades totales</span>
              </div>
             </div>
            );
           })()}
          </div>
         </div>

         {/* Detalle por Categorías */}
         {Object.entries(inventario).map(([categoria, recursos]) => {
          // Filtrar solo recursos que tienen cantidades
          const recursosConCantidades = Object.entries(recursos).filter(
           ([, datos]) => {
            if (datos.cantidad && datos.cantidad > 0) return true;
            return Object.entries(datos).some(
             ([key, valor]) =>
              key !== "observaciones" && typeof valor === "number" && valor > 0
            );
           }
          );

          if (recursosConCantidades.length === 0) return null;

          // Encontrar el paso correspondiente para obtener el icono y color
          const pasoCategoria = pasos.find((paso) => paso.id === categoria);
          const IconComponent = pasoCategoria ? pasoCategoria.icono : Package;
          const colorClass = pasoCategoria ? pasoCategoria.color : "icon-gray";

          return (
           <div key={categoria} className="review-section">
            <div className="review-section-header">
             <IconComponent className={`icon-lg ${colorClass}`} />
             <h3 className="review-section-title">
              {categoria === "epp" && "Equipo de Protección Personal (EPP)"}
              {categoria === "herramientas" && "Herramientas"}
              {categoria === "logistica" && "Logística y Vehículos"}
              {categoria === "alimentacion" && "Alimentación y Bebidas"}
              {categoria === "campo" && "Equipo de Campo"}
              {categoria === "limpieza" && "Productos de Limpieza"}
              {categoria === "medicamentos" &&
               "Medicamentos y Primeros Auxilios"}
              {categoria === "rescate_animal" && "Rescate Animal"}
             </h3>
             <span className="category-count">
              {recursosConCantidades.length} recurso
              {recursosConCantidades.length !== 1 ? "s" : ""}
             </span>
            </div>

            <div className="resources-review-grid">
             {recursosConCantidades.map(([nombreRecurso, datos]) => {
              // Verificar si es un recurso con tallas o cantidad simple
              const tieneQuantity = datos.cantidad !== undefined;

              return (
               <div key={nombreRecurso} className="resource-review-card">
                <div className="resource-review-header">
                 <h4 className="resource-review-name">{nombreRecurso}</h4>
                </div>

                <div className="resource-review-details">
                 {tieneQuantity ? (
                  // Recurso con cantidad simple
                  <div className="quantity-display">
                   <span className="quantity-number">{datos.cantidad}</span>
                   <span className="quantity-label">unidades</span>
                  </div>
                 ) : (
                  // Recurso con tallas
                  <div className="sizes-display">
                   <div className="sizes-grid">
                    {Object.entries(datos)
                     .filter(
                      ([key, cantidad]) =>
                       key !== "observaciones" &&
                       key !== "observaciones_tallas" &&
                       cantidad > 0
                     )
                     .map(([talla, cantidad]) => (
                      <div key={talla} className="size-item">
                       <span className="size-label">{talla}</span>
                       <span className="size-quantity">{cantidad}</span>
                      </div>
                     ))}
                   </div>
                   <div className="total-display">
                    <span className="total-label">Total:</span>
                    <span className="total-number">
                     {Object.entries(datos)
                      .filter(
                       ([key]) =>
                        key !== "observaciones" &&
                        key !== "observaciones_tallas"
                      )
                      .reduce(
                       (sum, [, val]) =>
                        sum + (typeof val === "number" ? val : 0),
                       0
                      )}{" "}
                     unidades
                    </span>
                   </div>
                   {datos.observaciones_tallas && (
                    <div className="observaciones-review">
                     <div className="observaciones-review-header">
                      <MessageSquare className="icon-sm" />
                      <span className="observaciones-review-label">
                       Observaciones por talla:
                      </span>
                     </div>
                     <ul className="observaciones-por-talla-list">
                      {Object.entries(datos.observaciones_tallas)
                       .filter(
                        ([, txt]) => typeof txt === "string" && txt.trim()
                       )
                       .map(([talla, txt]) => (
                        <li
                         key={talla}
                         className="observaciones-por-talla-item"
                        >
                         <span className="size-label">{talla}:</span> {txt}
                        </li>
                       ))}
                     </ul>
                    </div>
                   )}
                  </div>
                 )}

                 {/* Mostrar observaciones si existen */}
                 {datos.observaciones && datos.observaciones.trim() && (
                  <div className="observaciones-review">
                   <div className="observaciones-review-header">
                    <MessageSquare className="icon-sm" />
                    <span className="observaciones-review-label">
                     Observaciones:
                    </span>
                   </div>
                   <p className="observaciones-review-text">
                    {datos.observaciones}
                   </p>
                  </div>
                 )}
                </div>
               </div>
              );
             })}
            </div>
           </div>
          );
         })}

         {/* Mensaje si no hay recursos configurados */}
         {Object.keys(inventario).length === 0 && (
          <div className="review-section">
           <div className="empty-inventory-message">
            <AlertCircle className="icon-lg icon-amber" />
            <h3>No se han configurado recursos</h3>
            <p>
             Regrese a los pasos anteriores para configurar el inventario de
             recursos.
            </p>
           </div>
          </div>
         )}

         {/* Notas importantes */}
         <div className="review-section">
          <div className="review-notes">
           <div className="notes-header">
            <AlertCircle className="icon icon-orange" />
            <h4>Notas Importantes</h4>
           </div>
           <ul className="notes-list">
            <li>
             Verifique que toda la información esté correcta antes de guardar
            </li>
            <li>
             Los recursos con cantidad 0 no se guardarán en el inventario
            </li>
            <li>
             Puede regresar a cualquier paso anterior para hacer modificaciones
            </li>
            <li>
             Una vez guardada, podrá editar esta información posteriormente
            </li>
           </ul>
          </div>
         </div>
        </div>
       </div>
      )}
      {/* Fin del paso de revisión final */}
      {pasoActual === pasos.length && (
       <div className="final-step">
        <div className="final-step-content">
         <CheckCircle className="icon-lg icon-green" />
         <h3>¡Brigada guardada con exito!</h3>
         <p>¡Gracias por completar el formulario de brigada!</p>
        </div>
       </div>
      )}
     </div>

     {/*Navegación por pasos*/}
    </form>

    {/* Información adicional */}
    <div className="info-container">
     <div className="info-content">
      <AlertCircle className="icon icon-blue" />
      <div className="info-text">
       <p className="info-title">Instrucciones:</p>
       <ul className="info-list">
        <li>
         Complete la información básica de la brigada en la primera sección
        </li>
        <li>
         Para equipos con tallas, especifique las cantidades por cada talla
         disponible
        </li>
        <li>Los recursos se cargan dinámicamente desde la base de datos</li>
        <li>Los campos con asterisco (*) son obligatorios</li>
        <li>Los datos se guardan automáticamente al completar el formulario</li>
       </ul>
      </div>
     </div>
    </div>
    <ModalTransicion />
    <ModalConfirmacion />
   </div>
  </div>
 );
};

export default FormularioBrigadas;
