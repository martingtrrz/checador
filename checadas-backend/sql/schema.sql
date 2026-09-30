-- Sistema de Checadas - Esquema de base de datos (MySQL)

CREATE DATABASE IF NOT EXISTS checadas_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE checadas_db;

CREATE TABLE empleados (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  numero_empleado   VARCHAR(20) NOT NULL UNIQUE,
  nombre            VARCHAR(150) NOT NULL,
  rol               ENUM('empleado', 'rh_supervisor') NOT NULL DEFAULT 'empleado',
  pin_hash          VARCHAR(255) NULL,
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  creado_en         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                     ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE webauthn_credenciales (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id         INT NOT NULL,
  credential_id       VARCHAR(255) NOT NULL UNIQUE,
  public_key          TEXT NOT NULL,
  contador            BIGINT NOT NULL DEFAULT 0,
  device_type         VARCHAR(50) NULL,
  creado_en           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_webauthn_empleado
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE webauthn_challenges (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id       INT NOT NULL,
  challenge         VARCHAR(255) NOT NULL,
  tipo              ENUM('registro', 'login') NOT NULL,
  expira_en         DATETIME NOT NULL,
  creado_en         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_challenge_empleado
    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE checadas (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id       INT NOT NULL,
  tipo              ENUM('entrada', 'salida', 'salida_descanso', 'entrada_descanso') NOT NULL,
  timestamp         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  foto_url          VARCHAR(500) NULL,
  dispositivo_id    VARCHAR(100) NULL,
  metodo_auth       ENUM('webauthn', 'pin') NOT NULL DEFAULT 'webauthn',
  CONSTRAINT fk_checada_empleado
    FOREIGN KEY (empleado_id) REFERENCES empleados(id),
  INDEX idx_empleado_fecha (empleado_id, timestamp)
) ENGINE=InnoDB;

INSERT INTO empleados (numero_empleado, nombre, rol, pin_hash) VALUES
  ('1001', 'Admin RH', 'rh_supervisor', '$2b$10$YH2P0U5sIdAGFvbHWO48sueqvBe6etjnCyBvyQe6TLedGpHHvC.3e');
