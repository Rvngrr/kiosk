<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

// Your DB connection here
$conn = new mysqli("localhost", "root", "", "basta_db");
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'DB connection failed: ' . $conn->connect_error]);
    exit;
}

// Get raw POST data
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON']);
    exit;
}
// Example: Insert order (adjust table/columns as needed)
$customer = $data['customer'] ?? '';
$total = isset($data['total']) ? floatval($data['total']) : 0;
$paid = isset($data['paid']) ? floatval($data['paid']) : 0;

try {
    // Use transaction for atomicity
    $conn->begin_transaction();

    // Prepared statement for orders — use existing table columns: customer_name, order_date, total_amount
    // We use NOW() for the order_date and store total_amount; the table does not have a 'paid' column.
    $stmt = $conn->prepare("INSERT INTO orders (customer_name, order_date, total_amount) VALUES (?, NOW(), ?)");
    if (!$stmt) throw new Exception('Prepare failed: ' . $conn->error);

    $stmt->bind_param('sd', $customer, $total);
    if (!$stmt->execute()) throw new Exception('Execute failed (orders): ' . $stmt->error);

    $orderId = $conn->insert_id;
    $stmt->close();

    // Prepared statement for order items — adapt to your table columns
    // order_items columns: order_id, product_id, product_name, category, price, quantity
    $itemStmt = $conn->prepare("INSERT INTO order_items (order_id, product_id, product_name, category, price, quantity) VALUES (?, ?, ?, ?, ?, ?)");
    if (!$itemStmt) throw new Exception('Prepare failed (items): ' . $conn->error);

    foreach ($data['items'] as $item) {
        $itemId = isset($item['id']) ? intval($item['id']) : 0;
        $itemName = $item['name'] ?? '';
        $itemCategory = $item['category'] ?? '';
        $itemPrice = isset($item['price']) ? floatval($item['price']) : 0;
        $itemQty = isset($item['qty']) ? intval($item['qty']) : 0;

        $itemStmt->bind_param('iissdi', $orderId, $itemId, $itemName, $itemCategory, $itemPrice, $itemQty);
        if (!$itemStmt->execute()) throw new Exception('Execute failed (item): ' . $itemStmt->error);
    }

    $itemStmt->close();
    $conn->commit();

    echo json_encode(['success' => true, 'order_id' => $orderId]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
