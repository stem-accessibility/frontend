import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './styles/QRCode.css';
type QRCodeGeneratorProps = {
  permalink: string;
};

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ permalink }) => {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleDownload = async () => {
   const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngFile;
      downloadLink.download = 'qr-code.png';
      downloadLink.click();

      setIsDownloaded(true);
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <div className="ld-qr-card">
      <div className="ld-qr-image">
        <QRCodeSVG
          value={permalink}
          ref={svgRef as any}
          size={132}
          includeMargin
        />
      </div>

      <div className="ld-qr-content">
        <h3 className="ld-qr-title">QR Code</h3>
        <p className="ld-qr-text">
          Scan this code to open the long description on a separate device or
          include it next to your printed image.
        </p>
        <button
          type="button"
          onClick={handleDownload}
          className={
            'ld-qr-button' + (isDownloaded ? ' disabled' : '')
          }
        >
          {isDownloaded ? 'Downloaded!' : 'Download QR Code'}
        </button>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
