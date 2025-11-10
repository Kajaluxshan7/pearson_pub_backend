$controllers = @(
    "items/items.controller.ts",
    "modules/categories/categories.controller.ts",
    "operation-hours/operation-hours.controller.ts",
    "specials/specials.controller.ts",
    "stories/stories.controller.ts",
    "substitute-sides/substitute-sides.controller.ts",
    "tasks/tasks.controller.ts",
    "wing-sauces/wing-sauces.controller.ts"
)

$basePath = "c:\Users\thava\Desktop\Freelanced Projects\Pearson Pub\pearson_pub_backend\src"

foreach ($controller in $controllers) {
    $filePath = Join-Path $basePath $controller
    $content = Get-Content $filePath -Raw
    
    if ($content -notmatch 'AuthenticatedRequest') {
        # Find the last import statement and add our import after it
        $lines = $content -split "`n"
        $lastImportIndex = -1
        
        for ($i = $lines.Count - 1; $i -ge 0; $i--) {
            if ($lines[$i] -match "^import .* from ") {
                $lastImportIndex = $i
                break
            }
        }
        
        if ($lastImportIndex -ge 0) {
            $newImport = "import { AuthenticatedRequest } from '../common/types/authenticated-request.interface';"
            $lines = $lines[0..$lastImportIndex] + $newImport + $lines[($lastImportIndex + 1)..($lines.Count - 1)]
            $newContent = $lines -join "`n"
            Set-Content -Path $filePath -Value $newContent -NoNewline
            Write-Host "Fixed: $controller"
        }
    }
}
