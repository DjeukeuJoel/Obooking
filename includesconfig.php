<?php
// Configuration de la base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'eventbooking');
define('DB_USER', 'root');
define('DB_PASS', '');

// Configuration de l'application
define('BASE_URL', 'http://localhost/eventbooking/');
define('SERVICE_FEE', 2.50); // Frais de service

// Initialisation de la session et connexion à la DB
session_start();

try {
    $pdo = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erreur de connexion à la base de données: " . $e->getMessage());
}

// Fonctions utilitaires
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function is_logged_in() {
    return isset($_SESSION['user_id']);
}

function is_admin() {
    return isset($_SESSION['is_admin']) && $_SESSION['is_admin'];
}

function redirect($url) {
    header("Location: " . BASE_URL . $url);
    exit();
}
?>