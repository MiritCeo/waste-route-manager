# Deploy na DigitalOcean (Droplet) — krok po kroku

Poniżej instrukcja dla backendu (Fastify + Prisma + MySQL) zakładająca,
że repo jest pobierane z Gita i uruchamiane bez Dockera.

## 1) Przygotowanie serwera (świeży droplet)
Zaloguj się na droplet:

```
ssh root@TWOJ_IP
```

Zaktualizuj system i zainstaluj podstawowe narzędzia:

```
apt update && apt upgrade -y
apt install -y git curl ufw


```

Ustaw strefę czasową:

```
timedatectl set-timezone Europe/Warsaw
```

Utwórz użytkownika do deployu:

```
adduser deploy
usermod -aG sudo deploy
```

Zabezpiecz SSH (zalecane):

- wygeneruj klucz lokalnie: `ssh-keygen`
- skopiuj klucz: `ssh-copy-id deploy@TWOJ_IP`
- edytuj `/etc/ssh/sshd_config`:
  - `PermitRootLogin no`
  - `PasswordAuthentication no`
- zrestartuj SSH:

```
systemctl restart ssh
```

Skonfiguruj firewall (UFW):

```
ufw allow OpenSSH
ufw allow 3000
ufw enable
ufw status
```

Od teraz zaloguj się jako użytkownik `deploy`:

```
ssh deploy@TWOJ_IP
```

Zainstaluj Node.js 20 (NodeSource):

```
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
# jeśli npm nie jest dostępny:
command -v npm >/dev/null || apt install -y npm
node -v
npm -v
```

## 2) MySQL
Zainstaluj MySQL:

```
apt install -y mysql-server
systemctl enable mysql
systemctl start mysql
```

Zabezpiecz instalację:

```
mysql_secure_installation
```

Utwórz bazę i użytkownika:

```
mysql -u root -p
```

W konsoli MySQL:

```
CREATE DATABASE waste_route_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'waste_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON waste_route_manager.* TO 'waste_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 3) Pobranie repo i instalacja backendu
```
mkdir -p /var/www
cd /var/www
git clone <URL_TWOJEGO_REPO> waste-route-manager
cd waste-route-manager/backend
npm install
```

## 4) Konfiguracja środowiska
Utwórz plik `.env` w `backend/`:

```
cat > .env << 'EOF'
DATABASE_URL="mysql://waste_user:STRONG_PASSWORD@localhost:3306/waste_route_manager"
JWT_SECRET="BARDZO_MOCNY_SEKRET"
PORT=3000
ADMIN_EMPLOYEE_ID="admin"
ADMIN_NAME="Administrator"
ADMIN_PIN="1234"
EOF
```

## 5) Migracje i seed
Pierwsze uruchomienie (tworzy migracje):

```
npm run prisma:generate
npx prisma migrate dev --name init
npm run prisma:seed
```

Kolejne deploye (migracje już istnieją w repo):

```
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
```

## 6) Uruchomienie backendu
Na start testowo:

```
npm run dev
```

Sprawdź:

```
curl http://localhost:3000/api/health
```

## 7) Systemd (stały proces)
Utwórz usługę:

```
cat > /etc/systemd/system/waste-backend.service << 'EOF'
[Unit]
Description=Waste Route Manager Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/waste-route-manager/backend
EnvironmentFile=/var/www/waste-route-manager/backend/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
EOF
```

Zbuduj i uruchom:

```
cd /var/www/waste-route-manager/backend
npm run build
systemctl daemon-reload
systemctl enable waste-backend
systemctl start waste-backend
systemctl status waste-backend
```

## 8) Aktualizacje z repo (deploy)
```
cd /var/www/waste-route-manager
git pull
cd backend
npm install
npm run prisma:deploy
npm run build
systemctl restart waste-backend
```

## 9) Frontend — build i połączenie z backendem
Zbuduj frontend na serwerze:

```
cd /var/www/waste-route-manager
npm install
cat > .env.production << 'EOF'
VITE_USE_MOCK_DATA=false
VITE_API_URL=http://142.93.167.53:3000/api
EOF
npm run build
```

Wynik trafi do `dist/`.

## 10) Nginx (frontend + proxy do API)
Zainstaluj Nginx:

```
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

Konfiguracja:

```
cat > /etc/nginx/sites-available/waste-app << 'EOF'
server {
  listen 80;
  server_name _;

  root /var/www/waste-route-manager/dist;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
EOF

ln -s /etc/nginx/sites-available/waste-app /etc/nginx/sites-enabled/waste-app
nginx -t
systemctl reload nginx
```

## 11) Porty i firewall
Jeśli używasz UFW:

```
ufw allow 3000
ufw allow 80
ufw enable
```
