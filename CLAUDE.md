# Sitio web de Novix

Este repositorio es el sitio web de Novix: HTML, CSS y JavaScript estáticos, sin build ni dependencias. Se publica solo, con GitHub Pages, cada vez que llega un cambio a la rama `main` de `origin` (https://github.com/novix-sa/novix-web).

- Sitio publicado: https://novix-sa.github.io/novix-web/ (cuando se active el dominio propio será https://newsite.novix.com). La URL vigente siempre la da `gh api repos/novix-sa/novix-web/pages --jq .html_url`.

## Con quién trabajás

Quienes usan este proyecto no son técnicos: no conocen git ni GitHub y no tienen por qué aprenderlos.

- Vos te encargás de todo lo de git y GitHub. Nunca les pidas que abran una terminal ni que corran comandos.
- Hablales en lenguaje simple. No uses palabras como commit, push, pull, rebase, rama, merge o PR: decí "traer lo último del equipo", "guardar", "publicar".
- No narres los pasos técnicos; contá el resultado en una frase ("Listo, ya está publicado").
- Si algo falla, intentá resolverlo vos. Si no podés, explicá en una frase qué pasa y qué necesitás de la persona.

## 1. Al empezar: traer lo último del equipo

Varias personas editan el sitio a la vez. Antes de tocar cualquier archivo, y otra vez antes de cada pedido nuevo si pasó un rato, corré:

```
git pull --rebase --autostash origin main
```

- Si es la primera vez en esta computadora (`gh auth status` falla o `git config user.email` está vacío), hacé antes la sección "Primera vez en esta computadora".
- Si quedaron cambios sin publicar de una sesión anterior (`git status` muestra archivos modificados o cambios adelante de `origin/main`), avisale en una frase y preguntale si los publica ahora o sigue trabajando sobre ellos. Nunca los descartes por tu cuenta.
- Si no hay internet, avisá y seguí trabajando; traé lo último antes de publicar.

## 2. Editar y mostrar los cambios

- Hacé los cambios que pida la persona directamente en los archivos.
- Mostrá el resultado en la vista previa (el navegador de Claude) con el servidor `sitio` de `.claude/launch.json`, abriendo la página que cambiaste. Si la vista previa no arranca (por ejemplo, porque no hay `python3`), abrí el archivo HTML directamente en el navegador de Claude.
- Iterá con la persona hasta que esté conforme con lo que ve.

Reglas del sitio:

- Rutas siempre relativas (`assets/img/logo.svg`, `../index.html`), nunca empezando con `/`: el sitio tiene que funcionar tanto en `novix-sa.github.io/novix-web/` como en el dominio propio.
- Nombres de archivos y carpetas en minúsculas, sin espacios ni acentos (`quienes-somos.html`).
- Páginas `.html` en la raíz; estilos en `assets/css/`, scripts en `assets/js/`, imágenes en `assets/img/`.
- Imágenes optimizadas para web (idealmente menos de 500 KB cada una). Ningún archivo de más de 50 MB (GitHub rechaza los de más de 100 MB).
- El repositorio es público: todo lo que se publica, historial incluido, lo puede ver cualquiera. Nunca guardes contraseñas, claves, datos de clientes ni borradores confidenciales.
- No modifiques `CLAUDE.md`, `.claude/`, `CNAME` ni `.nojekyll` salvo que la persona lo pida explícitamente.

## 3. Publicar

Cuando la persona esté conforme con lo que ve, preguntale: "¿Lo publico en el sitio?". Publicá solo si dice que sí:

1. `git add -A` y `git commit -m "<qué cambió, en español, en una línea>"`.
2. `git pull --rebase origin main` para sumar lo que otros publicaron mientras tanto.
3. Si hay conflictos, resolvelos combinando ambos cambios: nunca pierdas trabajo de otra persona ni de quien te lo pide. Si no está claro cómo combinarlos, describí las dos versiones en lenguaje simple y preguntá cuál va. Después `git add` de lo resuelto y `git rebase --continue`.
4. `git push origin main`. Si lo rechaza porque alguien publicó justo antes, repetí desde el paso 2.
5. Confirmá con la URL: "Listo, publicado. En uno o dos minutos se ve en <URL>." Para verificar que salió, `gh api repos/novix-sa/novix-web/pages/builds/latest --jq .status` devuelve `built`.

Si dice que no, dejá los cambios guardados en la computadora sin publicar y decile que te pida publicarlos cuando quiera.

Siempre:

- Todo va directo a `main`: no crees ramas ni pull requests.
- Nunca uses `git push --force`, `git reset --hard`, `git clean`, `git checkout -- .` ni nada que reescriba el historial publicado o borre cambios.
- Para deshacer algo ya publicado, usá `git revert` (crea un cambio nuevo que lo revierte) y publicalo con el mismo procedimiento.

## Primera vez en esta computadora

Se hace una sola vez por computadora. A la persona explicale solo lo que tiene que hacer ella.

1. **git**: `git --version`. En Mac, si no está, corré `xcode-select --install`: se abre una ventana; pedile que toque "Instalar", espere a que termine y te avise. En Windows: `winget install --id Git.Git -e`.
2. **GitHub CLI**: `gh --version`. Si no está: en Mac con Homebrew, `brew install gh`; sin Homebrew, descargá el zip de la última versión desde https://github.com/cli/cli/releases (`macOS_arm64` o `macOS_amd64` según `uname -m`) y dejá el binario en `~/.local/bin/gh` (usá esa ruta completa si no está en el PATH). En Windows: `winget install --id GitHub.cli -e`.
3. **Sesión de GitHub**: si `gh auth status` dice que no hay sesión, corré en segundo plano `gh auth login --hostname github.com --git-protocol https --web` y leé el código de un solo uso que imprime. Decile: "Se abrió GitHub en tu navegador: ingresá el código XXXX-XXXX y tocá Authorize" (si no se abrió, que entre a https://github.com/login/device). Si no tiene cuenta de GitHub, que la cree en https://github.com/signup con su mail de Novix y le pase su usuario a Fabian para que le dé acceso. Cuando termine, corré `gh auth setup-git`.
4. **Identidad** (solo en este repo): con `gh api user --jq '.id, .login, .name'`, configurá `git config user.name "<name, o login si name está vacío>"` y `git config user.email "<id>+<login>@users.noreply.github.com"`.
5. **Permisos**: `gh api repos/novix-sa/novix-web --jq .permissions.push` tiene que dar `true`. Si da `false`, la persona todavía no aceptó la invitación: que la acepte en https://github.com/novix-sa/novix-web/invitations o desde el mail de GitHub. Si no tiene invitación, que le pida acceso a Fabian.
