<?php
// get_products.php
header('Content-Type: application/json; charset=utf-8');
include __DIR__ . '/../db.php';

// optional filters
$category = isset($_GET['category']) ? trim($_GET['category']) : '';
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

// base query
$sql = "SELECT id, name, category, price, image FROM products";
$params = [];
$types = '';
$clauses = [];

if($category !== ''){
    $clauses[] = "category = ?";
    $params[] = $category;
    $types .= 's';
}
if($search !== ''){
    $clauses[] = "name LIKE ?";
    $params[] = '%' . $search . '%';
    $types .= 's';
}

if(count($clauses) > 0){
    $sql .= " WHERE " . implode(" AND ", $clauses);
}

$sql .= " ORDER BY id DESC";

if(count($params) === 0){
    $result = $conn->query($sql);
    $rows = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
} else {
    $stmt = $conn->prepare($sql);
    if($stmt === false){
        echo json_encode([]);
        exit;
    }
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $res = $stmt->get_result();
    $rows = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
    $stmt->close();
}

// normalize image: only filename (fallback to image-gallery.png)
foreach($rows as &$r){
    $img = isset($r['image']) ? trim($r['image']) : '';
    if ($img === '') {
        $r['image'] = 'image-gallery.png';
    } else {
        $r['image'] = basename($img); // ensure only filename so JS uses ../uploads/filename
    }
}
unset($r);

echo json_encode($rows, JSON_UNESCAPED_UNICODE);
