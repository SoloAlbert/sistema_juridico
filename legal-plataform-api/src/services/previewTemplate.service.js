function formatearValorPreview(valor) {
  if (valor instanceof Date) {
    const yyyy = valor.getFullYear();
    const mm = String(valor.getMonth() + 1).padStart(2, '0');
    const dd = String(valor.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }

  if (typeof valor === 'boolean') {
    return valor ? 'Sí' : 'No';
  }

  if (valor === null || valor === undefined || valor === '') {
    return '—';
  }

  return String(valor);
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function reemplazarPlaceholders(htmlBase, datos = {}) {
  let html = String(htmlBase || '');

  Object.entries(datos).forEach(([clave, valor]) => {
    const regex = new RegExp(`{{\\s*${clave}\\s*}}`, 'g');
    html = html.replace(regex, escaparHtml(formatearValorPreview(valor)));
  });

  html = html.replace(/{{\s*[\w.-]+\s*}}/g, '—');

  return html;
}

function envolverHtmlPreview(htmlInterno, titulo = 'Vista previa') {
  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escaparHtml(titulo)}</title>
      </head>
      <body style="font-family: Arial, Helvetica, sans-serif; background:#f3f4f6; margin:0; padding:24px;">
        <div style="max-width:900px; margin:0 auto; background:#fff; padding:40px; box-shadow:0 4px 14px rgba(0,0,0,.08); border-radius:10px;">
          ${htmlInterno}
        </div>
      </body>
    </html>
  `;
}

module.exports = {
  reemplazarPlaceholders,
  envolverHtmlPreview
};