export const adminLayoutClass =
  'mycrew-admin-theme flex h-screen w-full overflow-hidden bg-[#eef3ef] text-slate-950';

export const adminContentClass =
  'mycrew-admin-content min-h-0 flex-1 overflow-y-auto px-8 py-6';

export const primarySidebarClass =
  'flex h-screen w-24 flex-shrink-0 flex-col bg-[#0d1527] px-2 py-5 text-white';

export const adminLogoLinkClass =
  'mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-[#16a34a] text-3xl font-black text-white no-underline shadow-md transition-transform hover:scale-105';

export const adminSubSidebarActionButtonClass =
  'mt-5 h-11 rounded-lg !bg-[#16a34a] !bg-none text-base !text-white shadow-lg !shadow-emerald-200 hover:!bg-[#15803d]';

export const subSidebarClass =
  'flex h-screen w-72 flex-shrink-0 flex-col bg-[#e3ece5] px-6 py-7';

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

export const subNavButtonActiveClass =
  'flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-black transition bg-[#16a34a] text-white shadow-sm';

export const subNavButtonInactiveClass =
  'flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-black transition text-slate-800 hover:bg-[#eef3ef]';

export const subNavLinkActiveClass =
  'flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-black no-underline transition bg-[#16a34a] text-white shadow-sm';

export const subNavLinkInactiveClass =
  'flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-black no-underline transition text-slate-800 hover:bg-[#eef3ef]';

export const subNavBadgeActiveClass = 'bg-white/20 text-white';

export const subNavBadgeInactiveClass = 'bg-emerald-100 text-emerald-800';

export const getPrimaryNavLinkClass = (active: boolean) =>
  `flex h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl no-underline transition-all duration-200 ${
    active
      ? 'border border-white/80 bg-[#1e3155] font-bold text-white shadow-sm'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`;

export const getSubNavButtonClass = (active: boolean) =>
  active ? subNavButtonActiveClass : subNavButtonInactiveClass;

export const getSubNavLinkClass = (active: boolean) =>
  active ? subNavLinkActiveClass : subNavLinkInactiveClass;

export const getSubNavBadgeClass = (active: boolean) =>
  `ml-3 flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs ${
    active ? subNavBadgeActiveClass : subNavBadgeInactiveClass
  }`;
