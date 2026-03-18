CREATE TABLE IF NOT EXISTS caso_notas_privadas (
  id_nota_privada BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_caso BIGINT UNSIGNED NOT NULL,
  id_abogado BIGINT UNSIGNED NOT NULL,
  nota TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_nota_privada),
  KEY idx_caso_notas_privadas_caso (id_caso),
  KEY idx_caso_notas_privadas_abogado (id_abogado),
  CONSTRAINT fk_caso_notas_privadas_caso
    FOREIGN KEY (id_caso) REFERENCES casos(id_caso)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_caso_notas_privadas_abogado
    FOREIGN KEY (id_abogado) REFERENCES abogados(id_abogado)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
