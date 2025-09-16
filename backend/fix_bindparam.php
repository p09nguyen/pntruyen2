<?php
echo "🔧 Starting bindParam to bindValue fix...\n\n";

// Define all API files that need fixing
$apiFiles = [
    'api/stories.php',
    'api/chapters.php',
    'api/auth.php',
    'api/categories.php',
    'api/bookmarks.php'
];

$totalFixed = 0;

foreach ($apiFiles as $file) {
    if (file_exists($file)) {
        echo "📁 Processing: $file\n";
        
        // Read file content
        $content = file_get_contents($file);
        $originalContent = $content;
        
        // Count occurrences before fix
        $beforeCount = substr_count($content, '->bindParam(');
        
        // Replace all bindParam with bindValue
        $content = str_replace('->bindParam(', '->bindValue(', $content);
        
        // Count occurrences after fix
        $afterCount = substr_count($content, '->bindParam(');
        $fixedCount = $beforeCount - $afterCount;
        
        if ($fixedCount > 0) {
            // Write back to file
            file_put_contents($file, $content);
            echo "   ✅ Fixed $fixedCount bindParam occurrences\n";
            $totalFixed += $fixedCount;
        } else {
            echo "   ℹ️  No bindParam found (already fixed)\n";
        }
    } else {
        echo "   ❌ File not found: $file\n";
    }
    echo "\n";
}

echo "🎉 Fix completed!\n";
echo "📊 Total bindParam fixed: $totalFixed\n\n";

echo "🚀 Next steps:\n";
echo "1. Restart XAMPP Apache\n";
echo "2. Clear browser cache (Ctrl+F5)\n";
echo "3. Test admin edit functionality\n\n";

echo "✨ All done! Your admin panel should work now.\n";
?>
