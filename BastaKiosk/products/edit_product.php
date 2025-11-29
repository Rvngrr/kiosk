<?php
include '../db.php';
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

$id = $_POST['id'] ?? 0;
$name = $_POST['name'] ?? '';
$category = $_POST['category'] ?? '';
$price = $_POST['price'] ?? 0;

// Get existing image
$result = $conn->query("SELECT image FROM products WHERE id=$id");
$row = $result->fetch_assoc();
$image = $row['image'] ?? "uploads/image-gallery.png";

// Handle new image upload
if(isset($_FILES['image']) && $_FILES['image']['error'] == 0){
    $targetDir = "../uploads/";
    if(!is_dir($targetDir)) mkdir($targetDir, 0777, true);

    $imageName = time() . "_" . basename($_FILES["image"]["name"]);
    $targetFile = $targetDir . $imageName;
    if(move_uploaded_file($_FILES["image"]["tmp_name"], $targetFile)){
        $image = "uploads/".$imageName;
    }
}

// Update DB
$stmt = $conn->prepare("UPDATE products SET name=?, category=?, price=?, image=? WHERE id=?");
if(!$stmt){
    echo json_encode(["success"=>false, "error"=>$conn->error]);
    exit;
}
$stmt->bind_param("ssdsi", $name, $category, $price, $image, $id);
if(!$stmt->execute()){
    echo json_encode(["success"=>false, "error"=>$stmt->error]);
    $stmt->close();
    exit;
}

$stmt->close();
echo json_encode(["success"=>true]);
?>
    