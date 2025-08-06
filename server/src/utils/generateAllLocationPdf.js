import PDFDocument from 'pdfkit';

// Helper function to generate PDF for all locations
export async function generateAllLocationsPDF(locations) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 5, // Reduced from 50 to 20
    });
    
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    
    // Title page (unchanged)
    doc.fontSize(28)
       .font('Helvetica-Bold')
       .text('All Location QR Codes', { align: 'center' });
    
    doc.moveDown(1);
    doc.fontSize(14)
       .font('Helvetica')
       .text(`Total Locations: ${locations.length}`, { align: 'center' });
    
    doc.moveDown(1);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    
    // Layout configuration
    const cols = 4; // Fixed: 4 codes per row
    const rows = 5; // Fixed: 6 rows per page
    const qrPerPage = cols * rows; // 20 QR codes per page
    
    const pageWidth = doc.page.width; // Account for reduced margins (20 each side)
    const qrSize = 140; // Increased QR code size
    const labelHeight = 25; // Space for location name only
    const cellWidth = pageWidth / cols; // Evenly distribute across width
    const cellHeight = qrSize + labelHeight + 2; // QR + label + minimal padding
    
    // Generate location pages with grid layout
    for (let pageStart = 0; pageStart < locations.length; pageStart += qrPerPage) {
      doc.addPage();
      
      const pageLocations = locations.slice(pageStart, pageStart + qrPerPage);
      
      // Calculate starting positions
      const startX = 5; // Match reduced margin
      const startY = 5; // Reduced top margin
      
      // Draw QR codes in grid
      pageLocations.forEach((location, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const x = startX + col * cellWidth;
        const y = startY + row * cellHeight;
        
        // QR Code
        if (location.qrCode) {
          try {
            // Convert base64 data URL to buffer
            const base64Data = location.qrCode.replace(/^data:image\/png;base64,/, '');
            const qrBuffer = Buffer.from(base64Data, 'base64');
            
            // Center QR code in cell
            const qrX = x + (cellWidth - qrSize) / 2;
            const qrY = y;
            doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
          } catch (error) {
            console.error(`Error adding QR code for location ${location.name}:`, error);
            // Fallback: draw placeholder rectangle
            const qrX = x + (cellWidth - qrSize) / 2;
            const qrY = y;
            doc.rect(qrX, qrY, qrSize, qrSize)
               .stroke()
               .fontSize(10)
               .text('QR Error', qrX + qrSize/2 - 20, qrY + qrSize/2 - 5);
          }
        }
        
        // Location name below QR code (only)
        const textX = x;
        const textY = y + qrSize; // Reduced gap between QR and text
        const textWidth = cellWidth;
        
        doc.fontSize(10) // Slightly larger font since we have more space
           .font('Helvetica-Bold');
        
        // Location name (truncate if too long)
        let locationName = location.name;
        if (locationName.length > 22) {
          locationName = locationName.substring(0, 19) + '...';
        }
        
        doc.text(locationName, textX, textY, { 
          width: textWidth, 
          align: 'center' 
        });
      });
    }
    
    doc.end();
  });
}