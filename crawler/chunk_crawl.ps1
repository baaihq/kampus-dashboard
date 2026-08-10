param(
    [int]$Chunks = 4,
    [int]$PerChunk = 800
)

$proj = "C:\Users\MyBook SAGA 12\Documents\Default Project\kampus"
$py = Join-Path $proj "crawler\.venv\Scripts\python.exe"
$crawl = Join-Path $proj "crawler\crawl.py"
$data = Join-Path $proj "dashboard\public\data"
$log = Join-Path $proj "crawler\logs\chunks.log"

for ($i = 1; $i -le $Chunks; $i++) {
    Write-Host "== chunk $i start =="
    $out = & $py $crawl --skip-list --limit-detail $PerChunk --workers 3 --delay 0.2 2>&1
    $out | Add-Content -Path $log -Encoding utf8
    if (Test-Path (Join-Path $data "meta.json")) {
        $meta = Get-Content (Join-Path $data "meta.json") -Raw | ConvertFrom-Json
        $status = "chunk ${i}: snbp $($meta.detail_snbp)/$($meta.prodi_snbp), snbt $($meta.detail_snbt)/$($meta.prodi_snbt)"
        Write-Host $status
        $status | Add-Content -Path $log -Encoding utf8
        if ($meta.detail_snbp -ge $meta.prodi_snbp -and $meta.detail_snbt -ge $meta.prodi_snbt) {
            Write-Host "DONE"
            "DONE" | Add-Content -Path $log -Encoding utf8
            break
        }
    }
    Write-Host "== chunk ${i} selesai =="
}
