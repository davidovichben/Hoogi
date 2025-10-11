# Supabase Export Script
$URL     = 'https://lcazbaggfdejukjgkpeu.supabase.co/functions/v1/admin-gateway'
$TOKEN   = 'd21bcca0-365e-4d7d-8f50-12805dbf6249511820d0b32f4936'
$BUCKET  = 'exports'
$EXPIRES = 86400
$TS      = Get-Date -Format 'yyyyMMdd-HHmmss'
$OUTDIR  = ".\supabase_export-$TS"

$headers = @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" }
New-Item -ItemType Directory -Force -Path $OUTDIR | Out-Null

function AG([hashtable]$Body,[string]$OutFile) {
  $json = $Body | ConvertTo-Json -Depth 8
  Invoke-WebRequest -Uri $URL -Method POST -Headers $headers -Body $json -OutFile $OutFile
}

Write-Host "1) Exporting JSON reports..." -ForegroundColor Cyan
AG @{action="rpc"; rpc="export_structure_inventory"} (Join-Path $OUTDIR "structure_inventory.json")
AG @{action="rpc"; rpc="export_rls_only"}           (Join-Path $OUTDIR "rls_policies.json")
AG @{action="rpc"; rpc="export_table_counts"}       (Join-Path $OUTDIR "table_counts.json")
AG @{action="rpc"; rpc="export_storage_manifest"}   (Join-Path $OUTDIR "storage_manifest.json")
Invoke-WebRequest -Uri $URL -Method POST -Headers $headers -Body (@{action="auth.list"} | ConvertTo-Json) -OutFile (Join-Path $OUTDIR "auth_users.json")

Write-Host "2) Compressing to ZIP..." -ForegroundColor Cyan
$zipPath = "supabase_export-$TS.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $OUTDIR '*') -DestinationPath $zipPath -Force

Write-Host "3) Uploading to Storage..." -ForegroundColor Cyan
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($zipPath))
$destPath = "inventory/supabase_export-$TS.zip"
$uploadBody = @{
  action = "storage.put"
  bucket = $BUCKET
  path   = $destPath
  payload = @{ contentBase64 = $b64; contentType = "application/zip" }
} | ConvertTo-Json -Depth 8
Invoke-WebRequest -Uri $URL -Method POST -Headers $headers -Body $uploadBody | Out-Null

Write-Host "4) Generating signed URL for 24 hours..." -ForegroundColor Cyan
$getBody = @{
  action = "storage.get"
  bucket = $BUCKET
  path   = $destPath
  payload = @{ expiresInSec = $EXPIRES }
} | ConvertTo-Json -Depth 8
$response = Invoke-WebRequest -Uri $URL -Method POST -Headers $headers -Body $getBody
$link = (ConvertFrom-Json $response.Content).url
$link | Out-File -Encoding utf8 (Join-Path $OUTDIR "SIGNED_URL.txt")

Write-Host "`nLocal folder: $OUTDIR" -ForegroundColor Green
Write-Host "ZIP path:    $zipPath"   -ForegroundColor Green
Write-Host "`nSigned URL (24h):"     -ForegroundColor Yellow
Write-Host $link -ForegroundColor Green