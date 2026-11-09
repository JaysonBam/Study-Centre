import QRCode from 'react-qr-code';
import { STYLES } from './styles';

export function QRCodeCard() {
  return (
    <div className={STYLES.qrCard.container}>
      <div className="absolute inset-0 bg-slate-50 opacity-50 patterned-bg"></div>

      {/* QR Container - Responsive Height */}
      <div className={STYLES.qrCard.codeWrapper}>
        <QRCode
          size={256}
          style={{ height: '100%', width: '100%' }}
          value={import.meta.env.VITE_SITE_URL || window.location.origin}
          viewBox={`0 0 256 256`}
          fgColor="#1e293b"
          level="Q"
        />
      </div>

      <div className={STYLES.qrCard.textContainer}>
        <h3 className={STYLES.qrCard.title}>
          SCAN
          <br />
          TO GO
        </h3>
        <p className={STYLES.qrCard.subtitle}>
          View availability
          <br />
          on your phone
        </p>
      </div>
    </div>
  );
}
