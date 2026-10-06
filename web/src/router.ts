/**
 * Application Router & Multi-Page View Manager.
 *
 * Coordinates seamless, zero-lag view switching between:
 * - 3D Terrain & Simulation Explorer ('map')
 * - Drainage Gap Registry & Ward Auditor ('gaps')
 * - Ground Truth Validation & 6.1x Lift Audit ('validation')
 * - Science, Hydrology & Methodology Guide ('methodology')
 *
 * Supports deep linking, browser back/forward history, and
 * direct "Locate on 3D Map" coordinates bridging.
 */

import type * as maplibregl from 'maplibre-gl';

export type AppPage = 'map' | 'gaps' | 'validation' | 'methodology';

export interface NavigateOptions {
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
}

export class AppRouter {
  currentPage: AppPage = 'map';
  private readonly views = new Map<AppPage, HTMLElement>();
  private mapInstance: maplibregl.Map | null = null;
  private readonly onPageChangeCallbacks: Array<(page: AppPage) => void> = [];

  constructor() {
    window.addEventListener('popstate', () => {
      this.handleHashChange();
    });
    window.addEventListener('hashchange', () => {
      this.handleHashChange();
    });
  }

  init(): void {
    this.handleHashChange();
  }

  setMap(map: maplibregl.Map): void {
    this.mapInstance = map;
  }

  registerView(page: AppPage, element: HTMLElement): void {
    this.views.set(page, element);
    if (page === this.currentPage) {
      element.style.display = 'block';
    } else {
      element.style.display = 'none';
    }
  }

  onPageChange(cb: (page: AppPage) => void): void {
    this.onPageChangeCallbacks.push(cb);
  }

  navigate(page: AppPage, options?: NavigateOptions): void {
    this.currentPage = page;

    // Toggle view containers
    this.views.forEach((el, p) => {
      if (p === page) {
        el.style.display = 'block';
        el.scrollTop = 0;
      } else {
        el.style.display = 'none';
      }
    });

    // Notify listeners (e.g. navbar active indicators)
    this.onPageChangeCallbacks.forEach((cb) => cb(page));

    // Handle map camera target if provided
    if (page === 'map' && options?.center && this.mapInstance) {
      this.mapInstance.flyTo({
        center: options.center,
        zoom: options.zoom ?? 15.5,
        pitch: options.pitch ?? 58,
        bearing: options.bearing ?? -15,
        essential: true,
        duration: 2200,
      });
    }

    // Trigger map resize when switching back to map
    if (page === 'map' && this.mapInstance) {
      setTimeout(() => {
        this.mapInstance?.resize();
      }, 50);
    }
  }

  private handleHashChange(): void {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('page=gaps') || hash.includes('/gaps')) {
      this.navigate('gaps');
    } else if (hash.includes('page=validation') || hash.includes('/validation')) {
      this.navigate('validation');
    } else if (hash.includes('page=methodology') || hash.includes('/methodology')) {
      this.navigate('methodology');
    } else if (hash.includes('page=map') || hash.includes('/map')) {
      this.navigate('map');
    }
  }
}

export const router = new AppRouter();
