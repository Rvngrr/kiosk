<?php
// get_categories.php
header('Content-Type: application/json; charset=utf-8');
include __DIR__ . '/../db.php';

// Try to get categories from products table (distinct)
$sql = "SELECT DISTINCT COALESCE(NULLIF(category,''),'Uncategorized') AS category
        FROM products
        ORDER BY category ASC";

$result = $conn->query($sql);

$cats = [];
if($result){
    while($row = $result->fetch_assoc()){
        $cats[] = $row['category'];
    }
}

echo json_encode($cats, JSON_UNESCAPED_UNICODE);
