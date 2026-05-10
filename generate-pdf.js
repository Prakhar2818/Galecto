const htmlPdf = require('html-pdf');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'docs', 'GALECTO_USER_MANUAL.html');
const outputPath = path.join(__dirname, 'docs', 'GALECTO_USER_MANUAL.pdf');

console.log('Generating PDF from:', inputPath);
console.log('Output to:', outputPath);

const htmlContent = fs.readFileSync(inputPath, 'utf8');

const options = {
  format: 'A4',
  orientation: 'portrait',
  border: '10mm',
  header: {
    height: '20mm',
    contents: '<div style="text-align:center; font-size:12px; color:#666;">Galecto Platform - User Manual</div>'
  },
  footer: {
    height: '15mm',
    contents: '<div style="text-align:center; font-size:10px; color:#999;">Page {{page}} of {{pages}}</div>'
  }
};

htmlPdf.create(htmlContent, options).toFile(outputPath, function(err, res) {
  if (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }
  console.log('PDF generated successfully!');
  console.log('File saved at:', outputPath);
});