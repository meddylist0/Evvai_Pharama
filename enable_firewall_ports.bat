@echo off
echo =======================================================
echo Enabling EVVAI Pharma Ports 8000 and 3000 in Windows Firewall
echo =======================================================
netsh advfirewall firewall add rule name="EVVAI Backend Port 8000" dir=in action=allow protocol=TCP localport=8000 profile=any
netsh advfirewall firewall add rule name="EVVAI Frontend Port 3000" dir=in action=allow protocol=TCP localport=3000 profile=any
powershell -Command "Get-NetFirewallApplicationFilter -Program *python.exe | Get-NetFirewallRule | Set-NetFirewallRule -Profile Any"
echo.
echo =======================================================
echo Firewall configuration complete! Port 8000 and 3000 are now open on Private, Public and Domain networks.
echo =======================================================
pause
