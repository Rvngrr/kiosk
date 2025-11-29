<?php
include '../db.php';
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

$name = $_POST['name'] ?? '';
$category = $_POST['category'] ?? '';
$price = $_POST['price'] ?? 0;

// Default image
$image = "uploads/image-gallery.png";

// Handle uploaded file
if(isset($_FILES['image']) && $_FILES['image']['error'] == 0){
    $targetDir = "../uploads/";
    if(!is_dir($targetDir)) mkdir($targetDir, 0777, true);

    $imageName = time() . "_" . basename($_FILES["image"]["name"]);
    $targetFile = $targetDir . $imageName;

    if(move_uploaded_file($_FILES["image"]["tmp_name"], $targetFile)){
        $image = "uploads/".$imageName;  // relative path for HTML
    } else {
        echo json_encode(["success"=>false, "error"=>"Failed to upload image"]);
        exit;
    }
}

// Insert into DB
$stmt = $conn->prepare("INSERT INTO products (name, category, price, image) VALUES (?, ?, ?, ?)");
if(!$stmt){
    echo json_encode(["success"=>false, "error"=>$conn->error]);
    exit;
}
$stmt->bind_param("ssds", $name, $category, $price, $image);
if(!$stmt->execute()){
    echo json_encode(["success"=>false, "error"=>$stmt->error]);
    $stmt->close();
    exit;
}

$stmt->close();
echo json_encode(["success"=>true]);
?>
