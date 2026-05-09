$conn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($conn) {
    $p = $conn.OwningProcess
    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    Write-Host "Killed process $p on port 3000"
} else {
    Write-Host "No process found on port 3000"
}
