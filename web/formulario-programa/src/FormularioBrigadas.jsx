import React, { useMemo ,useState, useEffect } from 'react';
import { Save, AlertCircle, Users, Package, Wrench, Fuel, Utensils, Tent, Droplets, Heart, PawPrint, ChevronLeft, ChevronRight, Loader, Check, X, CheckCircle, MessageSquare } from 'lucide-react';
import './FormularioBrigadas.css'; // Asegúrate de tener un archivo CSS para estilos
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
    nombre: '',
    cantidad_bomberos_activos: '',
    contacto_celular_comandante: '',
    encargado_logistica: '',
    contacto_celular_logistica: '',
    numero_emergencia_publico: ''
  });

  const [inventario, setInventario] = useState({});
  const [pasoActual, setPasoActual] = useState(0);

  // Configuración de pasos
  const pasos = [
    { id: 'brigada', label: 'Información Brigada', icono: Users, color: 'icon-blue' },
    { id: 'epp', label: 'EPP', icono: Package, color: 'icon-orange' },
    { id: 'herramientas', label: 'Herramientas', icono: Wrench, color: 'icon-gray' },
    { id: 'logistica', label: 'Logística', icono: Fuel, color: 'icon-blue' },
    { id: 'alimentacion', label: 'Alimentación', icono: Utensils, color: 'icon-green' },
    { id: 'campo', label: 'Equipo Campo', icono: Tent, color: 'icon-purple' },
    { id: 'limpieza', label: 'Limpieza', icono: Droplets, color: 'icon-cyan' },
    { id: 'medicamentos', label: 'Medicamentos', icono: Heart, color: 'icon-red' },
    { id: 'rescate_animal', label: 'Rescate Animal', icono: PawPrint, color: 'icon-amber' },
    { id: 'revisión', label: 'Revisión Final', icono: Check, color: 'icon-green' }
  ];

  // Mapeo de categorías API a pasos
  const categoriaMap = useMemo(() => ({
    'EPP': 'epp',
    'HERRAMIENTAS': 'herramientas',
    'LOGISTICA': 'logistica',
    'ALIMENTACION': 'alimentacion',
    'CAMPO': 'campo',
    'LIMPIEZA': 'limpieza',
    'MEDICAMENTOS': 'medicamentos',
    'RESCATE_ANIMAL': 'rescate_animal'
  }), []);

  // API Base URL (ajustar según tu configuración)
  const API_BASE = 'http://localhost:3000/api'; // Cambiar por tu URL base

  // Funciones API
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
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
      console.error(`API Error ${endpoint} con opciones ${JSON.stringify(options.body)}:`, error);
      throw error;
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar tallas
        const tallasData = await apiCall('/tallas');
        setTallas(tallasData);

        // Cargar tipos de recursos
        const tiposData = await apiCall('/tipos-recursos?activo=true');
        const tiposPorCategoria = tiposData.reduce((acc, tipo) => {
          const categoria = categoriaMap[tipo.categoria];
          if (categoria) {
            if (!acc[categoria]) acc[categoria] = [];
            acc[categoria].push(tipo);
          }
          return acc;
        }, {});
        console.log('Tipos de recursos por categoría:', tiposPorCategoria);
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
      
      items.forEach(item => {
        const nombreRecurso = item.tipo_recurso_nombre;
        
        if (!inventarioFormato[categoria][nombreRecurso]) {
          inventarioFormato[categoria][nombreRecurso] = {
            observaciones: item.observaciones || ''
          };
        }

        if (item.talla_codigo) {
          inventarioFormato[categoria][nombreRecurso][item.talla_codigo] = item.cantidad || 0;
        } else {
          inventarioFormato[categoria][nombreRecurso].cantidad = item.cantidad || 0;
        }
      });
    });

    return inventarioFormato;
  };

  // Actualizar inventario
  const actualizarInventario = (categoria, recurso, campo, valor) => {
    setInventario(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [recurso]: {
          ...prev[categoria]?.[recurso],
          [campo]: campo === 'observaciones' ? valor : (parseInt(valor) || 0)
        }
      }
    }));
  };

  // Navegación
  const siguientePaso = () => {
    setPasoActual(prev => {
      const nuevoPaso = prev + 1;
      console.log('Paso actual:', nuevoPaso);
      return nuevoPaso;
    });
  };
  const pasoAnterior = () => {
    if (pasoActual > 0) {
      setPasoActual(pasoActual - 1);
    }
  };

  const validarPasoActual = () => {
    if (pasoActual === 0) {
      return brigada.nombre.trim() !== '';
    }
    return true;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (pasoActual !== pasos.length - 1) {
      console.log('Submit bloqueado - no estamos en el último paso');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // 1. Guardar/actualizar brigada
      let brigadaGuardada;
      if (brigadaId) {
        brigadaGuardada = await apiCall(`/brigadas/${brigadaId}`, {
          method: 'PUT',
          body: JSON.stringify(brigada)
        });
      } else {
        brigadaGuardada = await apiCall('/brigadas', {
          method: 'POST',
          body: JSON.stringify(brigada)
        });
      }

      const brigadaIdFinal = brigadaGuardada.id;

      // 2. Guardar inventario
      await guardarInventario(brigadaIdFinal);

      setSuccess('Brigada guardada exitosamente');
      onSuccess(brigadaGuardada);

      // 3. Completar la barra de progreso
      setPasoActual(pasos.length); // Ir al último paso
      console.log(`Formulario enviado exitosamente: ${pasos.length} y paso actual ${pasoActual}`);

    } catch (err) {
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Guardar inventario por categorías
  const guardarInventario = async (brigadaIdParam) => {
    const categorias = Object.keys(inventario);
  
    for (const categoria of categorias) {
      const recursos = inventario[categoria];
      
      for (const [nombreRecurso, datos] of Object.entries(recursos)) {
        // Encontrar el tipo de recurso
        const tipoRecurso = tiposRecursos[categoria]?.find(t => t.nombre === nombreRecurso);
        if (!tipoRecurso) continue;
  
        const observaciones = datos.observaciones || '';
  
        if (tipoRecurso.requiere_talla) {
          // Guardar por cada talla
          for (const [talla, cantidad] of Object.entries(datos)) {
            if (talla !== 'cantidad' && talla !== 'observaciones' && cantidad > 0) {
              const tallaObj = tallas.find(t => t.codigo === talla);
              if (tallaObj) {
                await apiCall('/inventario/epp', {
                  method: 'POST',
                  body: JSON.stringify({
                    brigada_id: brigadaIdParam,
                    tipo_recurso_id: tipoRecurso.id,
                    talla_id: tallaObj.id,
                    cantidad: cantidad,
                    observaciones: observaciones
                  })
                });
              }
            }
          }
        } else {
          // Guardar cantidad simple
          if (datos.cantidad > 0) {
            const endpoint = `/inventario/${categoria.replace('_', '-')}`;
            await apiCall(endpoint, {
              method: 'POST',
              body: JSON.stringify({
                brigada_id: brigadaIdParam,
                tipo_recurso_id: tipoRecurso.id,
                cantidad: datos.cantidad,
                observaciones: observaciones
              })
            });
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
            Paso {pasoActual} de {pasos.length}: { pasoActual < pasos.length ? pasos[pasoActual].label : '' }
          </span>
        </div>
  
        <div className="step-nav-right">
          {pasoActual < pasos.length - 1 ? (
            <button
              type="button"  // ✅ Asegurar que es tipo button
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
              type="submit"  // ✅ Solo este botón debe hacer submit
              disabled={saving || !validarPasoActual()}
              className="step-button step-button-submit"
            >
              {saving ? <Loader className="icon icon-spin" /> : <Save className="icon" />}
              {saving ? 'Guardando...' : 'Guardar Brigada'}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Renderizado de campos
  const renderCampoTallas = (recurso, categoria) => {
    const tipoRecurso = tiposRecursos[categoria]?.find(t => t.nombre === recurso);
    if (!tipoRecurso) return null;
  
    return (
      <div className="resource-content">
        <div className="tallas-grid">
          {tallas.map(talla => (
            <div key={talla.codigo} className="talla-group">
              <label className="talla-label">{talla.codigo}</label>
              <input
                type="number"
                min="0"
                className="talla-input"
                placeholder="0"
                value={inventario[categoria]?.[recurso]?.[talla.codigo] || ''}
                onChange={(e) => actualizarInventario(categoria, recurso, talla.codigo, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderCampoSimple = (recurso, categoria) => {
    return (
      <div className="resource-content">
        <div className="cantidad-container">
          <input
            type="number"
            min="0"
            className="cantidad-input"
            placeholder="Cantidad"
            value={inventario[categoria]?.[recurso]?.cantidad || ''}
            onChange={(e) => actualizarInventario(categoria, recurso, 'cantidad', e.target.value)}
          />
        </div>
        
        {/* Campo de observaciones */}
        <div className="observaciones-container">
          <div className="observaciones-header">
            <MessageSquare className="icon-sm" />
            <label className="observaciones-label">Observaciones:</label>
          </div>
          <textarea
            className="observaciones-input"
            placeholder="Comentarios adicionales sobre este recurso..."
            rows="2"
            value={inventario[categoria]?.[recurso]?.observaciones || ''}
            onChange={(e) => actualizarInventario(categoria, recurso, 'observaciones', e.target.value)}
          />
        </div>
      </div>
    );
  };

  const renderSeccionInventario = (categoria, titulo, IconComponent, iconColor) => {
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
        
        <div className={`resources-grid ${categoria === 'epp' ? 'one-col' : 'three-cols'}`}>
          {recursos.map(recurso => (
            <div key={recurso.id} className="resource-card">
              <h4 className="resource-title">{recurso.nombre}</h4>
              {recurso.requiere_talla ? 
                renderCampoTallas(recurso.nombre, categoria) : 
                renderCampoSimple(recurso.nombre, categoria)
              }
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
                {brigadaId ? 'Editar Brigada Forestal' : 'Nueva Brigada Forestal'}
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

        <form id="brigada-form" onSubmit={(e) => {
          e.preventDefault();
          console.log('Formulario enviado');
          handleSubmit(e)
        }}>
          {/* Indicador de progreso */}
          <div className="progress-container">
            <div className="progress-header">
              <span className="progress-title">Progreso del formulario:</span>
              <span className="progress-counter">{pasoActual} de {pasos.length}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((pasoActual) / pasos.length) * 100}%` }}
              />
            </div>
            {pasoActual <= pasos.length - 1 && (
              <div className="current-step-info">
                {React.createElement(pasos[pasoActual].icono, { className: "icon" })}
                <span className="current-step-name">{pasos[pasoActual].label}</span>
              </div>
              )
            }
          </div>

          {/* Navegación por pestañas */}
          <div className="nav-container">
            <div className="nav-tabs">
              {pasos.map((item, index) => {
                const IconComponent = item.icono;
                return (
                  <div
                    key={item.id}
                    className={`nav-tab ${index === pasoActual ? 'active' : ''} ${index < pasoActual ? 'completed' : ''}`}
                    style={{ opacity: index <= pasoActual ? 1 : 0.5 }}
                  >
                    <IconComponent className="icon" />
                    {item.label}
                  </div>
                );
              })}
            </div>
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
                      onChange={(e) => setBrigada({...brigada, nombre: e.target.value})}
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
                      onChange={(e) => setBrigada({...brigada, cantidad_bomberos_activos: e.target.value})}
                      placeholder="Ej: 25"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Celular del Comandante</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={brigada.contacto_celular_comandante}
                      onChange={(e) => setBrigada({...brigada, contacto_celular_comandante: e.target.value})}
                      placeholder="Ej: +591 70123456"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Encargado de Logística</label>
                    <input
                      type="text"
                      className="form-input"
                      value={brigada.encargado_logistica}
                      onChange={(e) => setBrigada({...brigada, encargado_logistica: e.target.value})}
                      placeholder="Nombre completo"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Celular de Logística</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={brigada.contacto_celular_logistica}
                      onChange={(e) => setBrigada({...brigada, contacto_celular_logistica: e.target.value})}
                      placeholder="Ej: +591 70123456"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Número de Emergencia Público</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={brigada.numero_emergencia_publico}
                      onChange={(e) => setBrigada({...brigada, numero_emergencia_publico: e.target.value})}
                      placeholder="Ej: 119"
                    />
                  </div>
                </div>
              </div>
            )}

            {pasoActual === 1 && renderSeccionInventario('epp', 'Equipo de Protección Personal (EPP)', Package, 'icon-orange')}
            {pasoActual === 2 && renderSeccionInventario('herramientas', 'Herramientas', Wrench, 'icon-gray')}
            {pasoActual === 3 && renderSeccionInventario('logistica', 'Logística y Vehículos', Fuel, 'icon-blue')}
            {pasoActual === 4 && renderSeccionInventario('alimentacion', 'Alimentación y Bebidas', Utensils, 'icon-green')}
            {pasoActual === 5 && renderSeccionInventario('campo', 'Equipo de Campo', Tent, 'icon-purple')}
            {pasoActual === 6 && renderSeccionInventario('limpieza', 'Productos de Limpieza', Droplets, 'icon-cyan')}
            {pasoActual === 7 && renderSeccionInventario('medicamentos', 'Medicamentos y Primeros Auxilios', Heart, 'icon-red')}
            {pasoActual === 8 && renderSeccionInventario('rescate_animal', 'Rescate Animal', PawPrint, 'icon-amber')}
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
                      <span className="review-value primary">{brigada.nombre || 'No especificado'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Cantidad de Bomberos Activos:</span>
                      <span className="review-value">{brigada.cantidad_bomberos_activos || 'No especificado'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Celular del Comandante:</span>
                      <span className="review-value">{brigada.contacto_celular_comandante || 'No especificado'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Encargado de Logística:</span>
                      <span className="review-value">{brigada.encargado_logistica || 'No especificado'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Celular de Logística:</span>
                      <span className="review-value">{brigada.contacto_celular_logistica || 'No especificado'}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Número de Emergencia Público:</span>
                      <span className="review-value emergency">{brigada.numero_emergencia_publico || 'No especificado'}</span>
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
                      const categoriasConRecursos = Object.entries(inventario).filter(([, recursos]) => {
                        return Object.values(recursos).some(recurso => {
                          if (recurso.cantidad && recurso.cantidad > 0) return true;
                          return Object.entries(recurso).some(([key, valor]) => key !== 'observaciones' && typeof valor === 'number' && valor > 0);
                        });
                      });
          
                      const totalCategorias = categoriasConRecursos.length;
                      const totalRecursos = categoriasConRecursos.reduce((total, [, recursos]) => {
                        return total + Object.keys(recursos).filter(recurso => {
                          const datos = recursos[recurso];
                          if (datos.cantidad && datos.cantidad > 0) return true;
                          return Object.entries(datos).some(([key, valor]) => key !== 'observaciones' && typeof valor === 'number' && valor > 0);
                        }).length;
                      }, 0);
                      const totalUnidades = categoriasConRecursos.reduce((total, [, recursos]) => {
                        return total + Object.values(recursos).reduce((subtotal, recurso) => {
                          if (recurso.cantidad) {
                            return subtotal + (parseInt(recurso.cantidad) || 0);
                          } else {
                            return subtotal + Object.entries(recurso).reduce((sum, [key, val]) => {
                              return key !== 'observaciones' ? sum + (typeof val === 'number' ? val : 0) : sum;
                            }, 0);
                          }
                        }, 0);
                      }, 0);
          
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
                  const recursosConCantidades = Object.entries(recursos).filter(([, datos]) => {
                    if (datos.cantidad && datos.cantidad > 0) return true;
                    return Object.entries(datos).some(([key, valor]) => key !== 'observaciones' && typeof valor === 'number' && valor > 0);
                  });
          
                  if (recursosConCantidades.length === 0) return null;
          
                  // Encontrar el paso correspondiente para obtener el icono y color
                  const pasoCategoria = pasos.find(paso => paso.id === categoria);
                  const IconComponent = pasoCategoria ? pasoCategoria.icono : Package;
                  const colorClass = pasoCategoria ? pasoCategoria.color : 'icon-gray';
          
                  return (
                    <div key={categoria} className="review-section">
                      <div className="review-section-header">
                        <IconComponent className={`icon-lg ${colorClass}`} />
                        <h3 className="review-section-title">
                          {categoria === 'epp' && 'Equipo de Protección Personal (EPP)'}
                          {categoria === 'herramientas' && 'Herramientas'}
                          {categoria === 'logistica' && 'Logística y Vehículos'}
                          {categoria === 'alimentacion' && 'Alimentación y Bebidas'}
                          {categoria === 'campo' && 'Equipo de Campo'}
                          {categoria === 'limpieza' && 'Productos de Limpieza'}
                          {categoria === 'medicamentos' && 'Medicamentos y Primeros Auxilios'}
                          {categoria === 'rescate_animal' && 'Rescate Animal'}
                        </h3>
                        <span className="category-count">
                          {recursosConCantidades.length} recurso{recursosConCantidades.length !== 1 ? 's' : ''}
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
                                        .filter(([key, cantidad]) => key !== 'observaciones' && cantidad > 0)
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
                                          .filter(([key]) => key !== 'observaciones')
                                          .reduce((sum, [, val]) => sum + (typeof val === 'number' ? val : 0), 0)} unidades
                                      </span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Mostrar observaciones si existen */}
                                {datos.observaciones && datos.observaciones.trim() && (
                                  <div className="observaciones-review">
                                    <div className="observaciones-review-header">
                                      <MessageSquare className="icon-sm" />
                                      <span className="observaciones-review-label">Observaciones:</span>
                                    </div>
                                    <p className="observaciones-review-text">{datos.observaciones}</p>
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
                      <p>Regrese a los pasos anteriores para configurar el inventario de recursos.</p>
                    </div>
                  </div>
                )}
          
                {/* Notas importantes */}
                <div className="review-section">
                  <div className="review-notes">
                    <div className="notes-header">
                      <AlertCircle className="icon icon-blue" />
                      <h4>Notas Importantes</h4>
                    </div>
                    <ul className="notes-list">
                      <li>• Verifique que toda la información esté correcta antes de guardar</li>
                      <li>• Los recursos con cantidad 0 no se guardarán en el inventario</li>
                      <li>• Puede regresar a cualquier paso anterior para hacer modificaciones</li>
                      <li>• Una vez guardada, podrá editar esta información posteriormente</li>
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
                  <h3 >¡Brigada guardada con exito!</h3>
                  <p>¡Gracias por completar el formulario de brigada!</p>
                </div>
              </div>
            )}
          </div>

          {/*Navegación por pasos*/}
          {renderPaso()}
        </form>

        {/* Información adicional */}
        <div className="info-container">
          <div className="info-content">
            <AlertCircle className="icon icon-blue" />
            <div className="info-text">
              <p className="info-title">Instrucciones:</p>
              <ul className="info-list">
                <li>• Complete la información básica de la brigada en la primera sección</li>
                <li>• Para equipos con tallas, especifique las cantidades por cada talla disponible</li>
                <li>• Los recursos se cargan dinámicamente desde la base de datos</li>
                <li>• Los campos con asterisco (*) son obligatorios</li>
                <li>• Los datos se guardan automáticamente al completar el formulario</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioBrigadas;