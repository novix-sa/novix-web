"""Servidor local para la vista previa del sitio en Claude. No se usa en el sitio publicado.

Sirve la raíz del repositorio en 127.0.0.1, en el puerto de la variable PORT (8080 por
defecto), sin caché para que cada cambio se vea al recargar.
"""
import functools
import http.server
import os
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PORT = int(os.environ.get("PORT", "8080"))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


handler = functools.partial(NoCacheHandler, directory=str(ROOT))
with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler) as httpd:
    print(f"Vista previa en http://localhost:{PORT}", flush=True)
    httpd.serve_forever()
