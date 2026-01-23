$env:DATABASE_URL = "mysql://root@127.0.0.1:3306/waste_route_manager"
$env:JWT_SECRET = "local_dev_secret"
$env:ADMIN_EMPLOYEE_ID = "admin"
$env:ADMIN_NAME = "Administrator"
$env:ADMIN_PIN = "1234"

npm run dev
