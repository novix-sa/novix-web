"""Genera una página por artículo del blog en blog/<slug>/index.html, para tener direcciones lindas
(newsite.novix.com/blog/<slug>/ en lugar de articulo.html?post=<slug>).

Cada página es una copia de articulo.html con <base href="../../"> (así las rutas relativas siguen
apuntando a la raíz del sitio) y con el título y la descripción del artículo ya puestos.

Hay que volver a correrlo cada vez que cambia articulo.html o los artículos del blog:
    python3 herramientas/generar-paginas-blog.py
"""
import html
import json
import os
import shutil

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AVISO = '<!-- Página generada a partir de articulo.html con herramientas/generar-paginas-blog.py. No editar a mano. -->\n'


def main():
    plantilla = open(os.path.join(RAIZ, 'articulo.html'), encoding='utf-8').read()
    i = plantilla.index('window.NOVIX_BLOG')
    a = plantilla.index('{', i)
    b = plantilla.rindex('}', a, plantilla.index('</script>', i)) + 1
    posts = json.loads(plantilla[a:b])['posts']

    carpeta = os.path.join(RAIZ, 'blog')
    os.makedirs(carpeta, exist_ok=True)
    slugs = set()
    for p in posts:
        slug = p['slug']
        slugs.add(slug)
        es = p['es']
        s = plantilla
        s = s.replace('<head>', '<head>\n' + AVISO + '<base href="../../">', 1)
        titulo = html.escape(es['titulo'] + ' — Novix', quote=False)
        s = s.replace(s[s.index('<title>'):s.index('</title>') + 8], '<title>' + titulo + '</title>', 1)
        if es.get('bajada'):
            j = s.find('<meta name="description"')
            if j >= 0:
                k = s.index('>', j) + 1
                s = s[:j] + '<meta name="description" content="' + html.escape(es['bajada'], quote=True) + '">' + s[k:]
        # con <base>, los enlaces "#..." apuntarían a la raíz: que apunten a esta misma página
        s = s.replace('href="#main"', 'href="blog/%s/#main"' % slug).replace('href="#"', 'href="blog/%s/#"' % slug)
        destino = os.path.join(carpeta, slug)
        os.makedirs(destino, exist_ok=True)
        with open(os.path.join(destino, 'index.html'), 'w', encoding='utf-8', newline='') as o:
            o.write(s)
    # borrar páginas de artículos que ya no existen
    for d in os.listdir(carpeta):
        ruta = os.path.join(carpeta, d)
        if os.path.isdir(ruta) and d not in slugs and os.path.exists(os.path.join(ruta, 'index.html')):
            shutil.rmtree(ruta)
            print('borrada', d)
    print('páginas generadas:', len(slugs))


if __name__ == '__main__':
    main()
