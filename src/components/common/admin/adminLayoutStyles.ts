export const primarySidebarClass =
  'flex h-screen w-24 flex-shrink-0 flex-col justify-between bg-[#0d1527] px-2 py-5 text-white';

export const subSidebarClass =
  'flex h-screen w-72 flex-shrink-0 flex-col border-r border-slate-200 bg-[#f8fafc] px-6 py-7';

export const subSidebarTitleClass =
  'text-2xl font-black tracking-tight text-slate-950';

export const subSidebarSectionClass = 'mt-9 flex min-h-0 flex-1 flex-col gap-3';

export const subSidebarSectionLabelClass = 'text-xs font-black text-slate-500';

export const subSidebarListClass =
  'flex min-h-0 flex-col gap-1.5 overflow-y-auto pr-1';

export const subSidebarMessageClass =
  'rounded-xl bg-white px-3 py-4 text-sm font-bold text-slate-400';

export const subSidebarErrorClass =
  'rounded-xl bg-red-50 px-3 py-4 text-sm font-bold text-red-600';

export const getPrimaryNavLinkClass = (active: boolean) =>
  `flex h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl no-underline transition-all duration-200 ${
    active
      ? 'border border-white/80 bg-[#1e3155] font-bold text-white shadow-sm'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`;

export const getSubNavButtonClass = (active: boolean) =>
  `flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-black transition ${
    active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-800 hover:bg-white'
  }`;

export const getSubNavLinkClass = (active: boolean) =>
  `flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-black no-underline transition ${
    active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-800 hover:bg-white'
  }`;

export const getSubNavBadgeClass = (active: boolean) =>
  `ml-3 flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs ${
    active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
  }`;
