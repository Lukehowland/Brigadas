-- BASE DE DATOS SISTEMA BOMBEROS FORESTALES (PostgreSQL)
-- Estructura completa migrada desde SQL Server a PostgreSQL
-- Incluye tablas, constraints, índices/uniques, triggers y datos de ejemplo

-- Opcional: limpiar objetos existentes para ejecución repetible
DO $$
BEGIN
  EXECUTE 'DROP TABLE IF EXISTS inventario_rescate_animal CASCADE';
  EXECUTE 'DROP TABLE IF EXISTS inventario_medicamentos CASCADE';
  EXECUTE 'DROP TABLE IF EXISTS inventario_limpieza CASCADE';
  EXECUTE 'DROP TABLE IF EXISTS inventario_campo CASCADE';
  EXECUTE 'DROP TABLE IF EXISTS inventario_alimentacion CASCADE';
  EXECUTE 'DROP TABLE IF EXISTS inventario_logistica CASCADE';
  EXECUTE 'DROP TABLE IF EXISTS inventario_herramientas CASCADE';
  EXECUTE 'DROP TABLE IF EXISTS inventario_epp CASCADE';
  EXECUTE 'DROP TABLE IF EXISTS tipos_recursos CASCADE';
  EXECUTE 'DROP TABLE IF EXISTS tallas CASCADE';
  EXECUTE 'DROP TABLE IF EXISTS brigadas CASCADE';
EXCEPTION WHEN others THEN
  -- ignorar si no existen
  NULL;
END$$;

-- ================================================
-- TABLAS PRINCIPALES
-- ================================================

