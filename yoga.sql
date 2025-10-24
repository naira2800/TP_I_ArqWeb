/*
 Navicat Premium Dump SQL

 Source Server         : localhost
 Source Server Type    : MariaDB
 Source Server Version : 100137 (10.1.37-MariaDB)
 Source Host           : localhost:3306
 Source Schema         : yoga

 Target Server Type    : MariaDB
 Target Server Version : 100137 (10.1.37-MariaDB)
 File Encoding         : 65001

 Date: 21/10/2025 14:34:27
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for alumnos
-- ----------------------------
DROP TABLE IF EXISTS `alumnos`;
CREATE TABLE `alumnos`  (
  `id_alumno` int(11) NOT NULL AUTO_INCREMENT,
  `nombres` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NULL DEFAULT NULL,
  `apellidos` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NULL DEFAULT NULL,
  `dni` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NULL DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NULL DEFAULT NULL,
  `telefono` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id_alumno`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 61 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_spanish_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of alumnos
-- ----------------------------
INSERT INTO `alumnos` VALUES (1, 'Leandro', 'Pérez', '11678443', 'leandro.perez@icloud.com', '54');
INSERT INTO `alumnos` VALUES (2, 'Daiana', 'Martínez', '55412533', 'daiana.martinez@icloud.com', '54');
INSERT INTO `alumnos` VALUES (3, 'María', 'Díaz', '24672546', 'maria.diaz@outlook.com', '54');
INSERT INTO `alumnos` VALUES (4, 'Micaela', 'Ramos', '49544950', 'micaela.ramos@yahoo.com', '54');
INSERT INTO `alumnos` VALUES (5, 'Carolina', 'Ruiz', '20434052', 'carolina.ruiz@outlook.com', '54');
INSERT INTO `alumnos` VALUES (6, 'Gonzalo', 'Martínez', '34090698', 'gonzalo.martinez@yahoo.com', '54');
INSERT INTO `alumnos` VALUES (7, 'Tomás', 'Pérez', '35403012', 'tomas.perez@gmail.com', '54');
INSERT INTO `alumnos` VALUES (8, 'Hernán', 'López', '13075222', 'hernan.lopez@icloud.com', '54');
INSERT INTO `alumnos` VALUES (9, 'Sofía', 'Benítez', '28654492', 'sofia.benitez@hotmail.com', '54');
INSERT INTO `alumnos` VALUES (10, 'Bruno', 'Gutiérrez', '54974694', 'bruno.gutierrez@yahoo.com', '54');
INSERT INTO `alumnos` VALUES (11, 'Camila', 'Suárez', '35464823', 'camila.suarez@yahoo.com', '54');
INSERT INTO `alumnos` VALUES (12, 'Micaela', 'Gómez', '31169695', 'micaela.gomez@hotmail.com', '54');
INSERT INTO `alumnos` VALUES (13, 'Santiago', 'Ponce', '43502842', 'santiago.ponce@hotmail.com', '54');
INSERT INTO `alumnos` VALUES (14, 'Valentina', 'Silva', '59995364', 'valentina.silva@live.com', '54');
INSERT INTO `alumnos` VALUES (15, 'Lautaro', 'Pereyra', '19283286', 'lautaro.pereyra@live.com', '54');
INSERT INTO `alumnos` VALUES (16, 'Diego', 'Méndez', '20736210', 'diego.mendez@icloud.com', '54');
INSERT INTO `alumnos` VALUES (17, 'Rocío', 'Suárez', '45508262', 'rocio.suarez@yahoo.com', '54');
INSERT INTO `alumnos` VALUES (18, 'Milagros', 'Ponce', '32828789', 'milagros.ponce@gmail.com', '54');
INSERT INTO `alumnos` VALUES (19, 'Juan', 'Barrera', '58296952', 'juan.barrera@yahoo.com', '54');
INSERT INTO `alumnos` VALUES (20, 'Leandro', 'Muñoz', '52879174', 'leandro.munoz@live.com', '54');
INSERT INTO `alumnos` VALUES (21, 'Esteban', 'Torres', '46197113', 'esteban.torres@live.com', '54');
INSERT INTO `alumnos` VALUES (22, 'Jorge', 'Vega', '30636923', 'jorge.vega@outlook.com', '54');
INSERT INTO `alumnos` VALUES (23, 'Sol', 'Ferreyra', '14644773', 'sol.ferreyra@live.com', '54');
INSERT INTO `alumnos` VALUES (24, 'Morena', 'Torres', '27787649', 'morena.torres@live.com', '54');
INSERT INTO `alumnos` VALUES (25, 'Hernán', 'Muñoz', '36775919', 'hernan.munoz@icloud.com', '54');
INSERT INTO `alumnos` VALUES (26, 'Jorge', 'Silva', '25079183', 'jorge.silva@gmail.com', '54');
INSERT INTO `alumnos` VALUES (27, 'Juan', 'López', '57502401', 'juan.lopez@icloud.com', '54');
INSERT INTO `alumnos` VALUES (28, 'Carolina', 'López', '44504433', 'carolina.lopez@outlook.com', '54');
INSERT INTO `alumnos` VALUES (29, 'Sol', 'Figueroa', '48668909', 'sol.figueroa@hotmail.com', '54');
INSERT INTO `alumnos` VALUES (30, 'Sofía', 'Martínez', '54223583', 'sofia.martinez@hotmail.com', '54');

-- ----------------------------
-- Table structure for alumnos_clases
-- ----------------------------
DROP TABLE IF EXISTS `alumnos_clases`;
CREATE TABLE `alumnos_clases`  (
  `alumno_id` int(11) NOT NULL,
  `clase_id` int(11) NOT NULL,
  PRIMARY KEY (`alumno_id`, `clase_id`) USING BTREE,
  INDEX `fk_id_clase`(`clase_id`) USING BTREE,
  CONSTRAINT `fk_id_alumno` FOREIGN KEY (`alumno_id`) REFERENCES `alumnos` (`id_alumno`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_id_clase` FOREIGN KEY (`clase_id`) REFERENCES `horario_clases` (`id_clase`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_spanish_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of alumnos_clases
-- ----------------------------
INSERT INTO `alumnos_clases` VALUES (1, 10);
INSERT INTO `alumnos_clases` VALUES (1, 24);
INSERT INTO `alumnos_clases` VALUES (2, 2);
INSERT INTO `alumnos_clases` VALUES (2, 12);

-- ----------------------------
-- Table structure for horario_clases
-- ----------------------------
DROP TABLE IF EXISTS `horario_clases`;
CREATE TABLE `horario_clases`  (
  `id_clase` int(11) NOT NULL AUTO_INCREMENT,
  `dia` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NULL DEFAULT NULL,
  `hora` time NULL DEFAULT NULL,
  `clase` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id_clase`) USING BTREE,
  INDEX `id_clase`(`id_clase`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_spanish_ci ROW_FORMAT = Compact;

-- ----------------------------
-- Records of horario_clases
-- ----------------------------
INSERT INTO `horario_clases` VALUES (2, 'lunes', '10:00:00', 'HATHA YOGA');
INSERT INTO `horario_clases` VALUES (3, 'lunes', '17:00:00', 'HATHA YOGA');
INSERT INTO `horario_clases` VALUES (4, 'lunes', '18:00:00', 'ACROYOGA');
INSERT INTO `horario_clases` VALUES (5, 'lunes', '19:00:00', 'PILATES');
INSERT INTO `horario_clases` VALUES (6, 'lunes', '20:00:00', 'HATHA YOGA');
INSERT INTO `horario_clases` VALUES (7, 'martes', '10:00:00', 'PILATES EXTREME');
INSERT INTO `horario_clases` VALUES (8, 'martes', '15:00:00', 'ASHTANGA YOGA');
INSERT INTO `horario_clases` VALUES (9, 'martes', '16:00:00', 'ACROYOGA');
INSERT INTO `horario_clases` VALUES (10, 'martes', '17:00:00', 'PILATES');
INSERT INTO `horario_clases` VALUES (11, 'martes', '18:00:00', 'PILATES EXTREME');
INSERT INTO `horario_clases` VALUES (12, 'miércoles', '10:00:00', 'HATHA YOGA');
INSERT INTO `horario_clases` VALUES (13, 'miércoles', '16:00:00', 'PILATES');
INSERT INTO `horario_clases` VALUES (14, 'miércoles', '18:00:00', 'ASHTANGA YOGA');
INSERT INTO `horario_clases` VALUES (15, 'miércoles', '19:00:00', 'PILATES');
INSERT INTO `horario_clases` VALUES (16, 'miércoles', '20:00:00', 'HATHA YOGA');
INSERT INTO `horario_clases` VALUES (17, 'jueves', '09:00:00', 'ACROYOGA');
INSERT INTO `horario_clases` VALUES (18, 'jueves', '10:00:00', 'PILATES EXTREME');
INSERT INTO `horario_clases` VALUES (19, 'jueves', '17:00:00', 'HATHA YOGA');
INSERT INTO `horario_clases` VALUES (20, 'jueves', '18:00:00', 'PILATES EXTREME');
INSERT INTO `horario_clases` VALUES (21, 'viernes', '09:00:00', 'PILATES');
INSERT INTO `horario_clases` VALUES (22, 'viernes', '15:00:00', 'ASHTANGA YOGA');
INSERT INTO `horario_clases` VALUES (23, 'viernes', '16:00:00', 'PILATES');
INSERT INTO `horario_clases` VALUES (24, 'viernes', '17:00:00', 'PILATES');
INSERT INTO `horario_clases` VALUES (25, 'viernes', '18:00:00', 'ACROYOGA');
INSERT INTO `horario_clases` VALUES (26, 'viernes', '19:00:00', 'PILATES');
INSERT INTO `horario_clases` VALUES (27, 'viernes', '20:00:00', 'HATHA YOGA');
INSERT INTO `horario_clases` VALUES (28, 'sábado ', '09:00:00', 'YOGA+MEDITACIÓN');
INSERT INTO `horario_clases` VALUES (29, 'sábado ', '10:00:00', 'ACROYOGA');
INSERT INTO `horario_clases` VALUES (30, 'sábado ', '11:00:00', 'PILATES');

SET FOREIGN_KEY_CHECKS = 1;
