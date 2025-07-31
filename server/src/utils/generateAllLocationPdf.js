import PDFDocument from 'pdfkit';

// Helper function to generate PDF for all locations
export async function generateAllLocationsPDF(locations) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });
    
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    
    // Title page
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .text('All Location QR Codes', { align: 'center' });
    
    doc.moveDown(1);
    doc.fontSize(14)
       .font('Helvetica')
       .text(`Total Locations: ${locations.length}`, { align: 'center' });
    
    doc.moveDown(1);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    
    // Location pages
    locations.forEach((location, index) => {
      doc.addPage();
      
      // Location header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text(`Location ${index + 1}: ${location.name}`, { align: 'center' });
      
      doc.moveDown(2);
      
      // QR Code - Fixed to handle base64 data
      if (location.qrCode) {
        try {
          // Convert base64 data URL to buffer
          const base64Data = location.qrCode.replace(/^data:image\/png;base64,/, '');
          const qrBuffer = Buffer.from(base64Data, 'base64');
          
          const qrX = (doc.page.width - 250) / 2;
          const qrY = doc.y;
          doc.image(qrBuffer, qrX, qrY, { width: 250, height: 250 });
          doc.moveDown(15);
        } catch (error) {
          console.error(`Error adding QR code for location ${location.name}:`, error);
          // Fallback: add text instead of image
          doc.fontSize(12)
             .text('QR Code could not be loaded', { align: 'center' });
          doc.moveDown(2);
        }
      }
      
      // Location info
      doc.fontSize(12)
         .font('Helvetica')
         .text(`ID: ${location.locationId}`, { align: 'center' });
      
      // Handle date parsing - createdAt might be a string
      const createdDate = typeof location.createdAt === 'string' 
        ? new Date(location.createdAt) 
        : location.createdAt;
      doc.text(`Created: ${createdDate.toLocaleString()}`, { align: 'center' });
    });
    
    doc.end();
  });
}