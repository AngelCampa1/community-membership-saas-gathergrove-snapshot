$results = @()

Get-ChildItem -Path "src/screens" -Filter "*.tsx" | Where-Object { $_.Name -ne 'index.tsx' } | ForEach-Object {
    $sourceFile = $_.FullName
    $testFile = Join-Path "src/screens/__tests__" ($_.BaseName + ".test.tsx")

    if (Test-Path $testFile) {
        $sourceLines = (Get-Content $sourceFile | Measure-Object -Line).Lines
        $testLines = (Get-Content $testFile | Measure-Object -Line).Lines

        if ($sourceLines -gt 0) {
            $ratio = [math]::Round($testLines / $sourceLines, 2)

            $results += [PSCustomObject]@{
                Ratio = $ratio
                TestLines = $testLines
                SourceLines = $sourceLines
                File = $_.Name
            }
        }
    }
}

$results | Sort-Object Ratio | Select-Object -First 20 | Format-Table -AutoSize
