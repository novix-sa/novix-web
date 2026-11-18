"""Genera las redirecciones de las direcciones viejas del sitio (el WordPress anterior de novix.com),
el mapa del sitio (sitemap.xml) y robots.txt.

- Páginas principales con barra al final (novix.com/servicios/ → servicios.html).
- Artículos del blog viejo (/blog/..., /en/blog/..., /pt/blog/...) → su artículo nuevo, o el blog.
- Historias de clientes del blog viejo en inglés → Historias de clientes, filtrada por industria.
Todo lo que no esté en esta lista lo resuelve 404.html (página de "no encontrada" que intenta redirigir).

Correrlo de nuevo cada vez que se agrega una página o un artículo:
    python3 herramientas/generar-redirecciones.py
"""
import html
import json
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOMINIO = 'https://novix.com/'   # solo para sitemap.xml y robots.txt (Google pide direcciones completas)
MARCA = 'novix-redireccion'

PAGINAS = ['servicios', 'manufactura', 'retail', 'utilities', 'energia', 'transporte-infraestructura', 'educacion',
           'salud', 'servicios-financieros', 'telecomunicaciones', 'historias-de-clientes', 'contacto', 'blog']

# dirección vieja (sin barras de los extremos) → destino (relativo a la raíz del sitio)
VIEJAS = {
    # blog en español
    'blog/por-que-es-crucial-la-planificacion-de-la-demanda-en-la-industria-farmaceutica': 'blog/planificacion-demanda-industria-farmaceutica/',
    'blog/avances-tecnologicos-en-la-planificacion-de-la-demanda-para-2024': 'blog/avances-tecnologicos-planificacion-demanda-2024/',
    'blog/transforme-la-presupuestacion-en-planificacion-estrategica': 'blog/presupuestacion-planificacion-estrategica/',
    'blog/el-resurgimiento-de-la-planificacion-por-objetivos-cumplimiento-de-kpis-en-fpa': 'blog/planificacion-por-objetivos-kpis-fpa/',
    'blog/integracion-de-las-consideraciones-ambientales-sociales-y-de-gobernanza-esg-en-la-planificacion-de-la-demanda-y-la-gestion-de-la-cadena-de-abastecimiento': 'blog/esg-planificacion-demanda-cadena-abastecimiento/',
    'blog/demand-sensing-y-datos-en-tiempo-real-para-mejorar-la-planificacion-de-la-demanda': 'blog/demand-sensing-datos-tiempo-real/',
    'blog/segmentacion-y-personalizacion-en-la-planificacion-de-demanda-en-retail': 'blog/segmentacion-personalizacion-demanda-retail/',
    'blog/planificacion-estrategica-de-los-rr-hh-basada-en-datos': 'blog/planificacion-estrategica-rrhh-datos/',
    'blog/eficiencia-a-traves-de-la-planificacion-coordinada-de-la-oferta-y-la-demanda-en-sop': 'blog/planificacion-oferta-demanda-sop/',
    'blog/plataformas-integradas-de-planeamiento-en-el-proceso-de-consolidacion-financiera': 'blog/plataformas-integradas-consolidacion-financiera/',
    'blog/la-inteligencia-artificial-para-lograr-mas-eficiencia-en-los-procesos-de-fpampa': 'blog/ia-eficiencia-procesos-fpa/',
    'blog/digitalizacion-y-procesos-de-fpa-en-la-era-de-la-tecnologia-2': 'blog/analitica-avanzada-ia-demand-planning/',
    'blog/cinco-razones-para-pasar-del-sop-al-ibp': 'blog.html',
    # blog en inglés
    'en/blog/why-is-demand-planning-crucial-in-the-pharmaceutical-industry': 'blog/planificacion-demanda-industria-farmaceutica/?lang=en',
    'en/blog/leveraging-advanced-analytics-and-artificial-intelligence-in-demand-planning-2': 'blog/analitica-avanzada-ia-demand-planning/?lang=en',
    'en/blog/leveraging-advanced-analytics-and-artificial-intelligence-in-demand-planning': 'blog/analitica-avanzada-ia-demand-planning/?lang=en',
    'en/blog/enhancing-integrated-business-planning-through-connected-planning-in-sop': 'blog/mejora-de-ibp-a-traves-connected-planning/?lang=en',
    'en/blog/enhancing-efficiency-through-coordinated-supply-and-demand-planning-in-sop-2': 'blog/planificacion-oferta-demanda-sop/?lang=en',
    'en/blog/enhancing-efficiency-through-coordinated-supply-and-demand-planning-in-sop': 'blog/planificacion-oferta-demanda-sop/?lang=en',
    'en/blog/enhancing-demand-planning-through-demand-segmentation-and-personalization-in-the-retail-industry': 'blog/segmentacion-personalizacion-demanda-retail/?lang=en',
    'en/blog/harnessing-demand-sensing-and-real-time-data-for-enhanced-demand-planning': 'blog/demand-sensing-datos-tiempo-real/?lang=en',
    'en/blog/integrating-environmental-social-and-governance-esg-considerations-into-demand-planning-and-supply-chain-management': 'blog/esg-planificacion-demanda-cadena-abastecimiento/?lang=en',
    'en/blog/the-resurgence-of-planning-by-objectives-meeting-kpis-in-fpa': 'blog/planificacion-por-objetivos-kpis-fpa/?lang=en',
    'en/blog/transforming-budgeting-into-strategic-planning': 'blog/presupuestacion-planificacion-estrategica/?lang=en',
    'en/blog/technological-advancement-in-demand-planning-for-2024': 'blog/avances-tecnologicos-planificacion-demanda-2024/?lang=en',
    'en/blog/data-driven-strategic-workforce-planning': 'blog/planificacion-estrategica-rrhh-datos/?lang=en',
    'en/blog/streamlining-financial-consolidation-process-in-fpampa-through-integrated-planning-platforms': 'blog/plataformas-integradas-consolidacion-financiera/?lang=en',
    'en/blog/leveraging-ai-and-machine-learning-for-advanced-fpa-insights-and-efficiency': 'blog/ia-eficiencia-procesos-fpa/?lang=en',
    'en/blog/digitization-and-fpa-processes-in-the-age-of-technology': 'blog.html?lang=en',
    'en/blog/five-reasons-to-transition-from-sop-to-ibp': 'blog.html?lang=en',
    'en/blog/nestle-demand-planning-and-production-optimization': 'historias-de-clientes.html?lang=en#manufactura',
    'en/blog/pirelli-demand-planning-and-production-optimization': 'historias-de-clientes.html?lang=en',
    'en/blog/puma-compass-supply-chain': 'historias-de-clientes.html?lang=en',
    'en/blog/pyplan-partners-with-enel-on-margin-distribution-planning-system': 'historias-de-clientes.html?lang=en',
    # historias de clientes (estaban en el blog en inglés)
    'en/blog/coca-cola-andina-3': 'historias-de-clientes.html?lang=en#manufactura',
    'en/blog/arcor-3': 'historias-de-clientes.html?lang=en#manufactura',
    'en/blog/alpura-3': 'historias-de-clientes.html?lang=en#manufactura',
    'en/blog/nestle': 'historias-de-clientes.html?lang=en#manufactura',
    'en/blog/sephora-3': 'historias-de-clientes.html?lang=en#retail',
    'en/blog/naturgy-3': 'historias-de-clientes.html?lang=en#utilities',
    'en/blog/comgas-3': 'historias-de-clientes.html?lang=en#utilities',
    'en/blog/edp-3': 'historias-de-clientes.html?lang=en#energia',
    'en/blog/manzanillo-international-terminal-3': 'historias-de-clientes.html?lang=en#transporte-infraestructura',
    'en/blog/panama-canal': 'historias-de-clientes.html?lang=en#transporte-infraestructura',
    'en/blog/ilumno-3': 'historias-de-clientes.html?lang=en#educacion',
    'en/blog/hospital-del-trabajador-2': 'historias-de-clientes.html?lang=en#salud',
    'en/blog/eurofarma-3': 'historias-de-clientes.html?lang=en',
    # blog en portugués
    'pt/blog/a-digitalizacao-e-os-processos-de-fpa-em-meio-a-era-da-tecnologia': 'blog.html?lang=pt',
    'pt/blog/cinco-razoes-para-passar-do-sop-para-o-ibp': 'blog.html?lang=pt',
    # portadas de los idiomas
    'en': 'index.html?lang=en',
    'pt': 'index.html?lang=pt',
    'en/blog': 'blog.html?lang=en',
    'pt/blog': 'blog.html?lang=pt',
}


