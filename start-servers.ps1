# Start both servers for LPU Live

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "   LPU Live - Starting Servers" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Start Backend Server in new window
Write-Host "Starting Backend Server on port 5000..." -ForegroundColor Green
Write-Host "Using Simple CSV Database (No MongoDB Required!)" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Simple CSV Backend Server' -ForegroundColor Green; Write-Host 'Data stored in: data/ folder' -ForegroundColor Cyan; node server/server-simple.js"

# Wait a bit
Start-Sleep -Seconds 3

# Start Frontend Server in new window
Write-Host "Starting Frontend Server on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'Frontend Server' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "   Servers are starting!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  ${import.meta.env.PROD ? '' : 'http://localhost:5000'}" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000 or 3001" -ForegroundColor Yellow
Write-Host ""
Write-Host "Login with any registration number from student_data.json" -ForegroundColor Magenta
Write-Host "Example: Username: 12306253, Password: 12306253" -ForegroundColor Magenta
Write-Host ""
