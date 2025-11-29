<?php
include '../db.php';
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

$id = $_POST['id'] ?? 0;

// Optionally, delete the image file too
$result = $conn->query("SELECT image FROM products WHERE id=$id");
$row = $result->fetch_assoc();
if($row && isset($row['image']) && $row['image'] != "uploads/image-gallery.png"){
    $filePath = "../".$row['image'];
    if(file_exists($filePath)) unlink($filePath);
}

// Delete from DB
$stmt = $conn->prepare("DELETE FROM products WHERE id=?");
if(!$stmt){
    echo json_encode(["success"=>false, "error"=>$conn->error]);
    exit;
}
$stmt->bind_param("i", $id);
if(!$stmt->execute()){
    echo json_encode(["success"=>false, "error"=>$stmt->error]);
    $stmt->close();
    exit;
}

$stmt->close();
echo json_encode(["success"=>true]);
?>
