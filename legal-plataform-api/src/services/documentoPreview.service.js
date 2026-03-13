const {
  reemplazarPlaceholders,
  envolverHtmlPreview
} = require('./previewTemplate.service');

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

function construirHtmlInternoGenerico({ plantilla, datos = {} }) {
  const filas = Object.entries(datos)
    .map(([clave, valor]) => {
      return `
        <tr>
          <td style="border:1px solid #d1d5db;padding:10px;font-weight:600;background:#f9fafb;">
            ${escaparHtml(clave)}
          </td>
          <td style="border:1px solid #d1d5db;padding:10px;">
            ${escaparHtml(formatearValorPreview(valor))}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="margin-bottom:24px;">
      <h1 style="margin:0 0 8px 0; font-size:28px;">${escaparHtml(plantilla.titulo || 'Plantilla legal')}</h1>
      <p style="margin:0; color:#6b7280;">Documento generado por la plataforma.</p>
    </div>

    ${
      plantilla.descripcion_larga
        ? `<div style="margin-bottom:24px; color:#374151; line-height:1.6;">${escaparHtml(plantilla.descripcion_larga)}</div>`
        : ''
    }

    <h2 style="font-size:20px; margin-bottom:12px;">Datos capturados</h2>

    <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
      <thead>
        <tr>
          <th style="border:1px solid #d1d5db; padding:10px; text-align:left; background:#111827; color:#fff;">Campo</th>
          <th style="border:1px solid #d1d5db; padding:10px; text-align:left; background:#111827; color:#fff;">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${filas || `
          <tr>
            <td colspan="2" style="border:1px solid #d1d5db;padding:12px;">No hay datos capturados.</td>
          </tr>
        `}
      </tbody>
    </table>

    <div style="margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; color:#6b7280; font-size:12px;">
      Documento generado por la plataforma legal.
    </div>
  `;
}

function construirHtmlDesdeBloques({ estructuraBloques = [], datos = {} }) {
  if (!Array.isArray(estructuraBloques) || estructuraBloques.length === 0) {
    return '';
  }

  return estructuraBloques
    .map((item) => {
      const html = item?.html_base || '';
      return reemplazarPlaceholders(html, datos);
    })
    .join('\n');
}

function construirHtmlPreviewGenerico({ plantilla, datos = {} }) {
  const htmlInterno = construirHtmlInternoGenerico({ plantilla, datos });
  return envolverHtmlPreview(htmlInterno, plantilla.titulo || 'Vista previa');
}

function construirHtmlPreviewEspecifico({ plantilla, htmlPreviewBase, datos = {} }) {
  const htmlInterno = reemplazarPlaceholders(htmlPreviewBase, datos);
  return envolverHtmlPreview(htmlInterno, plantilla.titulo || 'Vista previa');
}

function construirHtmlPreviewPorBloques({ plantilla, estructuraBloques = [], datos = {} }) {
  const htmlInterno = construirHtmlDesdeBloques({
    estructuraBloques,
    datos
  });

  return envolverHtmlPreview(
    htmlInterno || `<p>No hay bloques configurados.</p>`,
    plantilla.titulo || 'Vista previa'
  );
}

module.exports = {
  construirHtmlInternoGenerico,
  construirHtmlDesdeBloques,
  construirHtmlPreviewGenerico,
  construirHtmlPreviewEspecifico,
  construirHtmlPreviewPorBloques
};