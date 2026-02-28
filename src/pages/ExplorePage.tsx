import { useState, useEffect } from 'react';
import { investigationsApi } from '../lib/api/investigations';
import InvestigationCard from '../components/social/InvestigationCard';
import type { InvestigationRow } from '../types';
import { CATEGORY_LABELS } from '../types';
import { Search, TrendingUp } from 'lucide-react';

type SortOption = 'recent' | 'popular' | 'active';

export default function ExplorePage() {
  const [investigations, setInvestigations] = useState<InvestigationRow[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<SortOption>('recent');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvestigations();
  }, [category, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInvestigations = async () => {
    setLoading(true);
    try {
      const data = await investigationsApi.getExplore({ category, sort, search: search || undefined });
      setInvestigations(data as InvestigationRow[]);
    } catch (err) {
      console.error('Failed to load investigations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadInvestigations();
  };

  const categories: { key: string; label: string }[] = [
    { key: 'all', label: 'Toutes' },
    ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
  ];

  const sorts: { key: SortOption; label: string }[] = [
    { key: 'recent', label: 'Récentes' },
    { key: 'popular', label: 'Populaires' },
    { key: 'active', label: 'Actives' },
  ];

  return (
    <div className="explore-page">
      <div className="explore-header">
        <h1><TrendingUp size={24} /> Explorer</h1>
        <p>Découvrez les enquêtes citoyennes en cours</p>
      </div>

      <form className="explore-search" onSubmit={handleSearch}>
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une enquête..."
          />
        </div>
      </form>

      <div className="explore-filters">
        <div className="explore-categories">
          {categories.map(({ key, label }) => (
            <button
              key={key}
              className={`chip ${category === key ? 'active' : ''}`}
              onClick={() => setCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="explore-sorts">
          {sorts.map(({ key, label }) => (
            <button
              key={key}
              className={`chip ${sort === key ? 'active' : ''}`}
              onClick={() => setSort(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="explore-loading">Chargement...</div>
      ) : investigations.length === 0 ? (
        <div className="explore-empty">
          <p>Aucune enquête trouvée pour ces critères.</p>
        </div>
      ) : (
        <div className="investigations-grid">
          {investigations.map((inv) => (
            <InvestigationCard key={inv.id} investigation={inv} />
          ))}
        </div>
      )}
    </div>
  );
}
