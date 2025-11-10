// npx tsc src/authentication/QR-code.ts --outDir dist
// drag QRcode.html into browser to test
import * as QRCode from 'qrcode';

export async function generateQRCode(data: string): Promise<string> {
  try {
    // Generates a data URL representing the QR code image
    const url = await QRCode.toDataURL(data);
    return url;
  } catch (err) {
    throw new Error('Failed to generate QR code: ' + String(err));
  }
}

// Example usage:
generateQRCode('Hello, world!').then(url => {
  console.log(url); // You can use this URL to set an <img src="..."> in HTML
});
