import PDFDocument from 'pdfkit';

// Helper function to generate PDF for single location
export async function generateLocationPDF(location) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title
    doc.fontSize(24)
      .font('Helvetica-Bold')
      .text('Location QR Code', { align: 'center' });

    doc.moveDown(2);

    // Location ID
    doc.fontSize(18)
      .font('Helvetica')
      .text(`Location ID: ${location.locationId}`, { align: 'center' });

    doc.moveDown(1);

    // Location ID
    doc.fontSize(15)
      .font('Helvetica')
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

    doc.moveDown(2);

    // QR Code - Reduced size to match the grid layout
    if (location.qrCode) {
      try {
        // Convert base64 data URL to buffer
        const base64Data = location.qrCode.replace(/^data:image\/png;base64,/, '');
        const qrBuffer = Buffer.from(base64Data, 'base64');

        const qrSize = 140; // Same size as in the grid layout
        const qrX = (doc.page.width - qrSize) / 2; // Center horizontally
        const qrY = doc.y;
        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

        // Location name directly below QR code with minimal padding (exactly like grid layout)
        const textY = qrY + qrSize + 2; // Minimal 2px gap, same as grid layout

        // Location name (truncate if too long)
        let locationName = location.name;
        if (locationName.length > 22) {
          locationName = locationName.substring(0, 19) + '...';
        }

        doc.fontSize(10) // Same size as grid layout
          .font('Helvetica-Bold')
          .text(locationName, qrX, textY, {
            width: qrSize,
            align: 'center'
          });

        // Move cursor down past the QR code and text for footer
        doc.y = textY + 30; // Position cursor well below the text
      } catch (error) {
        console.error('Error adding QR code to PDF:', error);
        // Fallback: add text instead of image
        doc.fontSize(12)
          .text('QR Code could not be loaded', { align: 'center' });
        doc.moveDown(2);
      }
    }

    doc.end();
  });
}