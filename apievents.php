<?php
header('Content-Type: application/json');
require_once '../includes/config.php';
require_once '../includes/auth_functions.php';

$response = ['success' => false, 'message' => ''];

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            // Récupérer les événements avec pagination et filtres
            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $per_page = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 6;
            $offset = ($page - 1) * $per_page;
            
            // Filtres
            $where = [];
            $params = [];
            
            if (!empty($_GET['search'])) {
                $where[] = "(title LIKE ? OR description LIKE ?)";
                $search_term = "%" . $_GET['search'] . "%";
                $params[] = $search_term;
                $params[] = $search_term;
            }
            
            if (!empty($_GET['location'])) {
                $where[] = "location = ?";
                $params[] = $_GET['location'];
            }
            
            if (!empty($_GET['date'])) {
                $where[] = "event_date = ?";
                $params[] = $_GET['date'];
            }
            
            if (!empty($_GET['category'])) {
                $where[] = "category = ?";
                $params[] = $_GET['category'];
            }
            
            $where_clause = $where ? "WHERE " . implode(" AND ", $where) : "";
            
            // Compter le total
            $count_stmt = $pdo->prepare("SELECT COUNT(*) FROM events $where_clause");
            $count_stmt->execute($params);
            $total = $count_stmt->fetchColumn();
            
            // Récupérer les événements
            $stmt = $pdo->prepare("
                SELECT e.*, 
                       (SELECT COUNT(*) FROM ticket_types WHERE event_id = e.event_id) as ticket_types_count
                FROM events e
                $where_clause
                ORDER BY event_date ASC
                LIMIT ? OFFSET ?
            ");
            
            $params[] = $per_page;
            $params[] = $offset;
            $stmt->execute($params);
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Récupérer les types de billets pour chaque événement
            foreach ($events as &$event) {
                $stmt = $pdo->prepare("SELECT * FROM ticket_types WHERE event_id = ?");
                $stmt->execute([$event['event_id']]);
                $event['ticket_types'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            $response = [
                'success' => true,
                'data' => $events,
                'pagination' => [
                    'page' => $page,
                    'per_page' => $per_page,
                    'total' => $total,
                    'total_pages' => ceil($total / $per_page)
                ]
            ];
            break;
            
        case 'POST':
            // Créer un nouvel événement (admin seulement)
            if (!is_admin()) {
                $response['message'] = 'Unauthorized';
                http_response_code(403);
                break;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validation des données
            $required = ['title', 'description', 'category', 'location', 'venue', 'event_date', 'event_time'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $response['message'] = "Field $field is required";
                    http_response_code(400);
                    echo json_encode($response);
                    exit;
                }
            }
            
            // Insérer l'événement
            $stmt = $pdo->prepare("
                INSERT INTO events 
                (title, description, category, location, venue, organizer, event_date, event_time, image_path, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['title'],
                $data['description'],
                $data['category'],
                $data['location'],
                $data['venue'] ?? '',
                $data['organizer'] ?? '',
                $data['event_date'],
                $data['event_time'],
                $data['image_path'] ?? '',
                $_SESSION['user_id']
            ]);
            
            $event_id = $pdo->lastInsertId();
            
            // Ajouter les types de billets
            if (!empty($data['ticket_types']) && is_array($data['ticket_types'])) {
                foreach ($data['ticket_types'] as $ticket_type) {
                    $stmt = $pdo->prepare("
                        INSERT INTO ticket_types 
                        (event_id, name, price, quantity_available)
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $event_id,
                        $ticket_type['name'],
                        $ticket_type['price'],
                        $ticket_type['quantity_available']
                    ]);
                }
            }
            
            $response = [
                'success' => true,
                'message' => 'Event created successfully',
                'event_id' => $event_id
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