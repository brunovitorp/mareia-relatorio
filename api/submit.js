import nodemailer from 'nodemailer';
import JSZip from 'jszip';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- XML helpers ---

const RUN_FMT = `<w:rPr><w:rFonts w:ascii="Segoe UI" w:eastAsia="Times New Roman" w:hAnsi="Segoe UI" w:cs="Segoe UI"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr>`;
const RUN_FMT_BOLD = `<w:rPr><w:rFonts w:ascii="Segoe UI" w:eastAsia="Times New Roman" w:hAnsi="Segoe UI" w:cs="Segoe UI"/><w:b/><w:bCs/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr>`;
const PARA_PR = `<w:pPr><w:spacing w:before="100" w:beforeAutospacing="1" w:after="100" w:afterAutospacing="1" w:line="300" w:lineRule="atLeast"/><w:rPr><w:rFonts w:ascii="Segoe UI" w:eastAsia="Times New Roman" w:hAnsi="Segoe UI" w:cs="Segoe UI"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:pPr>`;
const PARA_PR_L0 = (numId) => `<w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr><w:spacing w:before="100" w:beforeAutospacing="1" w:after="100" w:afterAutospacing="1" w:line="300" w:lineRule="atLeast"/><w:rPr><w:rFonts w:ascii="Segoe UI" w:eastAsia="Times New Roman" w:hAnsi="Segoe UI" w:cs="Segoe UI"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:pPr>`;
const PARA_PR_L1 = (numId) => `<w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="${numId}"/></w:numPr><w:spacing w:before="100" w:beforeAutospacing="1" w:after="100" w:afterAutospacing="1" w:line="300" w:lineRule="atLeast"/><w:rPr><w:rFonts w:ascii="Segoe UI" w:eastAsia="Times New Roman" w:hAnsi="Segoe UI" w:cs="Segoe UI"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:pPr>`;

function escape(text) {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function para(content) {
  return `<w:p>${PARA_PR}${content}</w:p>`;
}

function boldRun(text) {
  return `<w:r>${RUN_FMT_BOLD}<w:t xml:space="preserve">${escape(text)}</w:t></w:r>`;
}

function normalRun(text) {
  return `<w:r>${RUN_FMT}<w:t xml:space="preserve">${escape(text)}</w:t></w:r>`;
}

function sectionHeader(num, title) {
  return para(boldRun(`${num}. ${title}:`));
}

function listItemL0Bold(numId, boldText, rest = '') {
  return `<w:p>${PARA_PR_L0(numId)}${boldRun(boldText)}${rest ? normalRun(rest) : ''}</w:p>`;
}

function listItemL1BoldValue(numId, label, value) {
  return `<w:p>${PARA_PR_L1(numId)}${boldRun(label)}${normalRun(' ' + value)}</w:p>`;
}

function listItemL1Plain(numId, text) {
  return `<w:p>${PARA_PR_L1(numId)}${normalRun(text)}</w:p>`;
}

function buildAtividadesBloco(data) {
  const parts = [];

  // 1. Objetivos
  parts.push(sectionHeader('1', 'Objetivos do Mês'));
  (data.objetivos || '').split('\n').filter(Boolean).forEach(line => {
    parts.push(`<w:p>${PARA_PR_L0(7)}${normalRun(line)}</w:p>`);
  });

  // 2. Atividades por semana
  parts.push(para(boldRun('2. Atividades Desenvolvidas:')));
  (data.semanas || []).forEach((s, i) => {
    parts.push(listItemL0Bold(8, `Semana ${i + 1}:`));
    if (s.atividade) parts.push(listItemL1BoldValue(8, 'Atividade:', s.atividade));
    if (s.descricao) parts.push(listItemL1BoldValue(8, 'Descrição:', s.descricao));
    if (s.resultados) parts.push(listItemL1BoldValue(8, 'Resultados:', s.resultados));
  });

  // 3. Desafios
  parts.push(para(boldRun('3. Desafios Enfrentados:')));
  (data.desafios || []).forEach(d => {
    if (d.titulo) parts.push(listItemL1BoldValue(9, 'Desafio:', d.titulo));
    if (d.descricao) parts.push(listItemL1BoldValue(9, 'Descrição:', d.descricao));
    if (d.solucao) parts.push(listItemL1BoldValue(9, 'Solução:', d.solucao));
  });

  // 4. Conclusão
  parts.push(para(boldRun('4. Conclusão:')));
  (data.conclusao || '').split('\n').filter(Boolean).forEach(line => {
    parts.push(para(normalRun(line)));
  });

  // 5. Próximos Passos
  parts.push(para(boldRun('5. Próximos Passos:')));
  (data.proximosPassos || []).forEach(p => {
    if (p) parts.push(`<w:p>${PARA_PR_L0(7)}${normalRun(p)}</w:p>`);
  });

  return parts.join('\n          ');
}

async function buildDocx(data) {
  const templateB64 = readFileSync(join(__dirname, 'template_b64.txt'), 'utf8').trim();
  const templateBuf = Buffer.from(templateB64, 'base64');

  const zip = await JSZip.loadAsync(templateBuf);
  let docXml = await zip.file('word/document.xml').async('string');

  docXml = docXml.replace('{{NOME}}', escape(data.nome || ''));
  docXml = docXml.replace('{{CPF}}', escape(data.cpf || ''));
  docXml = docXml.replace('{{PROJETO}}', escape(data.projeto || ''));
  docXml = docXml.replace('{{MESANO}}', escape(data.mesano || ''));
  docXml = docXml.replace('{{VALOR}}', escape(data.valor || '____________'));
  docXml = docXml.replace('{{PROJETO_DECL}}', escape(data.projetoDecl || 'XXXXXXXX'));
  docXml = docXml.replace('{{LOCAL}}', escape(data.local || '_____________'));
  docXml = docXml.replace('{{DATA}}', escape(data.dataAssin || '___ de ____________ de 202__'));
  docXml = docXml.replace(/<w:p[^>]*>(?:[^<]|<(?!\/w:p>))*\{\{ATIVIDADES_BLOCO\}\}(?:[^<]|<(?!\/w:p>))*<\/w:p>/s, buildAtividadesBloco(data));

  zip.file('word/document.xml', docXml);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    // Build docx
    const docxBuffer = await buildDocx(data);

    // Filename
    const safeName = (data.nome || 'bolsista').replace(/\s+/g, '_');
    const safeMes = (data.mesano || '').replace('-', '_');
    const filename = `relatorio_${safeName}_${safeMes}.docx`;

    // Send email via Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Plataforma mareIA" <${process.env.GMAIL_USER}>`,
      to: 'bruno.pires@nutes.ufpe.br',
      subject: `Relatório Mensal — ${data.nome || 'Bolsista'} — ${data.mesano || ''}`,
      text: `Relatório mensal de ${data.nome || 'bolsista'} referente a ${data.mesano || ''} enviado via formulário da Plataforma mareIA.`,
      attachments: [
        {
          filename,
          content: docxBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      ],
    });

    res.status(200).json({ ok: true, filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
