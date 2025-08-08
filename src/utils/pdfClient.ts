// Utility functions for client-side memo PDF generation and print preview
// Uses jsPDF to export structured text-based PDFs and a simple print preview via new window

import jsPDF from 'jspdf';

export interface MemoSection {
  title: string;
  content: string;
}

function defaultFileName(companyName?: string) {
  const date = new Date().toISOString().split('T')[0];
  return `IC_Memo_${companyName || 'Deal'}_${date}.pdf`;
}

export async function exportMemoToPDF(params: {
  companyName?: string;
  sections: MemoSection[];
  fileName?: string;
}): Promise<void> {
  const { companyName, sections, fileName } = params;
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm
  let cursorY = margin;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Investment Committee Memo', margin, cursorY);
  cursorY += 8;

  if (companyName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Company: ${companyName}`, margin, cursorY);
    cursorY += 6;
  }

  // Horizontal rule
  doc.setDrawColor(200);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  // Sections
  sections.forEach((section, index) => {
    const ensureSpace = (needed: number) => {
      if (cursorY + needed > pageHeight - margin) {
        doc.addPage();
        cursorY = margin;
      }
    };

    // Section heading
    ensureSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(section.title, margin, cursorY);
    cursorY += 6;

    // Section content
    if (section.content && section.content.trim().length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      const paragraphs = section.content.split(/\n\n+/);
      paragraphs.forEach((para, pIdx) => {
        const lines = doc.splitTextToSize(para, contentWidth);
        lines.forEach((line) => {
          ensureSpace(6);
          doc.text(line, margin, cursorY);
          cursorY += 6;
        });
        if (pIdx < paragraphs.length - 1) {
          cursorY += 3; // spacing between paragraphs
        }
      });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      ensureSpace(6);
      doc.text('No content provided.', margin, cursorY);
      cursorY += 6;
    }

    // Spacing between sections
    if (index < sections.length - 1) {
      cursorY += 6;
    }
  });

  doc.save(fileName || defaultFileName(companyName));
}

export function openMemoPrintPreview(params: {
  companyName?: string;
  sections: MemoSection[];
  autoPrint?: boolean;
}): void {
  const { companyName, sections, autoPrint = true } = params;
  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups to preview the PDF.');
    return;
  }

  const styles = `
    <style>
      * { box-sizing: border-box; }
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111827; }
      .container { max-width: 800px; margin: 24px auto; padding: 24px; }
      .header { border-bottom: 1px solid #e5e7eb; margin-bottom: 16px; padding-bottom: 8px; }
      h1 { font-size: 20px; margin: 0; }
      .meta { color: #6b7280; font-size: 12px; margin-top: 4px; }
      h2 { font-size: 16px; margin: 16px 0 8px; border-left: 3px solid #3b82f6; padding-left: 8px; }
      p { white-space: pre-wrap; line-height: 1.5; font-size: 13px; margin: 0 0 8px 0; }
      .section { page-break-inside: avoid; }
      @media print {
        body { background: white; }
        .container { box-shadow: none; padding: 12mm; }
        .page-break { page-break-before: always; }
      }
    </style>
  `;

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>IC Memo ${companyName ? ' - ' + companyName : ''}</title>
        ${styles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Investment Committee Memo${companyName ? ' - ' + companyName : ''}</h1>
            <div class="meta">Generated on ${new Date().toLocaleString()}</div>
          </div>
          ${sections
            .map(
              (s) => `
                <div class="section">
                  <h2>${escapeHtml(s.title)}</h2>
                  ${s.content
                    .split(/\n\n+/)
                    .map((para) => `<p>${escapeHtml(para)}</p>`) 
                    .join('')}
                </div>`
            )
            .join('')}
        </div>
        <script>
          ${autoPrint ? 'window.onload = () => setTimeout(() => window.print(), 300);' : ''}
        <\/script>
      </body>
    </html>
  `;

  win.document.open();
  win.document.write(html);
  win.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
