export const CARD_VARIANTS = {
  high: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    textMain: 'text-emerald-900',
    textSub: 'text-emerald-700',
    iconBg: 'bg-white text-emerald-600',
    bar: 'bg-emerald-500',
  },
  low: {
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    textMain: 'text-orange-900',
    textSub: 'text-orange-800',
    iconBg: 'bg-white text-orange-600',
    bar: 'bg-orange-500',
  },
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-100',
    textMain: 'text-red-900',
    textSub: 'text-red-800',
    iconBg: 'bg-white text-red-600',
    bar: 'bg-red-500',
  },
  full: {
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    textMain: 'text-slate-500',
    textSub: 'text-slate-400',
    iconBg: 'bg-white text-slate-400',
    bar: 'bg-slate-300',
  },
};

type CardStyle = (typeof CARD_VARIANTS)[keyof typeof CARD_VARIANTS];

export const STYLES = {
  // Layout
  pageContainer:
    'min-h-screen lg:h-screen bg-slate-50 font-sans text-slate-900 flex flex-col overflow-x-hidden',
  mainContent: 'flex-1 w-full p-1 lg:p-4 flex flex-col lg:h-full lg:overflow-hidden',
  layout: {
    gridContainer:
      'space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:grid-rows-2 lg:gap-6 lg:h-full lg:min-h-0',
  },

  // Header
  header: {
    container:
      'bg-white shrink-0 z-20 border-b border-slate-200 shadow-sm relative transition-all duration-300',
    inner: 'w-full px-4 py-2 lg:px-6 lg:py-4 lg:min-h-[90px] flex flex-col justify-center',
    flexRow: 'flex justify-between items-center text-sm lg:text-lg relative',
    brandContainer: 'z-10 transform transition-transform',
    brandTitle: 'font-black text-slate-800 text-lg lg:text-4xl leading-tight tracking-tight',
    brandSubtitle:
      'text-[10px] lg:text-sm font-bold text-slate-400 uppercase tracking-wider lg:tracking-widest',
    centerNav:
      'hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-4 bg-slate-50/80 rounded-xl px-6 py-2 border border-slate-200/60 backdrop-blur-md shadow-sm transition-all duration-300',
    timerContainer: (isLive: boolean) =>
      `flex flex-col items-center justify-center ${isLive ? 'min-w-[300px]' : 'min-w-[200px]'} transition-all duration-300`,
    timerText:
      'font-extrabold text-slate-800 text-4xl tracking-tight tabular-nums animate-in fade-in zoom-in duration-300',
    liveBadge:
      'flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full animate-pulse border border-emerald-200',
  },

  // Mobile Nav
  mobileNav: {
    container:
      'lg:hidden w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-2 flex items-center justify-between mb-4 shrink-0',
    button: (disabled: boolean) =>
      `p-3 rounded-xl transition-colors ${disabled ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'}`,
  },

  // Room Card
  roomCard: {
    container: (activeStyle: CardStyle, className: string) =>
      `relative overflow-hidden rounded-xl lg:rounded-3xl border ${activeStyle.border} ${activeStyle.bg} shadow-sm transition-all duration-300 flex flex-col justify-between ${className}`,
    innerContent: 'p-4 pb-5 lg:p-8 lg:flex-1 lg:flex lg:flex-col',
    iconTitleRow: 'flex justify-between items-start mb-3 lg:mb-auto',
    subtitleTag: (activeStyle: CardStyle) =>
      `text-xs lg:text-xl ${activeStyle.textSub} font-medium opacity-80 flex items-center gap-1 bg-white/50 px-2 py-1 lg:px-4 lg:py-2 rounded-md lg:rounded-xl`,
    breakdownRow: 'flex justify-between items-end lg:items-end mt-2',
    breakdownItem: (activeStyle: CardStyle) =>
      `flex items-center text-sm lg:text-2xl font-medium ${activeStyle.textSub}`,
    zeroState: (activeStyle: CardStyle) =>
      `text-sm lg:text-2xl font-medium ${activeStyle.textSub} flex items-center opacity-80 pl-1`,
    totalCount: (activeStyle: CardStyle) =>
      `text-3xl lg:text-9xl font-bold tracking-tight ${activeStyle.textMain} leading-none block`,
    totalLabel: (activeStyle: CardStyle) =>
      `text-sm lg:text-2xl font-medium ${activeStyle.textSub} opacity-70 ml-1 block mt-1`,
    progressBar: (activeStyle: CardStyle) => `h-full ${activeStyle.bar} transition-all duration-500`,
  },

  // QR Card
  qrCard: {
    container:
      'hidden lg:flex bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex-row items-center justify-center gap-6 xl:gap-10 relative overflow-hidden',
    codeWrapper:
      'relative z-10 bg-white p-3 rounded-2xl shadow-lg border border-slate-100 shrink-0 h-[100%] aspect-square flex items-center justify-center',
    textContainer: 'relative z-10 text-left min-w-0',
    title: 'text-4xl xl:text-6xl font-black text-slate-800 tracking-tight leading-none mb-2 xl:mb-4',
    subtitle: 'text-xl xl:text-3xl text-slate-500 font-medium leading-snug',
  },

  // Help Modal
  help: {
    fab: 'lg:hidden fixed bottom-6 right-6 z-50',
    fabButton:
      'bg-sky-100 text-sky-700 font-semibold px-5 py-3 rounded-full shadow-xl border border-sky-200 flex items-center gap-2 active:scale-95 transition-all hover:bg-sky-200',
    overlay:
      'fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm',
    modal:
      'bg-white w-full max-w-sm rounded-3xl shadow-2xl relative overflow-hidden mb-safe origin-bottom-right',
    header: 'bg-sky-50 px-5 py-4 flex items-center justify-between border-b border-sky-100',
    content: 'p-5 space-y-5 max-h-[75vh] overflow-y-auto',
    stepRow: 'flex gap-3',
    stepTitle: 'font-semibold text-slate-800 text-sm',
    stepDesc: 'text-xs text-slate-500 mb-1.5',
    stepNumber:
      'w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold shrink-0 text-xs mt-0.5',
    tag: 'text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium border border-slate-200',
  },

  // Status
  loading: 'min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-400',
  error: 'min-h-screen bg-slate-50 flex flex-col items-center justify-center text-rose-500 p-6 text-center',
};
