import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { investigationsApi } from '../lib/api/investigations';
import { isSupabaseConfigured } from '../lib/supabase';
import InvestigationCard from '../components/social/InvestigationCard';
import type { InvestigationRow } from '../types';
import {
  Plus,
  Search,
  Compass,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';

type Tab = 'mine' | 'shared' | 'starred';

export default function HomePage() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('mine');
  const [investigations, setInvestigations] = useState<InvestigationRow[]>([]);
  const [trending, setTrending] = useState<InvestigationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    loadInvestigations();
    loadTrending();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadInvestigations = async () => {
    setLoading(true);
    try {
      const data = await investigationsApi.list(activeTab);
      setInvestigations(data as InvestigationRow[]);
    } catch (err) {
      console.error('Failed to load investigations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTrending = async () => {
    try {
      const data = await investigationsApi.getTrending();
      setTrending(data as InvestigationRow[]);
    } catch (err) {
      console.error('Failed to load trending:', err);
    }
  };

  const handleCreate = async () => {
    if (!configured) {
      navigate('/work');
      return;
    }
    try {
      const inv = await investigationsApi.create({
        name: 'Nouvelle enquête',
        description: '',
        visibility: 'public',
      });
      navigate(`/investigation/${inv.id}/work`);
    } catch (err) {
      console.error('Failed to create investigation:', err);
    }
  };

  if (!configured) {
    return (
      <div className="home-page">
        <div className="home-header">
          <div className="home-welcome">
            <h1>Bienvenue sur Enquetor</h1>
            <p>Mode local — Supabase non configuré</p>
          </div>
        </div>
        <div className="home-offline-cta">
          <p>Vous utilisez Enquetor en mode hors-ligne. Vos données sont stockées localement.</p>
          <Link to="/work" className="btn btn-primary">
            <Search size={16} />
            Ouvrir l'éditeur d'enquête
          </Link>
        </div>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'mine', label: 'Mes enquêtes', icon: <Search size={16} /> },
    { key: 'shared', label: 'Partagées', icon: <Users size={16} /> },
    { key: 'starred', label: 'Favoris', icon: <Star size={16} /> },
  ];

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="home-welcome">
          <h1>Bonjour, {profile?.display_name || 'Enquêteur'}</h1>
          <p>Prêt à enquêter ?</p>
        </div>
        <div className="home-actions">
          <Link to="/explore" className="btn btn-outline">
            <Compass size={16} />
            Explorer
          </Link>
          <button onClick={handleCreate} className="btn btn-primary">
            <Plus size={16} />
            Nouvelle enquête
          </button>
        </div>
      </div>

      {trending.length > 0 && (
        <section className="home-trending">
          <h2><TrendingUp size={18} /> Tendances</h2>
          <div className="trending-grid">
            {trending.map((inv) => (
              <InvestigationCard key={inv.id} investigation={inv} compact />
            ))}
          </div>
        </section>
      )}

      <section className="home-investigations">
        <div className="home-tabs">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`home-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="home-loading">Chargement...</div>
        ) : investigations.length === 0 ? (
          <div className="home-empty">
            <p>Aucune enquête trouvée.</p>
            {activeTab === 'mine' && (
              <button onClick={handleCreate} className="btn btn-primary">
                <Plus size={16} /> Créer ma première enquête
              </button>
            )}
          </div>
        ) : (
          <div className="investigations-grid">
            {investigations.map((inv) => (
              <InvestigationCard key={inv.id} investigation={inv} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
