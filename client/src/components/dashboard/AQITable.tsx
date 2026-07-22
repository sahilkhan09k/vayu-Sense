import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { AQIBadge } from '../common/AQIBadge';
import type { WardAQI } from '../../hooks/useAQIData';
import './AQITable.css';

interface AQITableProps {
  wards: WardAQI[];
  selectedWardId: string | null;
  onSelectWard: (wardId: string, wardName: string) => void;
}

type SortField = 'wardName' | 'aqi' | 'pm25' | 'pm10';
type SortOrder = 'asc' | 'desc';

export function AQITable({ wards, selectedWardId, onSelectWard }: AQITableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('aqi');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredWards = useMemo(() => {
    return wards.filter((ward) =>
      ward.wardName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [wards, searchQuery]);

  const sortedWards = useMemo(() => {
    return [...filteredWards].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });
  }, [filteredWards, sortField, sortOrder]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="aqi-table-container">
      <div className="aqi-table-header-controls">
        <h3 className="section-label" style={{ marginBottom: 0 }}>Ward Rankings</h3>
        <div className="aqi-table-search-wrapper">
          <Search size={14} className="aqi-table-search-icon" />
          <input
            type="text"
            placeholder="Search wards..."
            className="vs-input aqi-table-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="aqi-table-wrapper">
        <table className="aqi-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('wardName')} className="sortable">
                Ward <SortIcon field="wardName" />
              </th>
              <th onClick={() => handleSort('aqi')} className="sortable text-center">
                AQI <SortIcon field="aqi" />
              </th>
              <th onClick={() => handleSort('pm25')} className="sortable text-center">
                PM2.5 <SortIcon field="pm25" />
              </th>
              <th onClick={() => handleSort('pm10')} className="sortable text-center">
                PM10 <SortIcon field="pm10" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedWards.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center no-data">
                  No wards found matching "{searchQuery}"
                </td>
              </tr>
            ) : (
              sortedWards.map((ward) => {
                const isSelected = selectedWardId === ward.wardId;
                return (
                  <tr
                    key={ward.wardId}
                    className={`aqi-table-row ${isSelected ? 'aqi-table-row--selected' : ''}`}
                    onClick={() => onSelectWard(ward.wardId, ward.wardName)}
                  >
                    <td>
                      <span className="ward-name-cell">{ward.wardName}</span>
                    </td>
                    <td className="text-center">
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <AQIBadge value={ward.aqi} />
                      </div>
                    </td>
                    <td className="text-center font-mono text-sm">{ward.pm25}</td>
                    <td className="text-center font-mono text-sm">{ward.pm10}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
