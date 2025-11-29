<?php
include '../db.php';
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

$sql = "SELECT * FROM products ORDER BY id DESC";
$result = $conn->query($sql);

$products = [];
if($result){
    while($row = $result->fetch_assoc()){
        $products[] = $row;
    }
}

echo json_encode($products);
?>
