const QRCode = require('qrcode');

// Generate QR code as data URL
const generateQRCode = async (text) => {
    try {
        return await QRCode.toDataURL(text);
    } catch (error) {
        console.error('QR Code generation error:', error);
        throw new Error('Failed to generate QR code');
    }
};

module.exports = { generateQRCode };