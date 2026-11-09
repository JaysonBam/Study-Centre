import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X, Clock, Instagram } from 'lucide-react';
import { STYLES } from './styles';
import type { OperationHours, SaturdayHours } from '@/api/types';

interface OperationalInfoWidgetProps {
  operationHours: OperationHours;
  saturdayHours: SaturdayHours;
}

export function OperationalInfoWidget({ operationHours, saturdayHours }: OperationalInfoWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Safe access with defaults
  const opStart = operationHours?.start || '07:00';
  const opEnd = operationHours?.end || '18:00';
  const numSaturdayHours = saturdayHours || { start: '08:00', end: '12:00', enabled: false };
  const envInstaUrl = import.meta.env.VITE_INSTAGRAM_URL ?? '';
  const envInstaUser = import.meta.env.VITE_INSTAGRAM_USERNAME ?? '';
  const parsedFromUrl = envInstaUrl ? envInstaUrl.replace(/\/+$/, '').split('/').pop() || '' : '';
  const instaUsername = envInstaUser || parsedFromUrl;
  const instaUrl = envInstaUrl || (instaUsername ? `https://instagram.com/${instaUsername}` : '');
  const instaDisplay = instaUsername ? ` (@${instaUsername})` : '';

  return (
    <>
      {/* Floating Info Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-50 text-indigo-700 font-semibold px-5 py-3 rounded-full shadow-xl border border-indigo-100 flex items-center gap-2 active:scale-95 transition-all hover:bg-indigo-100"
        >
          <span className="text-sm">Hours</span>
          <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white">
            <Info className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Modal Overlay */}
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
                <h3 className="text-lg font-bold text-slate-800">Operational Hours</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 bg-white rounded-full text-slate-400 hover:text-slate-800 transition-colors shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 transform rotate-3">
                  <Clock className="w-7 h-7 text-slate-600" />
                </div>

                <h4 className="font-semibold text-slate-800 mb-4">Mining Industry Study Center</h4>

                <div className="space-y-3 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-medium text-slate-500">Mon - Fri</span>
                    <span className="text-sm font-bold text-slate-900">
                      {opStart} - {opEnd}
                    </span>
                  </div>
                  <div className="h-px bg-slate-200 w-full" />
                  <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-medium text-slate-500">Saturday</span>
                    <span
                      className={`text-sm font-bold ${numSaturdayHours.enabled ? 'text-slate-900' : 'text-slate-400'}`}
                    >
                      {numSaturdayHours.enabled
                        ? `${numSaturdayHours.start} - ${numSaturdayHours.end}`
                        : 'Closed'}
                    </span>
                  </div>
                  <div className="h-px bg-slate-200 w-full" />
                  <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-medium text-slate-500">Sunday</span>
                    <span className="text-sm font-bold text-slate-400">Closed</span>
                  </div>
                </div>

                <a
                  href={instaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-full text-sm font-medium transition-all group w-full justify-center border border-slate-100"
                >
                  <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Find latest operational info on Instagram{instaDisplay}</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
