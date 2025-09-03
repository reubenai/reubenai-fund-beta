import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx';

interface MemoSection {
  title: string;
  content: string;
}

interface ExportMemoToWordParams {
  companyName: string;
  sections: MemoSection[];
  fileName: string;
}

export async function exportMemoToWord({
  companyName,
  sections,
  fileName
}: ExportMemoToWordParams): Promise<void> {
  try {
    // Create document with professional formatting
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: "Investment Committee Memo",
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          
          // Company Name
          new Paragraph({
            children: [
              new TextRun({
                text: companyName,
                bold: true,
                size: 24,
                color: "2563EB", // Primary blue
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Divider
          new Paragraph({
            children: [
              new TextRun({
                text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
                color: "6B7280",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Generate sections
          ...sections
            .filter(section => section.content?.trim())
            .flatMap(section => [
              // Section heading
              new Paragraph({
                children: [
                  new TextRun({
                    text: section.title,
                    bold: true,
                    size: 22,
                    color: "1F2937",
                  }),
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 },
              }),
              
              // Section content
              ...section.content.split('\n')
                .filter(paragraph => paragraph.trim())
                .map(paragraph => 
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: paragraph.trim(),
                        size: 20,
                        color: "374151",
                      }),
                    ],
                    spacing: { after: 200 },
                  })
                ),
              
              // Section divider
              new Paragraph({
                children: [
                  new TextRun({
                    text: "",
                  }),
                ],
                spacing: { after: 300 },
              }),
            ]),
        ],
      }],
    });

    // Generate and download the document
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Word export failed:', error);
    throw new Error('Failed to export memo to Word document');
  }
}