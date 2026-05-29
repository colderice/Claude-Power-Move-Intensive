const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const PDF_DIR = path.join(__dirname, '..', 'pdfs');

function wrapText(text, font, size, maxWidth) {
  const paragraphs = text.split('\n');
  const lines = [];
  for (const para of paragraphs) {
    if (para.trim() === '') { lines.push(''); continue; }
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

async function decodeSignatureImage(pdfDoc, dataUrl) {
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const bytes = Buffer.from(base64, 'base64');
  // signature_pad produces PNG
  return pdfDoc.embedPng(bytes);
}

function c(hex) {
  const n = parseInt(hex.slice(1), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

async function generatePDF({ inst, snapshot, fieldValues, adminSignature, adminUser }) {
  if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const W = 612, H = 792;
  const marginX = 60, topMargin = 72, bottomMargin = 80;
  const contentWidth = W - marginX * 2;

  let page = pdfDoc.addPage([W, H]);
  let y = H - topMargin;

  function checkNewPage(neededHeight = 20) {
    if (y - neededHeight < bottomMargin) {
      drawFooter(page);
      page = pdfDoc.addPage([W, H]);
      y = H - topMargin;
    }
  }

  function drawText(text, { x = marginX, font = fontReg, size = 10, color = '#374151', lineHeight } = {}) {
    const lh = lineHeight || size * 1.4;
    page.drawText(text, { x, y, font, size, color: c(color) });
    y -= lh;
  }

  function drawLines(lines, opts = {}) {
    for (const line of lines) {
      checkNewPage(opts.size ? opts.size * 1.6 : 16);
      if (line === '') { y -= 6; continue; }
      drawText(line, opts);
    }
  }

  function drawHRule(color = '#e2e8f0', thickness = 0.5) {
    page.drawLine({ start: { x: marginX, y }, end: { x: W - marginX, y }, thickness, color: c(color) });
    y -= 12;
  }

  function drawFooter(pg) {
    pg.drawText(`Document ID: ${inst.id}  |  ${org()} Confidential`, {
      x: marginX, y: 36, font: fontReg, size: 7.5, color: c('#94a3b8'),
    });
    pg.drawLine({ start: { x: marginX, y: 46 }, end: { x: W - marginX, y: 46 }, thickness: 0.5, color: c('#e2e8f0') });
  }

  // Header bar
  page.drawRectangle({ x: 0, y: H - 56, width: W, height: 56, color: c('#1e293b') });
  page.drawText(org(), { x: marginX, y: H - 38, font: fontBold, size: 14, color: c('#ffffff') });
  page.drawText('AGREEMENT', { x: W - marginX - 72, y: H - 38, font: fontReg, size: 10, color: c('#94a3b8') });
  y = H - 56 - 28;

  // Title
  drawText(snapshot.title.toUpperCase(), { font: fontBold, size: 16, color: '#1e293b' });
  y -= 4;

  if (snapshot.description) {
    const descLines = wrapText(snapshot.description, fontReg, 10, contentWidth);
    drawLines(descLines, { color: '#64748b', size: 10 });
    y -= 4;
  }

  drawHRule('#3b82f6', 1);
  y -= 4;

  // Agreement body with field substitution
  let content = snapshot.content;
  for (const [k, v] of Object.entries(fieldValues)) {
    content = content.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || `[${k}]`);
  }
  // Replace any remaining placeholders
  content = content.replace(/\{\{[^}]+\}\}/g, (m) => `[${m.slice(2, -2)}]`);

  const bodyLines = wrapText(content, fontReg, 10, contentWidth);
  drawLines(bodyLines, { size: 10, color: '#374151' });
  y -= 16;

  // Filled fields section
  if (Object.keys(fieldValues).length > 0) {
    checkNewPage(40);
    drawHRule();
    drawText('SUBMITTED INFORMATION', { font: fontBold, size: 10, color: '#1e293b' });
    y -= 6;

    const fields = snapshot.fields || [];
    for (const field of fields) {
      const value = fieldValues[field.name] || '—';
      checkNewPage(18);
      const label = `${field.label}:`;
      page.drawText(label, { x: marginX, y, font: fontBold, size: 9, color: c('#64748b') });
      const labelWidth = fontBold.widthOfTextAtSize(label, 9);
      const valLines = wrapText(String(value), fontReg, 9, contentWidth - labelWidth - 8);
      page.drawText(valLines[0] || '—', { x: marginX + labelWidth + 8, y, font: fontReg, size: 9, color: c('#1e293b') });
      y -= 14;
      for (let i = 1; i < valLines.length; i++) {
        checkNewPage(14);
        page.drawText(valLines[i], { x: marginX + labelWidth + 8, y, font: fontReg, size: 9, color: c('#1e293b') });
        y -= 14;
      }
    }
  }

  // Signatures section — ensure enough room, new page if not
  checkNewPage(220);
  y -= 10;
  drawHRule('#3b82f6', 1);
  drawText('SIGNATURES', { font: fontBold, size: 11, color: '#1e293b' });
  y -= 8;

  const sigBoxW = (contentWidth - 20) / 2;
  const sigBoxH = 90;
  const sigY = y;

  async function drawSignatureBox(xOffset, name, email, sigDataUrl, signedAt, sigIp, label) {
    const boxX = marginX + xOffset;

    // Box
    page.drawRectangle({ x: boxX, y: sigY - sigBoxH, width: sigBoxW, height: sigBoxH, borderColor: c('#e2e8f0'), borderWidth: 1, color: c('#f8fafc') });

    // Signature image
    try {
      const img = await decodeSignatureImage(pdfDoc, sigDataUrl);
      const imgDims = img.scale(1);
      const maxSigW = sigBoxW - 16;
      const maxSigH = sigBoxH - 30;
      const scale = Math.min(maxSigW / imgDims.width, maxSigH / imgDims.height, 1);
      const sw = imgDims.width * scale;
      const sh = imgDims.height * scale;
      page.drawImage(img, { x: boxX + (sigBoxW - sw) / 2, y: sigY - sigBoxH + 24, width: sw, height: sh });
    } catch {}

    // Line under sig
    page.drawLine({ start: { x: boxX + 8, y: sigY - sigBoxH + 20 }, end: { x: boxX + sigBoxW - 8, y: sigY - sigBoxH + 20 }, thickness: 0.5, color: c('#94a3b8') });

    // Name / label
    page.drawText(`${label}: ${name}`, { x: boxX + 8, y: sigY - sigBoxH + 8, font: fontBold, size: 7.5, color: c('#374151') });

    // Below box: details
    let detailY = sigY - sigBoxH - 14;
    page.drawText(`${email}`, { x: boxX, y: detailY, font: fontReg, size: 7.5, color: c('#64748b') });
    detailY -= 11;
    page.drawText(`Signed: ${new Date(signedAt).toLocaleString()}`, { x: boxX, y: detailY, font: fontReg, size: 7.5, color: c('#64748b') });
    detailY -= 11;
    if (sigIp) {
      page.drawText(`IP: ${sigIp}`, { x: boxX, y: detailY, font: fontReg, size: 7.5, color: c('#64748b') });
    }
  }

  await drawSignatureBox(0, inst.client_name, inst.client_email, inst.client_signature, inst.client_signed_at, inst.client_ip, 'Client');
  await drawSignatureBox(sigBoxW + 20, adminUser.name, adminUser.email, adminSignature, new Date().toISOString(), null, 'Authorized by');

  y = sigY - sigBoxH - 60;

  // Audit / legal footer
  checkNewPage(80);
  y -= 16;
  drawHRule();
  drawText('AUDIT TRAIL & LEGAL NOTICE', { font: fontBold, size: 9, color: '#1e293b' });
  y -= 4;
  const auditLines = [
    `Document ID: ${inst.id}`,
    `Agreement: ${snapshot.title}`,
    `Sent to: ${inst.client_name} <${inst.client_email}>`,
    `Client signed: ${new Date(inst.client_signed_at).toUTCString()}  |  IP: ${inst.client_ip || 'N/A'}`,
    `Admin signed: ${new Date().toUTCString()}`,
    '',
    'This document was electronically signed via a secure, unique signing link. Each party received the signing',
    'link via email. Electronic signatures are legally binding under the Electronic Signatures in Global and',
    'National Commerce Act (ESIGN) and the Uniform Electronic Transactions Act (UETA).',
  ];
  drawLines(auditLines, { size: 7.5, color: '#64748b' });

  drawFooter(page);

  const bytes = await pdfDoc.save();
  const outPath = path.join(PDF_DIR, `${inst.id}.pdf`);
  fs.writeFileSync(outPath, bytes);
  return outPath;
}

function org() { return process.env.ORG_NAME || '3rd Power Outlet'; }

module.exports = { generatePDF };
