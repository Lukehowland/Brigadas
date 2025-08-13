-- BASE DE DATOS SISTEMA BOMBEROS FORESTALES
-- Estructura completa para gestión de brigadas y recursos

-- ================================================
-- TABLAS PRINCIPALES
-- ================================================

-- Tabla de Brigadas
CREATE TABLE brigadas (
    id INT PRIMARY KEY IDENTITY(1,1),
    nombre NVARCHAR(100) NOT NULL,
    cantidad_bomberos_activos INT DEFAULT 0,
    contacto_celular_comandante NVARCHAR(20),
    encargado_logistica NVARCHAR(100),
    contacto_celular_logistica NVARCHAR(20),
    numero_emergencia_publico NVARCHAR(20),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- ================================================
-- CATÁLOGOS DE TALLAS Y TIPOS
-- ================================================

-- Catálogo de Tallas
CREATE TABLE tallas (
    id INT PRIMARY KEY IDENTITY(1,1),
    codigo NVARCHAR(10) NOT NULL UNIQUE, -- XS, S, M, L, XL, XXL
    descripcion NVARCHAR(20) NOT NULL,
    numero_equivalente INT NULL -- Para botas: 37, 38, 39, etc.
);

-- Tipos de Equipment/Recursos
CREATE TABLE tipos_recursos (
    id INT PRIMARY KEY IDENTITY(1,1),
    categoria NVARCHAR(50) NOT NULL, -- EPP, HERRAMIENTAS, LOGISTICA, etc.
    nombre NVARCHAR(100) NOT NULL,
    requiere_talla BIT DEFAULT 0,
    requiere_cantidad BIT DEFAULT 1,
    activo BIT DEFAULT 1
);

-- ================================================
-- INVENTARIO POR BRIGADA
-- ================================================

-- Equipamiento EPP por Brigada
CREATE TABLE inventario_epp (
    id INT PRIMARY KEY IDENTITY(1,1),
    brigada_id INT NOT NULL,
    tipo_recurso_id INT NOT NULL,
    talla_id INT NULL,
    cantidad INT DEFAULT 0,
    observaciones NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_inventario_epp_brigada FOREIGN KEY (brigada_id) REFERENCES brigadas(id) ON DELETE CASCADE,
    CONSTRAINT FK_inventario_epp_tipo_recurso FOREIGN KEY (tipo_recurso_id) REFERENCES tipos_recursos(id),
    CONSTRAINT FK_inventario_epp_talla FOREIGN KEY (talla_id) REFERENCES tallas(id),
    CONSTRAINT UQ_inventario_epp UNIQUE (brigada_id, tipo_recurso_id, talla_id)
);

-- Herramientas por Brigada
CREATE TABLE inventario_herramientas (
    id INT PRIMARY KEY IDENTITY(1,1),
    brigada_id INT NOT NULL,
    tipo_recurso_id INT NOT NULL,
    cantidad INT DEFAULT 0,
    observaciones NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_inventario_herramientas_brigada FOREIGN KEY (brigada_id) REFERENCES brigadas(id) ON DELETE CASCADE,
    CONSTRAINT FK_inventario_herramientas_tipo_recurso FOREIGN KEY (tipo_recurso_id) REFERENCES tipos_recursos(id),
    CONSTRAINT UQ_inventario_herramientas UNIQUE (brigada_id, tipo_recurso_id)
);

-- Logística: Repuestos Vehículos y Combustible
CREATE TABLE inventario_logistica (
    id INT PRIMARY KEY IDENTITY(1,1),
    brigada_id INT NOT NULL,
    tipo_recurso_id INT NOT NULL,
    cantidad DECIMAL(10,2) DEFAULT 0, -- Para combustibles en litros
    monto_aproximado DECIMAL(10,2) DEFAULT 0,
    observaciones NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_inventario_logistica_brigada FOREIGN KEY (brigada_id) REFERENCES brigadas(id) ON DELETE CASCADE,
    CONSTRAINT FK_inventario_logistica_tipo_recurso FOREIGN KEY (tipo_recurso_id) REFERENCES tipos_recursos(id),
    CONSTRAINT UQ_inventario_logistica UNIQUE (brigada_id, tipo_recurso_id)
);

-- Alimentación y Bebidas
CREATE TABLE inventario_alimentacion (
    id INT PRIMARY KEY IDENTITY(1,1),
    brigada_id INT NOT NULL,
    tipo_recurso_id INT NOT NULL,
    cantidad INT DEFAULT 0,
    observaciones NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_inventario_alimentacion_brigada FOREIGN KEY (brigada_id) REFERENCES brigadas(id) ON DELETE CASCADE,
    CONSTRAINT FK_inventario_alimentacion_tipo_recurso FOREIGN KEY (tipo_recurso_id) REFERENCES tipos_recursos(id),
    CONSTRAINT UQ_inventario_alimentacion UNIQUE (brigada_id, tipo_recurso_id)
);

-- Equipo de Campo (Camping/Sleeping)
CREATE TABLE inventario_campo (
    id INT PRIMARY KEY IDENTITY(1,1),
    brigada_id INT NOT NULL,
    tipo_recurso_id INT NOT NULL,
    cantidad INT DEFAULT 0,
    observaciones NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_inventario_campo_brigada FOREIGN KEY (brigada_id) REFERENCES brigadas(id) ON DELETE CASCADE,
    CONSTRAINT FK_inventario_campo_tipo_recurso FOREIGN KEY (tipo_recurso_id) REFERENCES tipos_recursos(id),
    CONSTRAINT UQ_inventario_campo UNIQUE (brigada_id, tipo_recurso_id)
);

-- Productos de Limpieza Personal y General
CREATE TABLE inventario_limpieza (
    id INT PRIMARY KEY IDENTITY(1,1),
    brigada_id INT NOT NULL,
    tipo_recurso_id INT NOT NULL,
    cantidad INT DEFAULT 0,
    observaciones NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_inventario_limpieza_brigada FOREIGN KEY (brigada_id) REFERENCES brigadas(id) ON DELETE CASCADE,
    CONSTRAINT FK_inventario_limpieza_tipo_recurso FOREIGN KEY (tipo_recurso_id) REFERENCES tipos_recursos(id),
    CONSTRAINT UQ_inventario_limpieza UNIQUE (brigada_id, tipo_recurso_id)
);

-- Medicamentos
CREATE TABLE inventario_medicamentos (
    id INT PRIMARY KEY IDENTITY(1,1),
    brigada_id INT NOT NULL,
    tipo_recurso_id INT NOT NULL,
    cantidad INT DEFAULT 0,
    observaciones NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_inventario_medicamentos_brigada FOREIGN KEY (brigada_id) REFERENCES brigadas(id) ON DELETE CASCADE,
    CONSTRAINT FK_inventario_medicamentos_tipo_recurso FOREIGN KEY (tipo_recurso_id) REFERENCES tipos_recursos(id),
    CONSTRAINT UQ_inventario_medicamentos UNIQUE (brigada_id, tipo_recurso_id)
);

-- Rescate Animal
CREATE TABLE inventario_rescate_animal (
    id INT PRIMARY KEY IDENTITY(1,1),
    brigada_id INT NOT NULL,
    tipo_recurso_id INT NOT NULL,
    cantidad INT DEFAULT 0,
    observaciones NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_inventario_rescate_animal_brigada FOREIGN KEY (brigada_id) REFERENCES brigadas(id) ON DELETE CASCADE,
    CONSTRAINT FK_inventario_rescate_animal_tipo_recurso FOREIGN KEY (tipo_recurso_id) REFERENCES tipos_recursos(id),
    CONSTRAINT UQ_inventario_rescate_animal UNIQUE (brigada_id, tipo_recurso_id)
);

-- Trigger para actualizar el campo updated_at en brigadas
CREATE TRIGGER trg_brigadas_update
ON brigadas
AFTER UPDATE
AS
BEGIN
    UPDATE brigadas
    SET updated_at = GETDATE()
    FROM brigadas b
    INNER JOIN inserted i ON b.id = i.id;
END;

-- Trigger para actualizar el campo updated_at en inventario_epp
CREATE TRIGGER trg_inventario_epp_update
ON inventario_epp
AFTER UPDATE
AS
BEGIN
    UPDATE inventario_epp
    SET updated_at = GETDATE()
    FROM inventario_epp ie
    INNER JOIN inserted i ON ie.id = i.id;
END;

-- Trigger para actualizar el campo updated_at en inventario_herramientas
CREATE TRIGGER trg_inventario_herramientas_update
ON inventario_herramientas
AFTER UPDATE
AS
BEGIN
    UPDATE inventario_herramientas
    SET updated_at = GETDATE()
    FROM inventario_herramientas ih
    INNER JOIN inserted i ON ih.id = i.id;
END;

-- Trigger para actualizar el campo updated_at en inventario_logistica
CREATE TRIGGER trg_inventario_logistica_update
ON inventario_logistica
AFTER UPDATE
AS
BEGIN
    UPDATE inventario_logistica
    SET updated_at = GETDATE()
    FROM inventario_logistica il
    INNER JOIN inserted i ON il.id = i.id;
END;

-- Trigger para actualizar el campo updated_at en inventario_alimentacion
CREATE TRIGGER trg_inventario_alimentacion_update
ON inventario_alimentacion
AFTER UPDATE
AS
BEGIN
    UPDATE inventario_alimentacion
    SET updated_at = GETDATE()
    FROM inventario_alimentacion ia
    INNER JOIN inserted i ON ia.id = i.id;
END;

-- Trigger para actualizar el campo updated_at en inventario_campo
CREATE TRIGGER trg_inventario_campo_update
ON inventario_campo
AFTER UPDATE
AS
BEGIN
    UPDATE inventario_campo
    SET updated_at = GETDATE()
    FROM inventario_campo ic
    INNER JOIN inserted i ON ic.id = i.id;
END;

-- Trigger para actualizar el campo updated_at en inventario_limpieza
CREATE TRIGGER trg_inventario_limpieza_update
ON inventario_limpieza
AFTER UPDATE
AS
BEGIN
    UPDATE inventario_limpieza
    SET updated_at = GETDATE()
    FROM inventario_limpieza il
    INNER JOIN inserted i ON il.id = i.id;
END;

-- Trigger para actualizar el campo updated_at en inventario_medicamentos
CREATE TRIGGER trg_inventario_medicamentos_update
ON inventario_medicamentos
AFTER UPDATE
AS
BEGIN
    UPDATE inventario_medicamentos
    SET updated_at = GETDATE()
    FROM inventario_medicamentos im
    INNER JOIN inserted i ON im.id = i.id;
END;

-- Trigger para actualizar el campo updated_at en inventario_rescate_animal
CREATE TRIGGER trg_inventario_rescate_animal_update
ON inventario_rescate_animal
AFTER UPDATE
AS
BEGIN
    UPDATE inventario_rescate_animal
    SET updated_at = GETDATE()
    FROM inventario_rescate_animal ira
    INNER JOIN inserted i ON ira.id = i.id;
END;

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

-- Insertar datos de ejemplo en tipos_recursos
INSERT INTO tipos_recursos (categoria, nombre, requiere_talla, requiere_cantidad, activo) VALUES
-- EPP
('EPP', 'Casco Forestal', 0, 1, 1),
('EPP', 'Gafas de Protección', 0, 1, 1),
('EPP', 'Mascarilla N95', 0, 1, 1),
('EPP', 'Guantes de Trabajo', 1, 1, 1),
('EPP', 'Botas Forestales', 1, 1, 1),
('EPP', 'Pantalón Forestal', 1, 1, 1),
('EPP', 'Camisa Forestal', 1, 1, 1),
('EPP', 'Chaqueta Forestal', 1, 1, 1),

-- HERRAMIENTAS
('HERRAMIENTAS', 'Pulaski', 0, 1, 1),
('HERRAMIENTAS', 'McLeod', 0, 1, 1),
('HERRAMIENTAS', 'Pala', 0, 1, 1),
('HERRAMIENTAS', 'Hacha', 0, 1, 1),
('HERRAMIENTAS', 'Motosierra', 0, 1, 1),
('HERRAMIENTAS', 'Bomba de Agua Portátil', 0, 1, 1),
('HERRAMIENTAS', 'Manguera Forestal', 0, 1, 1),
('HERRAMIENTAS', 'Radio Comunicador', 0, 1, 1),

-- LOGISTICA
('LOGISTICA', 'Combustible Diésel', 0, 1, 1),
('LOGISTICA', 'Combustible Gasolina', 0, 1, 1),
('LOGISTICA', 'Aceite para Motosierras', 0, 1, 1),
('LOGISTICA', 'Repuestos Vehículos', 0, 1, 1),

-- ALIMENTACION
('ALIMENTACION', 'Agua Embotellada', 0, 1, 1),
('ALIMENTACION', 'Raciones de Comida', 0, 1, 1),
('ALIMENTACION', 'Barras Energéticas', 0, 1, 1),
('ALIMENTACION', 'Electrolitos', 0, 1, 1),

-- CAMPO
('CAMPO', 'Carpa', 0, 1, 1),
('CAMPO', 'Saco de Dormir', 0, 1, 1),
('CAMPO', 'Colchoneta', 0, 1, 1),
('CAMPO', 'Linterna', 0, 1, 1),

-- LIMPIEZA
('LIMPIEZA', 'Jabón', 0, 1, 1),
('LIMPIEZA', 'Desinfectante', 0, 1, 1),
('LIMPIEZA', 'Papel Higiénico', 0, 1, 1),
('LIMPIEZA', 'Toallas Húmedas', 0, 1, 1),

-- MEDICAMENTOS
('MEDICAMENTOS', 'Kit Primeros Auxilios', 0, 1, 1),
('MEDICAMENTOS', 'Analgésicos', 0, 1, 1),
('MEDICAMENTOS', 'Vendas', 0, 1, 1),
('MEDICAMENTOS', 'Suero Antiofídico', 0, 1, 1),

-- RESCATE ANIMAL
('RESCATE_ANIMAL', 'Jaulas Transportadoras', 0, 1, 1),
('RESCATE_ANIMAL', 'Guantes Especiales', 1, 1, 1),
('RESCATE_ANIMAL', 'Mantas Ignífugas', 0, 1, 1),
('RESCATE_ANIMAL', 'Kit Veterinario Básico', 0, 1, 1);

-- Insertar datos de ejemplo en brigadas
INSERT INTO brigadas (nombre, cantidad_bomberos_activos, contacto_celular_comandante, encargado_logistica, contacto_celular_logistica, numero_emergencia_publico) VALUES
('Brigada Forestal Norte', 12, '555-1234', 'Juan Pérez', '555-5678', '911'),
('Brigada Forestal Sur', 10, '555-2345', 'María López', '555-6789', '911'),
('Brigada Forestal Este', 8, '555-3456', 'Carlos Rodríguez', '555-7890', '911'),
('Brigada Forestal Oeste', 15, '555-4567', 'Ana Martínez', '555-8901', '911');
