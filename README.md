1. El Visor (public.html):
El visor es una página de "solo lectura". Su única fuente de información es el archivo custom-data.js que está en GitHub. Como has hecho la subida correctamente y has usado el modo incógnito para saltar la caché, el visor lee ese archivo de internet y te muestra los datos actualizados.
Lo que debes hacer cada vez que edites (sea local o en la web):
Para que esos cambios que has hecho en la web de administración de tu ordenador se envíen a tu cuenta de GitHub (y los pueda ver tu móvil):

En la web de administración en tu ordenador (macapillaherrero.github.io/index.html), pulsa el botón verde "Exportar per a Publicar".
Esto te descargará un archivo llamado custom-data.js en tu carpeta de descargas del ordenador.
Copia ese archivo descargado y pégalo en la carpeta local de tu ordenador ( OneDrive / calendario-fp-2026 ), reemplazando el antiguo.
Abre la terminal en Visual Studio Code y sube el archivo a GitHub


2. El Administrador (index.html):
El administrador es la herramienta de edición y no lee el archivo custom-data.js (ese archivo es solo el resultado de exportar, el administrador nunca lo consulta). El administrador funciona de la siguiente manera:

En tu navegador habitual de tu PC: Como es donde has hecho las modificaciones, el navegador tiene guardados tus datos en su memoria interna (LocalStorage). Por eso ahí sí los ves.
En una pestaña de Incógnito (u otro navegador/móvil): Las pestañas de incógnito empiezan con la memoria interna totalmente vacía por privacidad. Al no tener acceso a la memoria de tu navegador habitual, el administrador en incógnito no puede ver tus cambios y se carga con los valores vacíos por defecto de la plantilla (data.js).
¿Cómo ver y editar tus datos en el index.html de otro navegador o móvil?
Si quieres llevarte tu "base de datos" de edición a la administración de otro dispositivo, debes usar la función de Importar:

En tu PC habitual, abre index.html y pulsa el botón "Exportar" (el de la flecha de descarga) para obtener el archivo .json con tu copia de seguridad.
Envía ese archivo .json a tu móvil o abre el otro navegador.
Abre la administración (index.html) en ese nuevo sitio, pulsa "Importar" y selecciona el archivo .json.
Al hacer esto, esos datos se guardarán en la memoria del nuevo navegador y ya los verás y podrás editar desde ahí en el index.html. ¡Es como mover el archivo del proyecto de un ordenador a otro!
