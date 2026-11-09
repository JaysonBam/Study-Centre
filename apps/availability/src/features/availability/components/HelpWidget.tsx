import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleHelp, X, Clock, RotateCcw, AlertCircle, Users } from 'lucide-react';
import { STYLES } from './styles';

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Help Button (Mobile Only) */}
      <div className={STYLES.help.fab} style={{ bottom: '90px' }}>
        <button onClick={() => setIsOpen(true)} className={STYLES.help.fabButton}>
          <span className="text-sm">How to book</span>
          <div className="w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center text-white">
            <CircleHelp className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Help Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={STYLES.help.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className={STYLES.help.modal}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.5, y: 100 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            >
              {/* Modal Header */}
              <div className={STYLES.help.header}>
                <h3 className="text-lg font-bold text-slate-800">Booking Guide</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 bg-white rounded-full text-slate-400 hover:text-slate-800 transition-colors shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className={STYLES.help.content}>
                {/* Step 1 */}
                <div className={STYLES.help.stepRow}>
                  <div className={STYLES.help.stepNumber}>1</div>
                  <div className="space-y-1">
                    <h4 className={STYLES.help.stepTitle}>Visit Front Desk</h4>
                    <p className={STYLES.help.stepDesc}>We will ask for:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className={STYLES.help.tag}>A student card</span>
                      <span className={STYLES.help.tag}>Student numbers</span>
                      <span className={STYLES.help.tag}>Duration</span>
                      <span className={STYLES.help.tag}>Group size</span>
                      <span className={STYLES.help.tag}>Study course</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={STYLES.help.stepRow}>
                  <div className={STYLES.help.stepNumber}>2</div>
                  <div className="space-y-1">
                    <h4 className={STYLES.help.stepTitle}>Group size requirment</h4>
                    <div className="grid grid-cols-3 gap-2 mt-1 w-full">
                      <div className="bg-slate-50 border border-slate-100 p-1.5 rounded text-center">
                        <div className="text-[8px] uppercase text-slate-400 font-bold">Open Room</div>
                        <div className="text-sm font-bold text-slate-700">2-7</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-1.5 rounded text-center">
                        <div className="text-[8px] uppercase text-slate-400 font-bold">Closed Room</div>
                        <div className="text-sm font-bold text-slate-700">4-7</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 p-1.5 rounded text-center">
                        <div className="text-[8px] uppercase text-slate-400 font-bold">Boardroom</div>
                        <div className="text-sm font-bold text-slate-700">6-10</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={STYLES.help.stepRow}>
                  <div className={STYLES.help.stepNumber}>3</div>
                  <div className="space-y-1">
                    <h4 className={STYLES.help.stepTitle}>Key Rules</h4>
                    <ul className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <li className="flex gap-2">
                        <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                        <span>
                          Max <strong>2 hours</strong>. Please vacate on time.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <RotateCcw className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                        <span>
                          Extend <strong>15 mins</strong> before end (if slots open).
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                        <span>
                          Reservations have a <strong>10-min late</strong> grace period.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <Users className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                        <span>Min. group size must be present to check in.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
