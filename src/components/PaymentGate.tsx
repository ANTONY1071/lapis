export const PaymentGate = ({ onClose }: { onClose?: () => void }) => (
  <div className="fixed inset-0 z-50 bg-navy-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
    <h1 className="text-4xl font-bold mb-2">Lapis</h1>
    <p className="text-white/40 text-sm mb-8">Complete payment to activate your shop</p>

    <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-navy-900 shadow-2xl">
      <p className="font-bold text-lg mb-1">nitheen antony</p>
      <p className="text-xs text-gray-400 mb-4">Scan to pay</p>

      {/* QR placeholder — replace src with actual image */}
      <div className="w-full aspect-square bg-gray-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden border">
        <img
          src="/assets/WhatsApp Image 2026-04-30 at 8.13.24 PM.jpeg"
          alt="Payment QR Code"
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML =
              '<p class="text-gray-400 text-xs p-4">Place QR image at<br/>/public/assets/<br/>WhatsApp Image 2026-04-30 at 8.13.24 PM.jpeg</p>';
          }}
        />
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
        <p className="text-[10px] uppercase text-gray-400 tracking-wider mb-0.5">UPI ID</p>
        <p className="font-mono font-bold text-sm">antonynitheen@okicici</p>
      </div>

      <p className="text-xs font-semibold text-blue-600">
        Your account will be activated within 2 hours after payment.
      </p>
    </div>

    {onClose && (
      <button
        onClick={onClose}
        className="mt-6 text-white/40 hover:text-white text-sm transition-colors"
      >
        Close
      </button>
    )}
  </div>
);
