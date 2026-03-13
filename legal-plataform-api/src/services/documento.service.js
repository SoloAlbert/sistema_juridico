const path = require('path');
const fs = require('fs-extra');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const htmlPdf = require('html-pdf-node');

const STORAGE_ROOT = path.join(__dirname, '../../storage');
const PLANTILLAS_DIR = path.join(STORAGE_ROOT, 'plantillas_base');
const DOCUMENTOS_DIR = path.join(STORAGE_ROOT, 'documentos_generados');

async function ensureStorageDirs() {
  await fs.ensureDir(PLANTILLAS_DIR);
  await fs.ensureDir(DOCUMENTOS_DIR);
}

function sanitizarNombreArchivo(nombre) {
  return String(nombre || 'documento')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase();
}

function formatearValor(valor) {
  if (valor instanceof Date) {
    const yyyy = valor.getFullYear();
    const mm = String(valor.getMonth() + 1).padStart(2, '0');
    const dd = String(valor.getDate()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }

  if (typeof valor === 'boolean') {
    return valor ? 'Sí' : 'No';
  }

  if (valor === null || valor === undefined) {
    return '';
  }

  return String(valor);
}

function prepararDatos(datos = {}) {
  const salida = {};
  for (const [clave, valor] of Object.entries(datos)) {
    salida[clave] = formatearValor(valor);
  }
  return salida;
}

async function generarDocxDesdePlantilla({
  rutaArchivoBase,
  tituloDocumento,
  datos
}) {
  await ensureStorageDirs();

  const archivoBasePath = path.isAbsolute(rutaArchivoBase)
    ? rutaArchivoBase
    : path.join(STORAGE_ROOT, rutaArchivoBase.replace(/^\/+/, ''));

  const existe = await fs.pathExists(archivoBasePath);
  if (!existe) {
    throw new Error(`No existe la plantilla base DOCX: ${archivoBasePath}`);
  }

  const content = await fs.readFile(archivoBasePath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true
  });

  doc.render(prepararDatos(datos));

  const buffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });

  const nombre = `${Date.now()}_${sanitizarNombreArchivo(tituloDocumento)}.docx`;
  const salidaPath = path.join(DOCUMENTOS_DIR, nombre);

  await fs.writeFile(salidaPath, buffer);

  return {
    nombreArchivo: nombre,
    rutaRelativa: `/documentos_generados/${nombre}`,
    rutaAbsoluta: salidaPath
  };
}

function construirHtmlDocumento({ tituloDocumento, datos }) {
  const filas = Object.entries(prepararDatos(datos))
    .map(([clave, valor]) => {
      return `
        <tr>
          <td style="border:1px solid #ccc;padding:8px;font-weight:bold;">${clave}</td>
          <td style="border:1px solid #ccc;padding:8px;">${valor}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${tituloDocumento}</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 30px;">
        <h1 style="margin-bottom: 20px;">${tituloDocumento}</h1>
        <p>Documento generado automáticamente por la plataforma.</p>
        <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
          <thead>
            <tr>
              <th style="border:1px solid #ccc;padding:8px;text-align:left;">Campo</th>
              <th style="border:1px solid #ccc;padding:8px;text-align:left;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${filas}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

async function generarPdfDesdeDatos({
  tituloDocumento,
  datos
 }) {
  await ensureStorageDirs();

  const html = construirHtmlDocumento({ tituloDocumento, datos });

  const file = { content: html };
  const options = {
    format: 'A4',
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  };
  

  const buffer = await htmlPdf.generatePdf(file, options);

  const nombre = `${Date.now()}_${sanitizarNombreArchivo(tituloDocumento)}.pdf`;
  const salidaPath = path.join(DOCUMENTOS_DIR, nombre);

  await fs.writeFile(salidaPath, buffer);

  return {
    nombreArchivo: nombre,
    rutaRelativa: `/documentos_generados/${nombre}`,
    rutaAbsoluta: salidaPath
  };
}

async function generarPdfDesdeHtml({
  tituloDocumento,
  html
}) {
  await ensureStorageDirs();

  const file = { content: html };
  const options = {
    format: 'A4',
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  };

  const buffer = await htmlPdf.generatePdf(file, options);

  const nombre = `${Date.now()}_${sanitizarNombreArchivo(tituloDocumento)}.pdf`;
  const salidaPath = path.join(DOCUMENTOS_DIR, nombre);

  await fs.writeFile(salidaPath, buffer);

  return {
    nombreArchivo: nombre,
    rutaRelativa: `/documentos_generados/${nombre}`,
    rutaAbsoluta: salidaPath
  };
}

module.exports = {
  ensureStorageDirs,
  generarDocxDesdePlantilla,
  generarPdfDesdeDatos,
  generarPdfDesdeHtml
};
