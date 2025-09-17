<?php
class Database {
    private $host = "localhost";
    private $db_name = "?";
    private $username = "?";
    private $password = "?";
    private $charset = "utf8mb4";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'utf8mb4'"
            ];
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $exception) {
            die("Connection error: " . $exception->getMessage());
        }
        return $this->conn;
    }
}
?>
