<?php
require_once 'config.php';

function register_user($username, $email, $password, $first_name, $last_name, $phone) {
    global $pdo;
    
    // Vérifier si l'utilisateur existe déjà
    $stmt = $pdo->prepare("SELECT user_id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    if ($stmt->rowCount() > 0) {
        return false; // Utilisateur existe déjà
    }
    
    // Hasher le mot de passe
    $password_hash = password_hash($password, PASSWORD_BCRYPT);
    
    // Insérer le nouvel utilisateur
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?)");
    return $stmt->execute([$username, $email, $password_hash, $first_name, $last_name, $phone]);
}

function login_user($username, $password) {
    global $pdo;
    
    // Récupérer l'utilisateur
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($password, $user['password_hash'])) {
        // Créer la session
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['first_name'] = $user['first_name'];
        $_SESSION['last_name'] = $user['last_name'];
        $_SESSION['is_admin'] = $user['is_admin'];
        return true;
    }
    
    return false;
}

function logout_user() {
    session_unset();
    session_destroy();
}

function get_current_user() {
    if (!is_logged_in()) return null;
    
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
?>