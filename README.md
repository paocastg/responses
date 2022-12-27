# Cierre de conversación con tags
Esta es una aplicación Rocket.Chat que está diseñada para cerrar conversaciones o chats con etiquetas, a través del comando de barra diagonal `/tagclose`. La aplicación requiere de API de carga de tags y API de cierre de conversación.
# Instalación

1. npm install
2. npm install -g @rocket.chat/apps-cli

A continuación, deberá agregar la aplicación a su instancia de Rocket.Chat.

1. En la administración de Rocket.Chat, vaya a General -> Aplicaciones y habilite el modo de desarrollo para permitir la instalación de aplicaciones que no están en el mercado.
2. Siga las instrucciones en https://rocket.chat/docs/developer-guides/developing-apps/getting-started/ para instalar apps-cli.
3. Cambie el directorio al directorio de la aplicación e instale los módulos necesarios.

```bash
npm install
```

4. Implemente la aplicación en su laboratorio de instancias de Rocket.Chat o local.
previamente configure el archivo .rcappsconfig con las credenciales de su usuario usado para el despliegue de aplicaciones desde su local indicando la url de su instancia de Rocket.Chat y el id de su usuario. En el caso no se tenga el ID y token, generarlo desde la plataforma de Rocketchat

```bash
"url": "http://labdesk.keos.co:3000/",
"userId":"5wjFAZyuFK8GtwgHo",
```

```bash
rc-apps deploy --token='xxxxxxxxxxxxxxxxxxxxxxxxxxxx' 
```

Si está modificando el código, puede ejecutar lo siguiente para actualizar la aplicación después de haberla instalado.

```bash
rc-apps deploy --token='xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' --update
```

5. En la administración de Rocket.Chat, vaya a Aplicaciones -> Instalada ->Cierre de Chat con Tags  y habilite/configure con la API de carga de tags y API de cierre de conversación.