def stub(ruta, destino):
    """Escribe <ruta>/index.html que lleva a <destino> (relativo a la raíz)."""
    nivel = ruta.count('/') + 1
    rel = '../' * nivel + destino
    js = json.dumps(rel)
    contenido = (
        '<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="UTF-8">\n'
        '<!-- %s: generada con herramientas/generar-redirecciones.py. No editar a mano. -->\n'
        '<title>Novix</title>\n'
        '<link rel="canonical" href="%s">\n'
        '<meta http-equiv="refresh" content="0; url=%s">\n'
        '<script>(function(){var d=%s;if(location.search&&d.indexOf("?")<0){var h=d.indexOf("#");'
        'd=h<0?d+location.search:d.slice(0,h)+location.search+d.slice(h);}location.replace(d);})();</script>\n'
        '</head>\n<body>\n<p><a href="%s">Novix</a></p>\n</body>\n</html>\n'
    ) % (MARCA, html.escape(rel), html.escape(rel), js, html.escape(rel))
    carpeta = os.path.join(RAIZ, *ruta.split('/'))
    archivo = os.path.join(carpeta, 'index.html')
    if os.path.exists(archivo) and MARCA not in open(archivo, encoding='utf-8').read():
        raise SystemExit('No piso una página real: ' + archivo)
    os.makedirs(carpeta, exist_ok=True)
    with open(archivo, 'w', encoding='utf-8', newline='\n') as o:
        o.write(contenido)


def main():
    n = 0
    for p in PAGINAS:
        stub(p, p + '.html'); n += 1
    for vieja, nueva in VIEJAS.items():
        stub(vieja, nueva); n += 1
    print('redirecciones:', n)

    # sitemap.xml con las páginas reales
    urls = [DOMINIO] + [DOMINIO + p + '.html' for p in PAGINAS]
    blog = os.path.join(RAIZ, 'blog')
    for d in sorted(os.listdir(blog)):
        f = os.path.join(blog, d, 'index.html')
        if os.path.exists(f) and 'generar-paginas-blog.py' in open(f, encoding='utf-8').read(2000):
            urls.append(DOMINIO + 'blog/' + d + '/')
    xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    xml += ['  <url><loc>%s</loc></url>' % html.escape(u) for u in urls]
    xml.append('</urlset>')
    open(os.path.join(RAIZ, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n').write('\n'.join(xml) + '\n')
    open(os.path.join(RAIZ, 'robots.txt'), 'w', encoding='utf-8', newline='\n').write(
        'User-agent: *\nDisallow: /herramientas/\n\nSitemap: %ssitemap.xml\n' % DOMINIO)
    print('sitemap:', len(urls), 'direcciones')


if __name__ == '__main__':
    main()
