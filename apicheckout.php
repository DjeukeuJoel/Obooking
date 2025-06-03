<?php
header('Content-Type: application/json');
require_once '../includes/config.php';
require_once '../includes/auth_functions.php';

$response = ['success' => false, 'message' => ''];

if (!is_logged_in()) {
    $response['message'] = 'Authentication required';
    http_response_code(401);
    echo json_encode($response);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'POST':
            // Finaliser la commande
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validation des données
            $required = ['payment_method', 'first_name', 'last_name', 'email', 'phone'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $response['message'] = "Field $field is required";
                    http_response_code(400);
                    echo json_encode($response);
                    exit;
                }
            }
            
            // Vérifier le panier
            if (empty($_SESSION['cart']) || !is_array($_SESSION['cart'])) {
                $response['message'] = 'Your cart is empty';
                http_response_code(400);
                break;
            }
            
            // Calculer le total
            $subtotal = 0;
            foreach ($_SESSION['cart'] as $item) {
                $subtotal += $item['price'] * $item['quantity'];
            }
            $total = $subtotal + SERVICE_FEE;
            
            // Commencer une transaction
            $pdo->beginTransaction();
            
            try {
                // Créer la réservation
                $stmt = $pdo->prepare("
                    INSERT INTO bookings 
                    (user_id, event_id, booking_date, total_amount, payment_status, payment_method)
                    VALUES (?, ?, NOW(), ?, ?, ?)
                ");
                
                // Note: Nous prenons le premier event_id du panier pour simplifier
                // Dans une vraie application, vous pourriez avoir plusieurs événements dans le panier
                $first_item = reset($_SESSION['cart']);
                $event_id = $first_item['event_id'];
                
                $stmt->execute([
                    $_SESSION['user_id'],
                    $event_id,
                    $total,
                    'paid', // En production, vous devriez vérifier le paiement
                    $data['payment_method']
                ]);
                
                $booking_id = $pdo->lastInsertId();
                
                // Ajouter les billets réservés
                foreach ($_SESSION['cart'] as $item) {
                    // Vérifier à nouveau la disponibilité
                    $stmt = $pdo->prepare("
                        SELECT quantity_available 
                        FROM ticket_types 
                        WHERE ticket_type_id = ? FOR UPDATE
                    ");
                    $stmt->execute([$item['ticket_type_id']]);
                    $ticket_type = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if (!$ticket_type || $ticket_type['quantity_available'] < $item['quantity']) {
                        throw new Exception("Not enough tickets available for {$item['ticket_name']}");
                    }
                    
                    // Ajouter le billet réservé
                    $stmt = $pdo->prepare("
                        INSERT INTO booked_tickets 
                        (booking_id, ticket_type_id, quantity, price)
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $booking_id,
                        $item['ticket_type_id'],
                        $item['quantity'],
                        $item['price']
                    ]);
                    
                    // Mettre à jour la quantité disponible
                    $stmt = $pdo->prepare("
                        UPDATE ticket_types 
                        SET quantity_available = quantity_available - ? 
                        WHERE ticket_type_id = ?
                    ");
                    $stmt->execute([
                        $item['quantity'],
                        $item['ticket_type_id']
                    ]);
                }
                
                // Tout s'est bien passé, valider la transaction
                $pdo->commit();
                
                // Vider le panier
                unset($_SESSION['cart']);
                
                $response = [
                    'success' => true,
                    'message' => 'Booking completed successfully',
                    'booking_id' => $booking_id
                ];
            } catch (Exception $e) {
                // Une erreur s'est produite, annuler la transaction
                $pdo->rollBack();
                throw $e;
            }
            break;
            
        default:
            $response['message'] = 'Method not allowed';
            http_response_code(405);
    }
} catch (PDOException $e) {
    $response['message'] = 'Database error: ' . $e->getMessage();
    http_response_code(500);
} catch (Exception $e) {
    $response['message'] = 'Error: ' . $e->getMessage();
    http_response_code(400);
}

echo json_encode($response);
?>