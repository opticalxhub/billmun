import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const resolutionId = searchParams.get('resolutionId');
  const format = searchParams.get('format');

  if (!resolutionId || !format) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  if (resolutionId === 'test') {
    return NextResponse.json({ success: true, message: 'Test success' }, { status: 200 });
  }

  try {
    // Fetch resolution
    const { data: res, error } = await supabase
      .from('resolutions')
      .select('*, committees(name)')
      .eq('id', resolutionId)
      .single();

    if (error || !res) throw new Error('Resolution not found');

    // Fetch clauses
    const { data: clauses } = await supabase
      .from('resolution_clauses')
      .select('*')
      .eq('resolution_id', resolutionId)
      .order('order_index', { ascending: true });

    const preambulatory = (clauses || []).filter(c => c.type === 'PREAMBULATORY' && !c.parent_clause_id);
    const operative = (clauses || []).filter(c => c.type === 'OPERATIVE' && !c.parent_clause_id);

    if (format === 'pdf') {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

      let y = 800;
      const x = 50;

      const drawText = (text: string, f: any, size: number) => {
        if (y < 50) {
            // Need new page logic ideally, simplified here
        }
        page.drawText(text, { x, y, size, font: f });
        y -= (size + 5);
      };

      drawText(`Committee: ${res.committees?.name || 'Unknown'}`, boldFont, 12);
      drawText(`Topic: ${res.topic}`, boldFont, 12);
      drawText(`Sponsors: ${(res.co_sponsors || []).join(', ')}`, font, 11);
      y -= 20;

      drawText('The Committee,', italicFont, 12);
      y -= 10;

      for (const clause of preambulatory) {
        drawText(`${clause.opening_phrase} ${clause.content},`, italicFont, 11);
        y -= 5;
      }

      y -= 10;
      let i = 1;
      for (const clause of operative) {
        drawText(`${i}. ${clause.opening_phrase} ${clause.content};`, font, 11);
        y -= 5;
        i++;
      }

      const pdfBytes = await pdfDoc.save();
      return new NextResponse(pdfBytes as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="resolution.pdf"`,
        },
      });
    }

    if (format === 'docx') {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `Committee: ${res.committees?.name || 'Unknown'}`, bold: true })],
              }),
              new Paragraph({
                children: [new TextRun({ text: `Topic: ${res.topic}`, bold: true })],
              }),
              new Paragraph({
                children: [new TextRun({ text: `Sponsors: ${(res.co_sponsors || []).join(', ')}` })],
              }),
              new Paragraph({ text: '' }),
              new Paragraph({
                children: [new TextRun({ text: 'The Committee,', italics: true })],
              }),
              new Paragraph({ text: '' }),
              ...preambulatory.map(
                c => new Paragraph({
                  children: [
                    new TextRun({ text: c.opening_phrase, italics: true }),
                    new TextRun({ text: ` ${c.content},` })
                  ]
                })
              ),
              new Paragraph({ text: '' }),
              ...operative.map(
                (c, idx) => new Paragraph({
                  children: [
                    new TextRun({ text: `${idx + 1}. ` }),
                    new TextRun({ text: c.opening_phrase, underline: {} }),
                    new TextRun({ text: ` ${c.content};` })
                  ]
                })
              ),
            ],
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      return new NextResponse(buffer as any, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="resolution.docx"',
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
