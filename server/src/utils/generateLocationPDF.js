import PDFDocument from 'pdfkit';
import fs from 'fs/promises';

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
    
    // Location name
    doc.fontSize(18)
       .font('Helvetica')
       .text(`Location: ${location.name}`, { align: 'center' });
    
    // Location ID
    doc.fontSize(18)
       .font('Helvetica')
       .text(`Location ID: ${location.locationId}`, { align: 'center' });
    
    doc.moveDown(2);
    
    // QR Code - Fixed to handle base64 data
    if (location.qrCode) {
      try {
        // Convert base64 data URL to buffer
        const base64Data = location.qrCode.replace(/^data:image\/png;base64,/, '');
        const qrBuffer = Buffer.from(base64Data, 'base64');
        
        const qrX = (doc.page.width - 200) / 2;
        const qrY = doc.y;
        doc.image(qrBuffer, qrX, qrY, { width: 200, height: 200 });
        doc.moveDown(12);
      } catch (error) {
        console.error('Error adding QR code to PDF:', error);
        // Fallback: add text instead of image
        doc.fontSize(12)
           .text('QR Code could not be loaded', { align: 'center' });
        doc.moveDown(2);
      }
    }
    
    // Footer
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    
    doc.end();
  });
}