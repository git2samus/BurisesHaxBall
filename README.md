# BurisesHaxBall

r/Burises HaxBall server

## Pasos levantar un server en Google Cloud

1. Ir a https://console.cloud.google.com/compute/instancesAdd para crear una VM
2. Crear una VM con los sigientes parámetros:
   - Name: (cualquiera)
   - Region: southamerica-west1
   - Zone: (cualquiera de las habilitadas para esa region)
   - Machine family: General purpose
   - Series: E2
   - Machine type: e2-small
   - Firewall: Clickear "Allow HTTP traffic" y "Allow HTTPS traffic"
3. Conectarse por SSH (instrucciones: https://cloud.google.com/compute/docs/instances/connecting-advanced#thirdpartytools)
   1. Comando para conectarse: `gcloud compute ssh <nombre-de-la-vm> --zone=<zona-de-la-vm>`
   2. Una vez conectado instalar dependencias: `sudo apt-get install -y git screen libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 libxkbcommon0`
   3. Clonar repo: `git clone https://github.com/git2samus/BurisesHaxBall.git && cd BurisesHaxBall`
   4. Instalar [nvm](https://github.com/nvm-sh/nvm) `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash`
   5. Iniciar una sesión de [screen](https://www.gnu.org/software/screen/): `screen`
   6. Instalar [Node.js](https://nodejs.org/) y dependencias de Javascript: `nvm install node && nvm use node && npm install`
   7. Levantar el server: `node server.js <nombre-de-la-sala> <password-de-admin> <token-del-captcha>`
      - El token se consigue acá: https://www.haxball.com/headlesstoken

Al levantar el server nos muestra una URL para entrar a la sala, el proceso queda corriendo.

Para desconectarse sin interrumpir la partida hay que pasar la sesión de screen a segundo plano apretando ***Ctrl-a*** y después ***d*** luego podemos cerrar la conexión SSH.

Para volver la sesión de screen a primer plano y parar el servidor ejecutamos `screen -r` y luego apretamos ***Ctrl-d***.
