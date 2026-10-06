/**
 * Top Global Navigation Bar Component.
 *
 * Provides responsive multi-page navigation across:
 * - 3D Terrain Explorer ('map')
 * - Drainage Gap Registry ('gaps')
 * - Ground Truth Validation ('validation')
 * - Science & Methodology ('methodology')
 *
 * Hosts telemetry indicators, modal triggers, and external repository links.
 */

import { router, type AppPage } from '../router';

export function createNavbar(openModalCallback: () => void): HTMLElement {
  const header = document.createElement('header');
  header.id = 'app-header';
  header.style.position = 'fixed';
  header.style.top = '0';
  header.style.left = '0';
  header.style.right = '0';
  header.style.height = '52px';
  header.style.zIndex = '500';
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.padding = '0 16px';
  header.style.background = 'linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.90) 100%)';
  header.style.backdropFilter = 'blur(16px)';
  header.style.setProperty('-webkit-backdrop-filter', 'blur(16px)');
  header.style.borderBottom = '1px solid rgba(56, 189, 248, 0.2)';
  header.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.5)';
  header.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  // Left Brand Area
  const brand = document.createElement('div');
  brand.style.display = 'flex';
  brand.style.alignItems = 'center';
  brand.style.gap = '10px';
  brand.style.cursor = 'pointer';
  brand.addEventListener('click', () => router.navigate('map'));

  brand.innerHTML = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">
      <span style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #38bdf8; opacity: 0.3; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></span>
      <span style="width: 8px; height: 8px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 10px #38bdf8;"></span>
    </div>
    <div style="display: flex; flex-direction: column;">
      <div style="font-size: 13px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #f8fafc; line-height: 1.1;">Ghost Drains</div>
      <div style="font-size: 9px; font-weight: 600; color: #94a3b8; letter-spacing: 0.04em;">Bengaluru 3D Hydrology</div>
    </div>
  `;
  header.appendChild(brand);

  // Center Navigation Tabs
  const navTabs = document.createElement('nav');
  navTabs.style.display = 'flex';
  navTabs.style.alignItems = 'center';
  navTabs.style.gap = '4px';
  navTabs.style.background = 'rgba(30, 41, 59, 0.6)';
  navTabs.style.padding = '3px 4px';
  navTabs.style.borderRadius = '9999px';
  navTabs.style.border = '1px solid rgba(148, 163, 184, 0.15)';

  const pages: Array<{ id: AppPage; label: string; badge?: string }> = [
    { id: 'map', label: '🗺️ 3D Terrain & Sim' },
    { id: 'gaps', label: '📊 Gap Registry', badge: '871' },
    { id: 'validation', label: '🎯 Ground Truth & Lift', badge: '6.1×' },
    { id: 'methodology', label: '📖 Science & Docs' },
  ];

  const tabButtons = new Map<AppPage, HTMLButtonElement>();

  pages.forEach(({ id, label, badge }) => {
    const btn = document.createElement('button');
    btn.className = `nav-tab-${id}`;
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '6px';
    btn.style.padding = '5px 12px';
    btn.style.fontSize = '11px';
    btn.style.fontWeight = '600';
    btn.style.borderRadius = '9999px';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'all 0.15s ease';
    btn.style.whiteSpace = 'nowrap';

    let badgeHtml = '';
    if (badge) {
      badgeHtml = `<span style="font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 9999px; background: rgba(56, 189, 248, 0.2); color: #38bdf8;">${badge}</span>`;
    }

    btn.innerHTML = `<span>${label}</span>${badgeHtml}`;

    btn.addEventListener('click', () => {
      router.navigate(id);
    });

    navTabs.appendChild(btn);
    tabButtons.set(id, btn);
  });

  header.appendChild(navTabs);

  // Update tab styles on active page change
  const updateTabStyles = (activePage: AppPage) => {
    tabButtons.forEach((btn, page) => {
      if (page === activePage) {
        btn.style.background = 'linear-gradient(135deg, rgba(14, 165, 233, 0.3) 0%, rgba(2, 132, 199, 0.4) 100%)';
        btn.style.color = '#f8fafc';
        btn.style.boxShadow = '0 0 12px rgba(56, 189, 248, 0.25), inset 0 0 0 1px rgba(56, 189, 248, 0.4)';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = '#94a3b8';
        btn.style.boxShadow = 'none';
      }
    });
  };

  router.onPageChange(updateTabStyles);
  updateTabStyles(router.currentPage);

  // Right Utility Area
  const rightArea = document.createElement('div');
  rightArea.style.display = 'flex';
  rightArea.style.alignItems = 'center';
  rightArea.style.gap = '8px';

  // Methods & Limitations button
  const limitsBtn = document.createElement('button');
  limitsBtn.textContent = 'ℹ️ Methods & Policy';
  limitsBtn.style.padding = '5px 10px';
  limitsBtn.style.fontSize = '11px';
  limitsBtn.style.fontWeight = '600';
  limitsBtn.style.color = '#cbd5e1';
  limitsBtn.style.background = 'rgba(51, 65, 85, 0.6)';
  limitsBtn.style.border = '1px solid rgba(148, 163, 184, 0.2)';
  limitsBtn.style.borderRadius = '6px';
  limitsBtn.style.cursor = 'pointer';
  limitsBtn.style.transition = 'all 0.15s ease';
  limitsBtn.addEventListener('mouseenter', () => {
    limitsBtn.style.background = 'rgba(51, 65, 85, 0.9)';
    limitsBtn.style.color = '#f8fafc';
  });
  limitsBtn.addEventListener('mouseleave', () => {
    limitsBtn.style.background = 'rgba(51, 65, 85, 0.6)';
    limitsBtn.style.color = '#cbd5e1';
  });
  limitsBtn.addEventListener('click', openModalCallback);
  rightArea.appendChild(limitsBtn);

  // GitHub Link
  const githubLink = document.createElement('a');
  githubLink.href = 'https://github.com/abhinavsingh2403/GhostDrain';
  githubLink.target = '_blank';
  githubLink.rel = 'noopener noreferrer';
  githubLink.innerHTML = '⭐ GitHub';
  githubLink.style.padding = '5px 10px';
  githubLink.style.fontSize = '11px';
  githubLink.style.fontWeight = '600';
  githubLink.style.color = '#38bdf8';
  githubLink.style.background = 'rgba(14, 165, 233, 0.15)';
  githubLink.style.border = '1px solid rgba(56, 189, 248, 0.3)';
  githubLink.style.borderRadius = '6px';
  githubLink.style.textDecoration = 'none';
  githubLink.style.transition = 'all 0.15s ease';
  rightArea.appendChild(githubLink);

  header.appendChild(rightArea);

  return header;
}
