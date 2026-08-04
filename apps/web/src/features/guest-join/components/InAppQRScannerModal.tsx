import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';
import { Button } from '#/features/shared/components/ui/button';

interface InAppQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedLobbyCode: string) => void;
}

export function InAppQRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: InAppQRScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const qrElementId = 'qr-reader-container';
    const html5Qrcode = new Html5Qrcode(qrElementId);
    scannerRef.current = html5Qrcode;

    const config = { fps: 10, qrbox: { width: 220, height: 220 } };

    html5Qrcode
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          let code = decodedText.trim();
          if (code.includes('lobbyId=')) {
            const urlParams = new URLSearchParams(code.slice(code.indexOf('?')));
            const parsed = urlParams.get('lobbyId');
            if (parsed) code = parsed;
          } else if (code.includes('/')) {
            const parts = code.split('/');
            code = parts[parts.length - 1];
          }

          const cleanCode = code.replace(/[^0-9A-Za-z]/g, '').slice(0, 6).toUpperCase();

          if (cleanCode.length === 6) {
            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current
                .stop()
                .then(() => {
                  onScanSuccess(cleanCode);
                  onClose();
                })
                .catch(() => {
                  onScanSuccess(cleanCode);
                  onClose();
                });
            }
          }
        },
        () => {
          // frame parse error expected
        },
      )
      .catch((err) => {
        console.warn('QR Scanner Camera error:', err);
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isOpen, onClose, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#0a0d18] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 text-cyan-400 hover:text-white cursor-pointer"
        >
          <X size={20} />
        </Button>

        <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 rounded-xl text-cyan-400 mb-3">
          <Camera size={24} />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">Scan Host QR Code</h3>
        <p className="text-xs text-muted-foreground text-center mb-6">
          Point your phone camera at the QR code displayed on the host screen to join immediately.
        </p>

        <div className="relative w-full overflow-hidden rounded-2xl border-2 border-cyan-500/40 bg-black min-h-[260px] flex items-center justify-center">
          <div id="qr-reader-container" className="w-full" />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="mt-6 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
        >
          Cancel Scan
        </Button>
      </div>
    </div>
  );
}
