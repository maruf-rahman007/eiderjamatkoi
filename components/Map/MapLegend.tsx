'use client';

export default function MapLegend() {
    return (
        <div className="map-legend" role="complementary" aria-label="Map legend">
            <div className="legend-item">
                <div className="legend-dot green" />
                <span>আসন্ন জামাত</span>
            </div>
            <div className="legend-item">
                <div className="legend-dot red" />
                <span>জামাত শেষ</span>
            </div>
        </div>
    );
}
