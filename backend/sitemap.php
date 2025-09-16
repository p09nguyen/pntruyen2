<?php
// Tạo sitemap động cho pntruyen.online
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/xml; charset=UTF-8');
require_once __DIR__ . '/../config/database.php';

function esc($str) {
    return htmlspecialchars($str, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

$domain = 'https://pntruyen.online';

try {
    $database = new Database();
    $conn = $database->getConnection();
    $stories = [];
    $chapters = [];
    $stmt = $conn->query("SELECT id, slug, updated_at FROM stories WHERE is_published = 1");
    $stories = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Lấy chương cho từng truyện
    $stmt2 = $conn->query("SELECT id, story_id, slug, created_at FROM chapters WHERE is_published = 1");
    while ($row = $stmt2->fetch(PDO::FETCH_ASSOC)) {
        $chapters[] = $row;
    // Nếu có lỗi, trả về text/plain để dễ debug, không xuất XML
    header('Content-Type: text/plain; charset=UTF-8');
    echo "SITEMAP ERROR: " . $e->getMessage();
    http_response_code(500);
    error_log('[SITEMAP ERROR] ' . $e->getMessage());
    exit;
}

echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
echo "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n";

// Trang chủ
?>
  <url>
    <loc><?=$domain?>/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc><?=$domain?>/feedback</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
<?php
// Trang truyện và chương
foreach ($stories as $story) {
    $storyUrl = $domain . '/truyen/' . esc($story['slug']);
    $lastmod = !empty($story['updated_at']) ? date('Y-m-d', strtotime($story['updated_at'])) : '';
    echo "  <url>\n    <loc>{$storyUrl}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n";
    if ($lastmod) echo "    <lastmod>{$lastmod}</lastmod>\n";
    echo "  </url>\n";
    if (!empty($chapters[$story['id']])) {
        foreach ($chapters[$story['id']] as $chapter) {
            $chapterUrl = $storyUrl . '/' . esc($chapter['slug']);
            $clastmod = !empty($chapter['created_at']) ? date('Y-m-d', strtotime($chapter['created_at'])) : '';
            echo "  <url>\n    <loc>{$chapterUrl}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n";
            if ($clastmod) echo "    <lastmod>{$clastmod}</lastmod>\n";
            echo "  </url>\n";
        }
    }
}
echo "</urlset>\n";
