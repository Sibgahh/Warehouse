-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: warehouse
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `inventory_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `item_id` bigint unsigned NOT NULL,
  `on_hand_qty` decimal(8,2) NOT NULL DEFAULT '0.00',
  `on_ordered_qty` decimal(8,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`inventory_id`),
  UNIQUE KEY `inventory_unique` (`item_id`),
  CONSTRAINT `inventory_items_FK` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `item_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `item_name` char(12) NOT NULL,
  `description` varchar(200) NOT NULL,
  `status` enum('A','I','C') NOT NULL DEFAULT 'A' COMMENT 'A = Active \r\nI = Inactive (Boleh ada stock tetapi tidak boleh ada Order / Pembelian masuk dan masih bisa melakukan transfer ke toko)\r\nC = Close (Tidak boleh ada stock, Tidak boleh ada order masuk, Tidak boleh ada transfer',
  `std_qty` decimal(4,2) NOT NULL,
  `min_stock` decimal(4,2) NOT NULL DEFAULT '0.00',
  `max_stock` decimal(4,2) NOT NULL,
  `unit_cost` float(10,2) NOT NULL COMMENT 'Harga Beli',
  `unit_retail` float(12,2) NOT NULL COMMENT 'Harga Jual',
  `supplier_id` bigint unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_id` int unsigned NOT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  UNIQUE KEY `items_unique` (`item_name`),
  KEY `items_users_FK` (`created_id`),
  KEY `items_users_FK_1` (`updated_id`),
  KEY `items_suppliers_FK` (`supplier_id`),
  CONSTRAINT `items_suppliers_FK` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `items_users_FK` FOREIGN KEY (`created_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `items_users_FK_1` FOREIGN KEY (`updated_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menus`
--

DROP TABLE IF EXISTS `menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menus` (
  `menu_id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `menu_sequence` varchar(5) NOT NULL,
  `menu_name` varchar(80) NOT NULL,
  `menu_icon` varchar(150) DEFAULT NULL,
  `menu_link` varchar(150) DEFAULT '#',
  `is_submenu` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`menu_id`),
  UNIQUE KEY `menus_unique` (`menu_sequence`,`menu_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menus`
--

LOCK TABLES `menus` WRITE;
/*!40000 ALTER TABLE `menus` DISABLE KEYS */;
/*!40000 ALTER TABLE `menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_details`
--

DROP TABLE IF EXISTS `order_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_details` (
  `order_detail_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `item_id` bigint unsigned NOT NULL,
  `qty_ordered` decimal(5,2) NOT NULL,
  `qty_received` decimal(5,2) DEFAULT NULL,
  `qty_cancelled` decimal(5,2) DEFAULT NULL,
  `reason_cancelled` varchar(150) DEFAULT NULL,
  `created_id` int unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `received_id` int unsigned DEFAULT NULL,
  `last_receive_dttm` datetime DEFAULT NULL,
  PRIMARY KEY (`order_detail_id`),
  KEY `order_details_items_FK` (`item_id`),
  KEY `order_details_users_FK` (`created_id`),
  KEY `order_details_users_FK_1` (`received_id`),
  KEY `order_details_orders_FK` (`order_id`),
  CONSTRAINT `order_details_items_FK` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON UPDATE CASCADE,
  CONSTRAINT `order_details_orders_FK` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON UPDATE CASCADE,
  CONSTRAINT `order_details_users_FK` FOREIGN KEY (`created_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `order_details_users_FK_1` FOREIGN KEY (`received_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_details`
--

LOCK TABLES `order_details` WRITE;
/*!40000 ALTER TABLE `order_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_statuses`
--

DROP TABLE IF EXISTS `order_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_statuses` (
  `order_status_id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `status_code` char(5) NOT NULL,
  `status_name` varchar(100) NOT NULL,
  PRIMARY KEY (`order_status_id`),
  UNIQUE KEY `order_statuses_unique` (`status_code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_statuses`
--

LOCK TABLES `order_statuses` WRITE;
/*!40000 ALTER TABLE `order_statuses` DISABLE KEYS */;
INSERT INTO `order_statuses` VALUES (1,'10','Open'),(2,'20','InTransit'),(3,'30','Receiving Started'),(4,'40','Receiving Verified'),(5,'50','Cancelled');
/*!40000 ALTER TABLE `order_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `order_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_number` char(10) NOT NULL,
  `warehouse_id` smallint unsigned NOT NULL,
  `supplier_id` bigint unsigned NOT NULL,
  `delivery_start_date` date NOT NULL,
  `delivery_end_date` date NOT NULL,
  `order_status_id` tinyint unsigned NOT NULL,
  `created_id` int unsigned NOT NULL,
  `approval_id` int unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `last_updated_id` int unsigned DEFAULT NULL,
  `verified_id` int unsigned DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `orders_warehouses_FK` (`warehouse_id`),
  KEY `orders_suppliers_FK` (`supplier_id`),
  KEY `orders_order_statuses_FK` (`order_status_id`),
  KEY `orders_users_FK` (`created_id`),
  KEY `orders_users_FK_1` (`approval_id`),
  KEY `orders_users_FK_2` (`last_updated_id`),
  KEY `orders_users_FK_3` (`verified_id`),
  CONSTRAINT `orders_order_statuses_FK` FOREIGN KEY (`order_status_id`) REFERENCES `order_statuses` (`order_status_id`) ON UPDATE CASCADE,
  CONSTRAINT `orders_suppliers_FK` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON UPDATE CASCADE,
  CONSTRAINT `orders_users_FK` FOREIGN KEY (`created_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `orders_users_FK_1` FOREIGN KEY (`approval_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `orders_users_FK_2` FOREIGN KEY (`last_updated_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `orders_users_FK_3` FOREIGN KEY (`verified_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `orders_warehouses_FK` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`warehouse_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_menus`
--

DROP TABLE IF EXISTS `role_menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_menus` (
  `role_menu_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` tinyint unsigned NOT NULL,
  `menu_id` smallint unsigned NOT NULL,
  PRIMARY KEY (`role_menu_id`),
  UNIQUE KEY `role_menus_unique` (`menu_id`,`role_id`),
  KEY `role_menus_roles_FK` (`role_id`),
  CONSTRAINT `role_menus_menus_FK` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`menu_id`) ON UPDATE CASCADE,
  CONSTRAINT `role_menus_roles_FK` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_menus`
--

LOCK TABLES `role_menus` WRITE;
/*!40000 ALTER TABLE `role_menus` DISABLE KEYS */;
/*!40000 ALTER TABLE `role_menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_submenus`
--

DROP TABLE IF EXISTS `role_submenus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_submenus` (
  `role_submenu_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` tinyint unsigned NOT NULL,
  `submenu_id` smallint unsigned NOT NULL,
  PRIMARY KEY (`role_submenu_id`),
  UNIQUE KEY `role_submenus_unique` (`role_id`,`submenu_id`),
  KEY `role_submenus_submenus_FK` (`submenu_id`),
  CONSTRAINT `role_submenus_roles_FK` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON UPDATE CASCADE,
  CONSTRAINT `role_submenus_submenus_FK` FOREIGN KEY (`submenu_id`) REFERENCES `submenus` (`submenu_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_submenus`
--

LOCK TABLES `role_submenus` WRITE;
/*!40000 ALTER TABLE `role_submenus` DISABLE KEYS */;
/*!40000 ALTER TABLE `role_submenus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `role_code` varchar(8) NOT NULL,
  `role_name` varchar(80) NOT NULL,
  `is_active` tinyint(1) DEFAULT '0' COMMENT '1 = Active, 0 = Inactive',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `roles_unique` (`role_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stores`
--

DROP TABLE IF EXISTS `stores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stores` (
  `store_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `store_code` varchar(5) NOT NULL,
  `store_name` varchar(150) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone_number` varchar(14) DEFAULT NULL,
  `city` varchar(80) DEFAULT NULL,
  `regency` varchar(80) DEFAULT NULL,
  `address` varchar(180) DEFAULT NULL,
  `status` enum('A','C') NOT NULL DEFAULT 'A' COMMENT 'A = Active\r\nC = Close',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_id` int unsigned NOT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`store_id`),
  UNIQUE KEY `stores_unique` (`store_code`),
  UNIQUE KEY `stores_unique_1` (`store_name`),
  KEY `stores_users_FK` (`created_id`),
  KEY `stores_users_FK_1` (`updated_id`),
  CONSTRAINT `stores_users_FK` FOREIGN KEY (`created_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `stores_users_FK_1` FOREIGN KEY (`updated_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stores`
--

LOCK TABLES `stores` WRITE;
/*!40000 ALTER TABLE `stores` DISABLE KEYS */;
/*!40000 ALTER TABLE `stores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `submenus`
--

DROP TABLE IF EXISTS `submenus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `submenus` (
  `submenu_id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `menu_id` smallint unsigned NOT NULL,
  `submenu_sequence` varchar(5) NOT NULL,
  `submenu_name` varchar(80) NOT NULL,
  `submenu_icon` varchar(150) DEFAULT NULL,
  `submenu_link` varchar(150) NOT NULL DEFAULT '#',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`submenu_id`),
  UNIQUE KEY `submenus_unique` (`menu_id`,`submenu_sequence`,`submenu_name`),
  CONSTRAINT `submenus_menus_FK` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `submenus`
--

LOCK TABLES `submenus` WRITE;
/*!40000 ALTER TABLE `submenus` DISABLE KEYS */;
/*!40000 ALTER TABLE `submenus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `supplier_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `supplier_code` char(10) NOT NULL,
  `supplier_name` varchar(180) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone_number` varchar(14) DEFAULT NULL,
  `city` varchar(80) DEFAULT NULL,
  `regency` varchar(80) DEFAULT NULL,
  `address` varchar(180) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0' COMMENT '1 = Active\r\n0 = Inactive',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_id` int unsigned NOT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`supplier_id`),
  UNIQUE KEY `suppliers_unique` (`supplier_code`),
  KEY `suppliers_users_FK` (`created_id`),
  KEY `suppliers_users_FK_1` (`updated_id`),
  CONSTRAINT `suppliers_users_FK` FOREIGN KEY (`created_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `suppliers_users_FK_1` FOREIGN KEY (`updated_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_name` varchar(50) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `password` text NOT NULL,
  `role_id` tinyint unsigned NOT NULL,
  `is_active` tinyint(1) DEFAULT '0' COMMENT '1 = Active, 0 = Inactive',
  `must_change_password` tinyint(1) DEFAULT '0' COMMENT '1 = Bisa ganti / reset password ketika mau login (Artinya ketika user masukan password lama arahkan ke form ganti password).\r\n0 = Tidak di ijinkan ganti password',
  `is_login` tinyint(1) DEFAULT '0' COMMENT 'Untuk indikator user sedang login atau tidak.\r\n1 = Sedang login \r\n0 = Sudah logout',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `users_unique` (`user_name`,`role_id`,`is_active`),
  KEY `users_roles_FK` (`role_id`),
  CONSTRAINT `users_roles_FK` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses` (
  `warehouse_id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `warehouse_code` varchar(5) NOT NULL,
  `warehouse_name` varchar(150) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone_number` varchar(14) DEFAULT NULL,
  `city` varchar(80) DEFAULT NULL,
  `regency` varchar(80) DEFAULT NULL,
  `address` varchar(180) DEFAULT NULL,
  `status` enum('A','C') NOT NULL DEFAULT 'A' COMMENT 'A = Active\r\nC = Close',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_id` int unsigned NOT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `updated_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`warehouse_id`),
  UNIQUE KEY `warehouses_unique` (`warehouse_code`),
  KEY `warehouses_users_FK` (`created_id`),
  KEY `warehouses_users_FK_1` (`updated_id`),
  CONSTRAINT `warehouses_users_FK` FOREIGN KEY (`created_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `warehouses_users_FK_1` FOREIGN KEY (`updated_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'warehouse'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-01 15:22:33
