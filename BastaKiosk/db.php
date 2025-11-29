<?php
$servername = "localhost";
$username = "root";
$password = "";  // set your MySQL password
$dbname = "basta_db";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Optional: set charset
$conn->set_charset("utf8");
?>
