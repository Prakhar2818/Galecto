@echo off
set "PATH=C:\nvm4w\nodejs;%PATH%"

echo Starting auth-service on port 4000...
start "Auth Service" cmd /c "cd /d "D:\Track 1\apps\auth-service" && npm run dev"

echo Starting api-gateway on port 3001...
start "API Gateway" cmd /c "cd /d "D:\Track 1\apps\api-gateway" && npm run dev"

echo Starting alert-service on port 5003...
start "Alert Service" cmd /c "cd /d "D:\Track 1\apps\alert-service" && npm run dev"

echo Starting query-service on port 4002...
start "Query Service" cmd /c "cd /d "D:\Track 1\apps\query-service" && npm run dev"

echo Starting log-service on port 4001...
start "Log Service" cmd /c "cd /d "D:\Track 1\apps\log-service" && npm run dev"

echo Starting frontend on port 3000...
start "Frontend" cmd /c "cd /d "D:\Track 1\apps\frontend" && npm run dev"

echo All services started!