-- Tabla de Brigadas
CREATE TABLE brigadas (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  cantidad_bomberos_activos INTEGER DEFAULT 0,
  contacto_celular_comandante VARCHAR(20),
  encargado_logistica VARCHAR(100),
  contacto_celular_logistica VARCHAR(20),
  numero_emergencia_publico VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- CATÁLOGOS DE TALLAS Y TIPOS
-- ================================================

-- Catálogo de Tallas
CREATE TABLE tallas (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL UNIQUE, -- XS, S, M, L, XL, XXL
  descripcion VARCHAR(20) NOT NULL,
  numero_equivalente INTEGER NULL -- Para botas: 37, 38, 39, etc.
);

-- Tipos de Equipment/Recursos
CREATE TABLE tipos_recursos (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  categoria VARCHAR(50) NOT NULL, -- EPP, HERRAMIENTAS, LOGISTICA, etc.
  nombre VARCHAR(100) NOT NULL,
  requiere_talla BOOLEAN DEFAULT FALSE,
  requiere_cantidad BOOLEAN DEFAULT TRUE,
  activo BOOLEAN DEFAULT TRUE
);

-- ================================================
-- INVENTARIO POR BRIGADA
-- ================================================

-- Equipamiento EPP por Brigada
CREATE TABLE inventario_epp (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brigada_id INTEGER NOT NULL REFERENCES brigadas(id) ON DELETE CASCADE,
  tipo_recurso_id INTEGER NOT NULL REFERENCES tipos_recursos(id),
  talla_id INTEGER NULL REFERENCES tallas(id),
  cantidad INTEGER DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mantener unicidad similar a SQL Server (solo una fila con talla NULL por brigada+tipo)
CREATE UNIQUE INDEX UQ_inventario_epp_not_null ON inventario_epp (brigada_id, tipo_recurso_id, talla_id) WHERE talla_id IS NOT NULL;
CREATE UNIQUE INDEX UQ_inventario_epp_null ON inventario_epp (brigada_id, tipo_recurso_id) WHERE talla_id IS NULL;

-- Herramientas por Brigada
CREATE TABLE inventario_herramientas (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brigada_id INTEGER NOT NULL REFERENCES brigadas(id) ON DELETE CASCADE,
  tipo_recurso_id INTEGER NOT NULL REFERENCES tipos_recursos(id),
  cantidad INTEGER DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT UQ_inventario_herramientas UNIQUE (brigada_id, tipo_recurso_id)
);

-- Logística: Repuestos Vehículos y Combustible
CREATE TABLE inventario_logistica (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brigada_id INTEGER NOT NULL REFERENCES brigadas(id) ON DELETE CASCADE,
  tipo_recurso_id INTEGER NOT NULL REFERENCES tipos_recursos(id),
  cantidad NUMERIC(10,2) DEFAULT 0, -- Para combustibles en litros
  monto_aproximado NUMERIC(10,2) DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT UQ_inventario_logistica UNIQUE (brigada_id, tipo_recurso_id)
);

-- Alimentación y Bebidas
CREATE TABLE inventario_alimentacion (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brigada_id INTEGER NOT NULL REFERENCES brigadas(id) ON DELETE CASCADE,
  tipo_recurso_id INTEGER NOT NULL REFERENCES tipos_recursos(id),
  cantidad INTEGER DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT UQ_inventario_alimentacion UNIQUE (brigada_id, tipo_recurso_id)
);

-- Equipo de Campo (Camping/Sleeping)
CREATE TABLE inventario_campo (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brigada_id INTEGER NOT NULL REFERENCES brigadas(id) ON DELETE CASCADE,
  tipo_recurso_id INTEGER NOT NULL REFERENCES tipos_recursos(id),
  cantidad INTEGER DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT UQ_inventario_campo UNIQUE (brigada_id, tipo_recurso_id)
);

-- Productos de Limpieza Personal y General
CREATE TABLE inventario_limpieza (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brigada_id INTEGER NOT NULL REFERENCES brigadas(id) ON DELETE CASCADE,
  tipo_recurso_id INTEGER NOT NULL REFERENCES tipos_recursos(id),
  cantidad INTEGER DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT UQ_inventario_limpieza UNIQUE (brigada_id, tipo_recurso_id)
);

-- Medicamentos
CREATE TABLE inventario_medicamentos (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brigada_id INTEGER NOT NULL REFERENCES brigadas(id) ON DELETE CASCADE,
  tipo_recurso_id INTEGER NOT NULL REFERENCES tipos_recursos(id),
  cantidad INTEGER DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT UQ_inventario_medicamentos UNIQUE (brigada_id, tipo_recurso_id)
);

-- Rescate Animal
CREATE TABLE inventario_rescate_animal (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  brigada_id INTEGER NOT NULL REFERENCES brigadas(id) ON DELETE CASCADE,
  tipo_recurso_id INTEGER NOT NULL REFERENCES tipos_recursos(id),
  cantidad INTEGER DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT UQ_inventario_rescate_animal UNIQUE (brigada_id, tipo_recurso_id)
);

-- ================================================
-- TRIGGERS (actualización automática de updated_at)
-- ================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_brigadas_update
BEFORE UPDATE ON brigadas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inventario_epp_update
BEFORE UPDATE ON inventario_epp
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inventario_herramientas_update
BEFORE UPDATE ON inventario_herramientas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inventario_logistica_update
BEFORE UPDATE ON inventario_logistica
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inventario_alimentacion_update
BEFORE UPDATE ON inventario_alimentacion
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inventario_campo_update
BEFORE UPDATE ON inventario_campo
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inventario_limpieza_update
BEFORE UPDATE ON inventario_limpieza
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inventario_medicamentos_update
BEFORE UPDATE ON inventario_medicamentos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_inventario_rescate_animal_update
BEFORE UPDATE ON inventario_rescate_animal
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ================================================
-- DATOS DE EJEMPLO
-- ================================================

-- Insertar datos de ejemplo en tallas
INSERT INTO tallas (codigo, descripcion, numero_equivalente) VALUES
('XS', 'Extra Small', NULL),
('S', 'Small', NULL),
('M', 'Medium', NULL),
('L', 'Large', NULL),
('XL', 'Extra Large', NULL),
('XXL', 'Double Extra Large', NULL),
('36', 'Talla 36', 36),
('37', 'Talla 37', 37),
('38', 'Talla 38', 38),
('39', 'Talla 39', 39),
('40', 'Talla 40', 40),
('41', 'Talla 41', 41),
('42', 'Talla 42', 42),
('43', 'Talla 43', 43),
('44', 'Talla 44', 44),
('45', 'Talla 45', 45);

-- Insertar datos de ejemplo en tipos_recursos (booleanos)
INSERT INTO tipos_recursos (categoria, nombre, requiere_talla, requiere_cantidad, activo) VALUES
-- EPP
('EPP', 'Casco Forestal', FALSE, TRUE, TRUE),
('EPP', 'Gafas de Protección', FALSE, TRUE, TRUE),
('EPP', 'Mascarilla N95', FALSE, TRUE, TRUE),
('EPP', 'Guantes de Trabajo', TRUE, TRUE, TRUE),
('EPP', 'Botas Forestales', TRUE, TRUE, TRUE),
('EPP', 'Pantalón Forestal', TRUE, TRUE, TRUE),
('EPP', 'Camisa Forestal', TRUE, TRUE, TRUE),
('EPP', 'Chaqueta Forestal', TRUE, TRUE, TRUE),

-- HERRAMIENTAS
('HERRAMIENTAS', 'Pulaski', FALSE, TRUE, TRUE),
('HERRAMIENTAS', 'McLeod', FALSE, TRUE, TRUE),
('HERRAMIENTAS', 'Pala', FALSE, TRUE, TRUE),
('HERRAMIENTAS', 'Hacha', FALSE, TRUE, TRUE),
('HERRAMIENTAS', 'Motosierra', FALSE, TRUE, TRUE),
('HERRAMIENTAS', 'Bomba de Agua Portátil', FALSE, TRUE, TRUE),
('HERRAMIENTAS', 'Manguera Forestal', FALSE, TRUE, TRUE),
('HERRAMIENTAS', 'Radio Comunicador', FALSE, TRUE, TRUE),

-- LOGISTICA
('LOGISTICA', 'Combustible Diésel', FALSE, TRUE, TRUE),
('LOGISTICA', 'Combustible Gasolina', FALSE, TRUE, TRUE),
('LOGISTICA', 'Aceite para Motosierras', FALSE, TRUE, TRUE),
('LOGISTICA', 'Repuestos Vehículos', FALSE, TRUE, TRUE),

-- ALIMENTACION
('ALIMENTACION', 'Agua Embotellada', FALSE, TRUE, TRUE),
('ALIMENTACION', 'Raciones de Comida', FALSE, TRUE, TRUE),
('ALIMENTACION', 'Barras Energéticas', FALSE, TRUE, TRUE),
('ALIMENTACION', 'Electrolitos', FALSE, TRUE, TRUE),

-- CAMPO
('CAMPO', 'Carpa', FALSE, TRUE, TRUE),
('CAMPO', 'Saco de Dormir', FALSE, TRUE, TRUE),
('CAMPO', 'Colchoneta', FALSE, TRUE, TRUE),
('CAMPO', 'Linterna', FALSE, TRUE, TRUE),

-- LIMPIEZA
('LIMPIEZA', 'Jabón', FALSE, TRUE, TRUE),
('LIMPIEZA', 'Desinfectante', FALSE, TRUE, TRUE),
('LIMPIEZA', 'Papel Higiénico', FALSE, TRUE, TRUE),
('LIMPIEZA', 'Toallas Húmedas', FALSE, TRUE, TRUE),

-- MEDICAMENTOS
('MEDICAMENTOS', 'Kit Primeros Auxilios', FALSE, TRUE, TRUE),
('MEDICAMENTOS', 'Analgésicos', FALSE, TRUE, TRUE),
('MEDICAMENTOS', 'Vendas', FALSE, TRUE, TRUE),
('MEDICAMENTOS', 'Suero Antiofídico', FALSE, TRUE, TRUE),

-- RESCATE ANIMAL
('RESCATE_ANIMAL', 'Jaulas Transportadoras', FALSE, TRUE, TRUE),
('RESCATE_ANIMAL', 'Guantes Especiales', TRUE, TRUE, TRUE),
('RESCATE_ANIMAL', 'Mantas Ignífugas', FALSE, TRUE, TRUE),
('RESCATE_ANIMAL', 'Kit Veterinario Básico', FALSE, TRUE, TRUE);

-- Insertar datos de ejemplo en brigadas
INSERT INTO brigadas (nombre, cantidad_bomberos_activos, contacto_celular_comandante, encargado_logistica, contacto_celular_logistica, numero_emergencia_publico) VALUES
('Brigada Forestal Norte', 12, '555-1234', 'Juan Pérez', '555-5678', '911'),
('Brigada Forestal Sur', 10, '555-2345', 'María López', '555-6789', '911'),
('Brigada Forestal Este', 8, '555-3456', 'Carlos Rodríguez', '555-7890', '911'),
('Brigada Forestal Oeste', 15, '555-4567', 'Ana Martínez', '555-8901', '911');
