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
        case 'GET':
            // Récupérer le panier de l'utilisateur (stocké en session ou base de données)
            $response = [
                'success' => true,
                'data' => $_SESSION['cart'] ?? []
            ];
            break;
            
        case 'POST':
            // Ajouter un item au panier
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validation
            if (empty($data['event_id']) || empty($data['ticket_type_id']) || empty($data['quantity'])) {
                $response['message'] = 'Missing required fields';
                http_response_code(400);
                break;
            }
            
            // Vérifier la disponibilité des billets
            $stmt = $pdo->prepare("
                SELECT tt.*, e.title as event_title
                FROM ticket_types tt
                JOIN events e ON tt.event_id = e.event_id
                WHERE tt.ticket_type_id = ? AND tt.event_id = ?
            ");
            $stmt->execute([$data['ticket_type_id'], $data['event_id']]);
            $ticket_type = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$ticket_type) {
                $response['message'] = 'Ticket type not found';
                http_response_code(404);
                break;
            }
            
            if ($data['quantity'] > $ticket_type['quantity_available']) {
                $response['message'] = 'Not enough tickets available';
                http_response_code(400);
                break;
            }
            
            // Initialiser le panier si nécessaire
            if (!isset($_SESSION['cart'])) {
                $_SESSION['cart'] = [];
            }
            
            // Vérifier si l'item existe déjà dans le panier
            $found = false;
            foreach ($_SESSION['cart'] as &$item) {
                if ($item['ticket_type_id'] == $data['ticket_type_id']) {
                    $new_quantity = $item['quantity'] + $data['quantity'];
                    if ($new_quantity > $ticket_type['quantity_available']) {
                        $response['message'] = 'Total quantity exceeds available tickets';
                        http_response_code(400);
                        echo json_encode($response);
                        exit;
                    }
                    $item['quantity'] = $new_quantity;
                    $found = true;
                    break;
                }
            }
            
            if (!$found) {
                $_SESSION['cart'][] = [
                    'event_id' => $data['event_id'],
                    'event_title' => $ticket_type['event_title'],
                    'ticket_type_id' => $data['ticket_type_id'],
                    'ticket_name' => $ticket_type['name'],
                    'price' => $ticket_type['price'],
                    'quantity' => $data['quantity']
                ];
            }
            
            $response = [
                'success' => true,
                'message' => 'Item added to cart',
                'cart' => $_SESSION['cart']
            ];
            break;
            
        case 'DELETE':
            // Supprimer un item du panier
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (empty($data['ticket_type_id'])) {
                $response['message'] = 'Ticket type ID required';
                http_response_code(400);
                break;
            }
            
            if (isset($_SESSION['cart'])) {
                $_SESSION['cart'] = array_filter($_SESSION['cart'], function($item) use ($data) {
                    return $item['ticket_type_id'] != $data['ticket_type_id'];
                });
                $_SESSION['cart'] = array_values($_SESSION['cart']); // Réindexer
            }
            
            $response = [
                'success' => true,
                'message' => 'Item removed from cart',
                'cart' => $_SESSION['cart'] ?? []
            ];
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