import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Equipment, FaultRecord, Site, SiteId } from '../types';

interface SiteLocationMapProps {
  sites: Site[];
  equipment: Equipment[];
  faults: FaultRecord[];
  focusedSiteId?: SiteId | 'all';
  onlyShowSiteId?: SiteId;
  onSelectSite?: (siteId: SiteId) => void;
  heightClass?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function SiteLocationMap({
  sites,
  equipment,
  faults,
  focusedSiteId = 'all',
  onlyShowSiteId,
  onSelectSite,
  heightClass = 'h-64',
}: SiteLocationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const onSelectSiteRef = useRef(onSelectSite);

  useEffect(() => {
    onSelectSiteRef.current = onSelectSite;
  }, [onSelectSite]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-32.0822, 115.8893],
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    // CARTO basemaps now require an API key (tiles come back as an "API KEY
    // REQUIRED" watermark), and OpenStreetMap's volunteer servers block app
    // traffic, so use Esri's keyless street basemap. Esri tiles are {z}/{y}/{x}.
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, USGS, NGA, EPA, USDA, NPS, &copy; OpenStreetMap contributors',
        maxZoom: 19,
      }
    ).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    const visibleSites = onlyShowSiteId
      ? sites.filter((s) => s.id === onlyShowSiteId)
      : sites;

    visibleSites.forEach((site) => {
      const siteEq = equipment.filter((e) => e.siteId === site.id);
      const operational = siteEq.filter((e) => e.status === 'Operational').length;
      const onHold = siteEq.filter((e) => e.status === 'On Hold').length;
      const openFaults = faults.filter(
        (f) => f.siteId === site.id && f.status !== 'Resolved'
      ).length;
      const urgentFaults = faults.filter(
        (f) => f.siteId === site.id && f.status === 'Urgent'
      ).length;

      const isFocused = focusedSiteId === site.id;
      const hasAlert = urgentFaults > 0 || onHold > 0;
      const pinBg = hasAlert ? '#DC2626' : '#1D4ED8';
      const ringBorder = isFocused ? '2px solid #0F172A' : '2px solid #FFFFFF';

      const safeName = escapeHtml(site.name);
      const safeAddress = escapeHtml(
        `${site.address}, ${site.suburb} ${site.state} ${site.postcode}`
      );
      const safeManager = escapeHtml(site.managerName);

      const iconHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);pointer-events:auto;cursor:pointer;">
          <div style="background:#FFFFFF;border:${isFocused ? '2px solid #1D4ED8' : '1px solid #CBD5E1'};border-radius:10px;padding:4px 8px;box-shadow:0 4px 12px rgba(15,23,42,0.12);white-space:nowrap;display:flex;align-items:center;gap:6px;font-family:'Plus Jakarta Sans',sans-serif;">
            <span style="width:8px;height:8px;border-radius:9999px;background:${pinBg};display:inline-block;flex-shrink:0;"></span>
            <span style="font-size:12px;font-weight:700;color:#0F172A;">${safeName}</span>
            <span style="font-size:11px;font-family:'JetBrains Mono',monospace;color:#475569;">${siteEq.length}u · ${openFaults}f</span>
          </div>
          <div style="width:14px;height:14px;border-radius:9999px;background:${pinBg};border:${ringBorder};margin-top:4px;box-shadow:0 2px 6px rgba(15,23,42,0.3);"></div>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'equiptrack-site-marker',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        popupAnchor: [0, -44],
      });

      const popupHtml = `
        <div style="min-width:205px;font-family:'Public Sans',sans-serif;color:#0F172A;">
          <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:14px;margin-bottom:2px;">${safeName} Yard</div>
          <div style="font-size:11px;color:#475569;margin-bottom:8px;">${safeAddress}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;border-top:1px solid #E2E8F0;padding-top:8px;">
            <div>
              <div style="color:#64748B;">Fleet Ready</div>
              <div style="font-weight:700;font-family:'JetBrains Mono',monospace;color:#16A34A;">${operational} / ${siteEq.length}</div>
            </div>
            <div>
              <div style="color:#64748B;">On Hold</div>
              <div style="font-weight:700;font-family:'JetBrains Mono',monospace;color:${onHold > 0 ? '#DC2626' : '#0F172A'};">${onHold}</div>
            </div>
            <div>
              <div style="color:#64748B;">Open Faults</div>
              <div style="font-weight:700;font-family:'JetBrains Mono',monospace;color:${openFaults > 0 ? '#D97706' : '#0F172A'};">${openFaults}</div>
            </div>
            <div>
              <div style="color:#64748B;">Supervisor</div>
              <div style="font-weight:600;color:#0F172A;">${safeManager}</div>
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([site.latitude, site.longitude], { icon })
        .addTo(group)
        .bindPopup(popupHtml);

      marker.on('click', () => {
        if (onSelectSiteRef.current) {
          onSelectSiteRef.current(site.id);
        }
      });

    });

    if (onlyShowSiteId && visibleSites.length === 1) {
      // Centre on the single site. The popup isn't auto-opened: on these compact
      // maps it is taller than the map and pushes the pin out of view (the site
      // name and address are already shown beside the map; tap the pin for more).
      const target = visibleSites[0];
      map.setView([target.latitude, target.longitude], 14, { animate: false });
    } else if (focusedSiteId !== 'all') {
      const target = visibleSites.find((s) => s.id === focusedSiteId);
      if (target) {
        map.setView([target.latitude, target.longitude], 13, { animate: true });
      }
    } else if (visibleSites.length >= 2) {
      const bounds = L.latLngBounds(
        visibleSites.map((s) => [s.latitude, s.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [55, 55], maxZoom: 13 });
    } else if (visibleSites.length === 1) {
      map.setView([visibleSites[0].latitude, visibleSites[0].longitude], 13);
    }
  }, [sites, equipment, faults, focusedSiteId, onlyShowSiteId]);

  return (
    <div
      className={`relative isolate z-0 w-full ${heightClass} rounded-xl overflow-hidden border border-slate-200 bg-slate-100`}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
