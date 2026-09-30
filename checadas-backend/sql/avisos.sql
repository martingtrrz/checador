USE checadas_db;

CREATE TABLE IF NOT EXISTS avisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  contenido TEXT,
  tipo ENUM('texto', 'imagen', 'video') DEFAULT 'texto',
  media_url VARCHAR(500) NULL,
  color_fondo VARCHAR(7) DEFAULT '#1E293B',
  color_texto VARCHAR(7) DEFAULT '#FFFFFF',
  prioridad INT DEFAULT 0,
  duracion_segundos INT DEFAULT 10,
  activo TINYINT(1) DEFAULT 1,
  fecha_inicio DATETIME NULL,
  fecha_fin DATETIME NULL,
  creado_en DATETIME DEFAULT NOW(),
  actualizado_en DATETIME DEFAULT NOW() ON UPDATE NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO avisos (titulo, contenido, tipo, prioridad, duracion_segundos) VALUES
('Bienvenidos', 'Sistema de registro de asistencia activo', 'texto', 1, 8),
('Recuerda checar', 'Registra tu entrada al llegar y tu salida al retirarte', 'texto', 0, 10);
