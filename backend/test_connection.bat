@echo off
echo Testing DB Connection...
powershell -Command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect('aws-1-ap-southeast-2.pooler.supabase.com', 5432); Write-Host 'SUCCESS: Connected to port 5432'; $tcp.Close(); } catch { Write-Host 'FAILED: Could not connect to port 5432'; Write-Error $_ }"
powershell -Command "try { $tcp = New-Object System.Net.Sockets.TcpClient; $tcp.Connect('aws-1-ap-southeast-2.pooler.supabase.com', 6543); Write-Host 'SUCCESS: Connected to port 6543'; $tcp.Close(); } catch { Write-Host 'FAILED: Could not connect to port 6543'; Write-Error $_ }"
pause
