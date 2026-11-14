import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  ShieldAlert, 
  Cpu, 
  BarChart3, 
  Search, 
  BookOpen, 
  Globe2, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Layers, 
  ChevronRight, 
  Send, 
  RefreshCw,
  Sparkles,
  Zap,
  Info,
  Compass,
  Database,
  Rocket
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const API_BASE = "";

export default function App() {
  const [activeTab, setActiveTab] = useState('investigations');
  const [investigations, setInvestigations] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [domain, setDomain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedInv, setSelectedInv] = useState(null);
  const [compareList, setCompareList] = useState([]);

  // Predictive Modeling State
  const [simOxygen, setSimOxygen] = useState(34);
  const [simPressure, setSimPressure] = useState(10.2);
  const [simAirflow, setSimAirflow] = useState(5.0);
  const [simMaterial, setSimMaterial] = useState('thin_fabric');
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // SI Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: "Greetings. I am the Super-Intelligence (SI) Fire Safety Assistant grounded in the NASA Physical Sciences Informatics (PSI) combustion repository. Ask any question regarding microgravity flame dynamics, cool flames, smoke particle agglomeration, or Artemis lunar exploration atmosphere hazards.",
      citations: []
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, rankRes, domRes] = await Promise.all([
        fetch(`${API_BASE}/api/investigations`),
        fetch(`${API_BASE}/api/rankings`),
        fetch(`${API_BASE}/api/domain`)
      ]);

      if (!invRes.ok || !rankRes.ok || !domRes.ok) {
        throw new Error(`Data service responded with status: ${invRes.status}/${rankRes.status}/${domRes.status}`);
      }

      const invData = await invRes.json();
      const rankData = await rankRes.json();
      const domData = await domRes.json();
      setInvestigations(invData);
      setRankings(rankData);
      setDomain(domData);
      if (invData.length > 0) {
        setSelectedInv(invData[0]);
        setCompareList([invData[0].id, invData[1]?.id || invData[0].id]);
      }
    } catch (err) {
      console.error("Failed to load backend data:", err);
      setError(err.message || "Could not reach the data service — check the backend container or connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Run simulation whenever params change
  useEffect(() => {
    async function runSim() {
      setSimLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/predict/flammability`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oxygen_pct: parseFloat(simOxygen),
            pressure_psi: parseFloat(simPressure),
            airflow_cm_s: parseFloat(simAirflow),
            material: simMaterial
          })
        });
        const data = await res.json();
        setSimResult(data);
      } catch (e) {
        console.error("Simulation error:", e);
      } finally {
        setSimLoading(false);
      }
    }
    runSim();
  }, [simOxygen, simPressure, simAirflow, simMaterial]);

  // Handle SI Query
  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userQ = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userQ }]);
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/si/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQ })
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer,
          citations: data.citations || []
        }
      ]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "Encountered communication error with the SI engine. Please verify the backend service status.",
          citations: []
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Filter investigations
  const filteredInvs = investigations.filter(inv => {
    const matchesCat = filterCategory === 'all' || inv.category === filterCategory;
    const matchesSearch = !searchQuery || 
      inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.objectives.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.fuels.materials.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const toggleCompare = (id) => {
    if (compareList.includes(id)) {
      setCompareList(compareList.filter(item => item !== id));
    } else {
      if (compareList.length < 3) {
        setCompareList([...compareList, id]);
      }
    }
  };

  // Prepare comparison data for charts
  const comparedInvestigations = investigations.filter(inv => compareList.includes(inv.id));
  const chartData = comparedInvestigations.map(inv => ({
    name: inv.name,
    maxOxygen: Math.max(...inv.test_conditions.oxygen_concentration_pct),
    minOxygen: Math.min(...inv.test_conditions.oxygen_concentration_pct),
    maxFlow: Math.max(...inv.test_conditions.airflow_speed_cm_s),
    relevance: inv.relevance_score
  }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. HERO / LANDING SECTION */}
      <div 
        className="hero-container"
        style={{
          position: 'relative',
          height: '240px',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          background: '#070b13'
        }}
      >
        {/* Background Image with Dark Vignette & Gradient Overlay */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('/images/hero_flame.jpg')`,
            backgroundPosition: 'center 40%',
            backgroundSize: 'cover',
            opacity: 0.38,
            filter: 'brightness(0.9) contrast(1.15)'
          }}
        />
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(7, 11, 19, 0.96) 20%, rgba(14, 21, 38, 0.8) 60%, rgba(7, 11, 19, 0.95) 100%)'
          }}
        />

        {/* Hero Content */}
        <div 
          className="hero-content"
          style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '1600px',
            margin: '0 auto',
            width: '100%',
            padding: '0 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
              <span className="badge" style={{ background: 'rgba(0, 229, 255, 0.2)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 229, 255, 0.4)' }}>
                NASA SPACE APPS CHALLENGE 2026
              </span>
              <span className="badge" style={{ background: 'rgba(255, 112, 67, 0.15)', color: 'var(--accent-orange)', border: '1px solid rgba(255, 112, 67, 0.3)' }}>
                PHYSICAL SCIENCES INFORMATICS (PSI)
              </span>
            </div>
            <h1 className="font-heading" style={{ fontSize: '2.4rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em', textShadow: '0 0 25px rgba(0, 229, 255, 0.3)' }}>
              FLAME IN FREEFALL
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '750px', lineHeight: '1.4', marginTop: '0.3rem' }}>
              Super-Intelligence (SI) Powered Fire Safety Intelligence from NASA Microgravity Combustion Research
            </p>
          </div>

          {/* Quick Mission Telemetry Badge */}
          <div style={{
            background: 'rgba(14, 21, 38, 0.75)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '0.9rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            minWidth: '220px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase' }}>Acceleration Level</span>
              <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>10⁻⁶ g (0-g)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase' }}>Exploration Target</span>
              <span className="font-mono" style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>34% O₂ / 10.2 psi</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase' }}>Platform Status</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e676', display: 'inline-block' }} />
                <span className="font-mono" style={{ color: '#00e676', fontWeight: 600 }}>TELEMETRY LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <header style={{
        background: 'rgba(14, 21, 38, 0.92)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.65rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)'
      }}>
        {/* Navigation Tabs */}
        <nav className="nav-tabs-container" style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'investigations', label: 'Investigations', icon: BookOpen },
            { id: 'compare', label: 'Cross-Analysis', icon: BarChart3 },
            { id: 'rankings', label: 'Crew Safety Ranking', icon: ShieldAlert },
            { id: 'modeler', label: 'Predictive Modeler', icon: Sliders },
            { id: 'assistant', label: 'SI Assistant', icon: Sparkles },
            { id: 'spinoffs', label: 'Earth & History', icon: Globe2 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={isActive ? 'tab-button-active' : 'tab-button-inactive'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  fontWeight: 600
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Live Rig Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace' }}>
          <span style={{ color: 'var(--text-dim)' }}>PAYLOADS:</span>
          <span style={{ color: 'var(--accent-cyan)' }}>CIR</span>
          <span style={{ color: 'var(--text-dim)' }}>•</span>
          <span style={{ color: 'var(--accent-blue)' }}>MSG</span>
          <span style={{ color: 'var(--text-dim)' }}>•</span>
          <span style={{ color: 'var(--accent-orange)' }}>CYGNUS SAFFIRE</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '1.8rem 2rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--accent-cyan)' }}>
            <RefreshCw className="animate-spin" size={28} />
            <span className="font-mono">Loading NASA PSI Flight Data & Synthesis Models...</span>
          </div>
        ) : error ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '60vh', 
            gap: '1.2rem', 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--accent-orange)', 
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <AlertTriangle size={48} color="var(--accent-orange)" />
            <h2 className="font-heading" style={{ fontSize: '1.3rem', color: '#fff' }}>
              Connection to NASA Data Service Unavailable
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {error}
            </p>
            <button
              onClick={loadData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.7rem 1.4rem',
                background: 'var(--accent-cyan)',
                color: '#070b13',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} />
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* TAB 1: INVESTIGATIONS BROWSER */}
            {activeTab === 'investigations' && (
              <div className="investigations-grid" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', height: 'calc(100vh - 350px)' }}>
                {/* Left Sidebar List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-surface)', padding: '1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                    <input
                      type="text"
                      placeholder="Search fuel, hardware, or project..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.6rem 0.65rem 2.4rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {['all', 'solid_flammability', 'smoke_detection', 'liquid_droplet_suppression', 'cool_flames_suppression', 'large_scale_fire_safety'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.28rem 0.55rem',
                          borderRadius: '4px',
                          border: '1px solid',
                          borderColor: filterCategory === cat ? 'var(--accent-cyan)' : 'var(--border-color)',
                          background: filterCategory === cat ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                          color: filterCategory === cat ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {cat.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Scrollable Investigation Items */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingRight: '0.3rem' }}>
                    {filteredInvs.map(inv => {
                      const isSelected = selectedInv?.id === inv.id;
                      return (
                        <div
                          key={inv.id}
                          onClick={() => setSelectedInv(inv)}
                          style={{
                            padding: '0.9rem',
                            borderRadius: '8px',
                            background: isSelected ? 'var(--bg-card)' : 'rgba(14, 21, 38, 0.5)',
                            border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <span className="font-heading" style={{ fontWeight: 700, color: isSelected ? 'var(--accent-cyan)' : '#fff', fontSize: '0.95rem' }}>
                              {inv.name}
                            </span>
                            <span className="badge" style={{ background: 'rgba(41, 121, 255, 0.15)', color: 'var(--accent-blue)', fontSize: '0.68rem' }}>
                              SCORE: {inv.relevance_score}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem', lineHeight: '1.3' }}>
                            {inv.full_name}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
                            <span>{inv.hardware.split('/')[0]}</span>
                            <span>{inv.dates}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Detail Pane with Image Banner */}
                {selectedInv ? (
                  <div style={{ background: 'var(--bg-surface)', padding: '1.6rem', borderRadius: '10px', border: '1px solid var(--border-color)', overflowY: 'auto' }}>
                    
                    {/* Header Image Banner for Investigation */}
                    <div style={{
                      position: 'relative',
                      height: '140px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      marginBottom: '1.4rem',
                      border: '1px solid var(--border-color)',
                      background: '#070b13'
                    }}>
                      <img 
                        src={selectedInv.hero_image || '/images/cir_rack.jpg'} 
                        alt={selectedInv.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          opacity: 0.65,
                          filter: 'brightness(0.9) contrast(1.1)'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(14, 21, 38, 0.95) 0%, rgba(14, 21, 38, 0.3) 100%)'
                      }} />
                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                      }}>
                        <span className="badge" style={{ background: 'rgba(0, 229, 255, 0.25)', color: '#fff', border: '1px solid rgba(0, 229, 255, 0.4)' }}>
                          FACILITY RIG: {selectedInv.hardware}
                        </span>
                        <span className="badge" style={{ background: 'rgba(0, 0, 0, 0.6)', color: 'var(--text-muted)' }}>
                          PLATFORM: {selectedInv.flight_platform}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.2rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                          <h2 className="font-heading" style={{ fontSize: '1.7rem', color: '#fff', fontWeight: 700 }}>
                            {selectedInv.name}
                          </h2>
                          <span className="badge" style={{ background: 'rgba(0, 229, 255, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                            {selectedInv.category.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                          {selectedInv.full_name}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => toggleCompare(selectedInv.id)}
                          style={{
                            padding: '0.5rem 0.9rem',
                            borderRadius: '6px',
                            border: '1px solid var(--accent-cyan)',
                            background: compareList.includes(selectedInv.id) ? 'var(--accent-cyan)' : 'transparent',
                            color: compareList.includes(selectedInv.id) ? '#070b13' : 'var(--accent-cyan)',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem'
                          }}
                        >
                          <BarChart3 size={15} />
                          {compareList.includes(selectedInv.id) ? 'Added to Compare' : '+ Compare'}
                        </button>
                      </div>
                    </div>

                    {/* Operational Highlights Card */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ background: 'var(--bg-card)', padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Hardware Rig</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>{selectedInv.hardware}</div>
                      </div>
                      <div style={{ background: 'var(--bg-card)', padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>O₂ Concentration Range</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-cyan)', marginTop: '0.2rem', fontFamily: 'JetBrains Mono, monospace' }}>
                          {Math.min(...selectedInv.test_conditions.oxygen_concentration_pct)}% - {Math.max(...selectedInv.test_conditions.oxygen_concentration_pct)}% O₂
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-card)', padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Airflow Velocity Range</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-orange)', marginTop: '0.2rem', fontFamily: 'JetBrains Mono, monospace' }}>
                          {Math.min(...selectedInv.test_conditions.airflow_speed_cm_s)} to {Math.max(...selectedInv.test_conditions.airflow_speed_cm_s)} cm/s
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-card)', padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pressure Matrix</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', marginTop: '0.2rem', fontFamily: 'JetBrains Mono, monospace' }}>
                          {selectedInv.test_conditions.pressure_psi.join(', ')} psi
                        </div>
                      </div>
                    </div>

                    {/* Experimental Objectives */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 className="font-heading" style={{ fontSize: '1rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
                        Experimental Objectives
                      </h3>
                      <p style={{ color: 'var(--text-main)', lineHeight: '1.6', fontSize: '0.9rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        {selectedInv.objectives}
                      </p>
                    </div>

                    {/* Fuels, Burner Geometry & Sensors */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
                      <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h4 className="font-heading" style={{ fontSize: '0.9rem', color: 'var(--accent-orange)', marginBottom: '0.6rem' }}>
                          Tested Fuels & Sample Geometry
                        </h4>
                        <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                          <strong style={{ color: '#fff' }}>Fuel Classification:</strong> {selectedInv.fuels.type}
                        </div>
                        <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                          <strong style={{ color: '#fff' }}>Materials:</strong> {selectedInv.fuels.materials.join(', ')}
                        </div>
                        <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                          <strong style={{ color: '#fff' }}>Geometry:</strong> {selectedInv.fuels.geometry}
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h4 className="font-heading" style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', marginBottom: '0.6rem' }}>
                          Sensors & Measurement Diagnostics
                        </h4>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          {selectedInv.sensors_and_measurements.map((sensor, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>{sensor}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Key Findings & Fire Safety Relevance */}
                    <div style={{ background: 'rgba(0, 229, 255, 0.05)', border: '1px solid rgba(0, 229, 255, 0.2)', padding: '1.2rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                      <h4 className="font-heading" style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Zap size={16} /> Key Scientific Discoveries
                      </h4>
                      <p style={{ fontSize: '0.88rem', lineHeight: '1.6', color: '#fff' }}>
                        {selectedInv.key_findings}
                      </p>
                    </div>

                    {/* Prevention, Detection, Suppression Grid */}
                    <h3 className="font-heading" style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.8rem' }}>
                      Actionable Fire-Safety Application Matrix
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                      <div style={{ background: 'var(--bg-card)', padding: '0.9rem', borderRadius: '8px', borderTop: '3px solid #00e676' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00e676', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                          1. Prevention & Materials
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {selectedInv.fire_safety_relevance.prevention}
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-card)', padding: '0.9rem', borderRadius: '8px', borderTop: '3px solid #ff7043' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ff7043', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                          2. Detection Optics
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {selectedInv.fire_safety_relevance.detection}
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-card)', padding: '0.9rem', borderRadius: '8px', borderTop: '3px solid #2979ff' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2979ff', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                          3. Suppression Protocols
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {selectedInv.fire_safety_relevance.suppression}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                    Select an investigation to inspect telemetry and findings
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CROSS-ANALYSIS & COMPARISON */}
            {activeTab === 'compare' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 className="font-heading" style={{ fontSize: '1.2rem', color: '#fff' }}>Cross-Investigation Analysis Matrix</h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Comparing flight conditions, oxidizer limits, forced flow vectors, and crew safety relevance scores.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {investigations.map(inv => (
                      <button
                        key={inv.id}
                        onClick={() => toggleCompare(inv.id)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '4px',
                          border: '1px solid',
                          borderColor: compareList.includes(inv.id) ? 'var(--accent-cyan)' : 'var(--border-color)',
                          background: compareList.includes(inv.id) ? 'rgba(0, 229, 255, 0.2)' : 'transparent',
                          color: compareList.includes(inv.id) ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {inv.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comparative Charts */}
                <div className="compare-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div style={{ background: 'var(--bg-surface)', padding: '1.4rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <h3 className="font-heading" style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', marginBottom: '1rem' }}>
                      Tested Oxygen Range (% O₂) Across Investigations
                    </h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e2e4f" />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" domain={[0, 100]} />
                          <Tooltip contentStyle={{ background: '#0e1526', borderColor: '#1e2e4f', color: '#fff' }} />
                          <Legend />
                          <Bar dataKey="maxOxygen" name="Max % O₂ Tested" fill="#00e5ff" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="minOxygen" name="Min % O₂ Tested" fill="#2979ff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '1.4rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <h3 className="font-heading" style={{ fontSize: '0.95rem', color: 'var(--accent-orange)', marginBottom: '1rem' }}>
                      Forced Airflow Speeds (cm/s) & Crew Safety Score
                    </h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e2e4f" />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip contentStyle={{ background: '#0e1526', borderColor: '#1e2e4f', color: '#fff' }} />
                          <Legend />
                          <Bar dataKey="maxFlow" name="Max Airflow (cm/s)" fill="#ff7043" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="relevance" name="Relevance Score" fill="#00e676" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Direct Comparison Table */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '0.9rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.75rem' }}>Feature / Dimension</th>
                        {comparedInvestigations.map(inv => (
                          <th key={inv.id} style={{ padding: '0.9rem', color: 'var(--accent-cyan)' }}>{inv.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.85rem', fontWeight: 600, color: '#fff' }}>Flight Rig & Platform</td>
                        {comparedInvestigations.map(inv => (
                          <td key={inv.id} style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>{inv.hardware}</td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.85rem', fontWeight: 600, color: '#fff' }}>Fuel Material Phase</td>
                        {comparedInvestigations.map(inv => (
                          <td key={inv.id} style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>{inv.fuels.type}</td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.85rem', fontWeight: 600, color: '#fff' }}>Pressure Regimes</td>
                        {comparedInvestigations.map(inv => (
                          <td key={inv.id} style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>{inv.test_conditions.pressure_psi.join(', ')} psi</td>
                        ))}
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.85rem', fontWeight: 600, color: '#fff' }}>Extinction Mechanism</td>
                        {comparedInvestigations.map(inv => (
                          <td key={inv.id} style={{ padding: '0.85rem', color: 'var(--text-muted)' }}>{inv.fire_safety_relevance.suppression}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: CREW SAFETY RELEVANCE RANKING */}
            {activeTab === 'rankings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <h2 className="font-heading" style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '0.3rem' }}>
                    Transparent Habitable Crew Environment Relevance Ranking
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Rankings are determined by our transparent multi-variable formula: directly weighting applicability to pressurized crew modules (30%), exploration atmosphere testing at 10.2 psi / elevated O₂ (30%), early smoke detection reliability (20%), and actionable suppression protocols (20%).
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {rankings.map((item, index) => (
                    <div
                      key={item.id}
                      className="ranking-card-grid"
                      style={{
                        background: 'var(--bg-surface)',
                        padding: '1.2rem',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        display: 'grid',
                        gridTemplateColumns: '60px 180px 1fr 140px',
                        alignItems: 'center',
                        gap: '1.2rem'
                      }}
                    >
                      <div className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 700, color: index < 3 ? 'var(--accent-cyan)' : 'var(--text-dim)' }}>
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-heading" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {item.hardware.split('/')[0]}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '0.3rem' }}>
                          {item.relevance_explanation}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {item.crew_environments.map((env, i) => (
                            <span key={i} className="badge" style={{ background: 'rgba(255, 112, 67, 0.15)', color: 'var(--accent-orange)', fontSize: '0.65rem' }}>
                              {env}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="font-heading" style={{ fontSize: '1.5rem', fontWeight: 700, color: index < 3 ? 'var(--accent-cyan)' : '#fff' }}>
                          {item.relevance_score}
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>/100</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>RELEVANCE SCORE</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: PREDICTIVE FLAMMABILITY MODELER */}
            {activeTab === 'modeler' && (
              <div className="modeler-grid" style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '1.5rem' }}>
                {/* Modeler Controls */}
                <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                    <h3 className="font-heading" style={{ fontSize: '1.1rem', color: '#fff' }}>Environmental Flight Inputs</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calibrated on NASA BASS-II, ACME-BRE and Saffire flight parameters.</p>
                  </div>

                  {/* Material selection */}
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                      Material Specimen
                    </label>
                    <select
                      value={simMaterial}
                      onChange={e => setSimMaterial(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.85rem'
                      }}
                    >
                      <option value="thin_fabric">Cotton / Fiberglass Blend (Sibal Cloth)</option>
                      <option value="thick_pmma">Cast Acrylic Plastic (PMMA Slab)</option>
                      <option value="wire_insulation">Kapton / Teflon Wire Jacketing</option>
                      <option value="silicone">Silicone Rubber / Sealant</option>
                    </select>
                  </div>

                  {/* Oxygen Concentration Slider */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: '#fff' }}>Oxygen Mole Fraction (O₂)</span>
                      <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{simOxygen}%</span>
                    </div>
                    <input
                      type="range"
                      min="14"
                      max="85"
                      step="1"
                      value={simOxygen}
                      onChange={e => setSimOxygen(e.target.value)}
                      style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                      <span>14% (Extinction)</span>
                      <span>21% (ISS/Earth)</span>
                      <span>34% (Moon Hab)</span>
                      <span>85% (EVA)</span>
                    </div>
                  </div>

                  {/* Pressure Slider */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: '#fff' }}>Cabin Pressure (P)</span>
                      <span className="font-mono" style={{ color: 'var(--accent-orange)' }}>{simPressure} psi ({Math.round(simPressure * 6.894)} kPa)</span>
                    </div>
                    <input
                      type="range"
                      min="4.3"
                      max="14.7"
                      step="0.1"
                      value={simPressure}
                      onChange={e => setSimPressure(e.target.value)}
                      style={{ width: '100%', accentColor: 'var(--accent-orange)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                      <span>4.3 psi (Spacesuit)</span>
                      <span>8.2 psi (Orion)</span>
                      <span>10.2 psi (Lunar Base)</span>
                      <span>14.7 psi (1 atm)</span>
                    </div>
                  </div>

                  {/* Airflow Velocity Slider */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: '#fff' }}>Forced Ventilation Airflow</span>
                      <span className="font-mono" style={{ color: 'var(--accent-green)' }}>{simAirflow} cm/s</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="35"
                      step="0.5"
                      value={simAirflow}
                      onChange={e => setSimAirflow(e.target.value)}
                      style={{ width: '100%', accentColor: 'var(--accent-green)' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                      <span>0 cm/s (Quiescent)</span>
                      <span>5-10 cm/s (Nominal Vent)</span>
                      <span>35 cm/s (High Duct)</span>
                    </div>
                  </div>

                  {/* Preset Buttons */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Quick Mission Environment Presets
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      <button
                        onClick={() => { setSimOxygen(21); setSimPressure(14.7); setSimAirflow(8); }}
                        style={{ padding: '0.4rem', fontSize: '0.72rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        ISS Nominal
                      </button>
                      <button
                        onClick={() => { setSimOxygen(34); setSimPressure(10.2); setSimAirflow(5); }}
                        style={{ padding: '0.4rem', fontSize: '0.72rem', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Artemis Lunar Base
                      </button>
                      <button
                        onClick={() => { setSimOxygen(100); setSimPressure(4.3); setSimAirflow(2); }}
                        style={{ padding: '0.4rem', fontSize: '0.72rem', background: 'rgba(255, 61, 0, 0.1)', border: '1px solid var(--accent-flame)', color: 'var(--accent-flame)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        EVA Spacesuit
                      </button>
                      <button
                        onClick={() => { setSimOxygen(15); setSimPressure(10.2); setSimAirflow(0); }}
                        style={{ padding: '0.4rem', fontSize: '0.72rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Quiescent / Vented
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modeler Output Display */}
                {simResult && (
                  <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 className="font-heading" style={{ fontSize: '1.3rem', color: '#fff' }}>
                          Microgravity Combustion Simulation Output
                        </h2>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Simulating {simResult.inputs.material} at {simResult.inputs.oxygen_pct}% O₂, {simResult.inputs.pressure_psi} psi, and {simResult.inputs.airflow_cm_s} cm/s
                        </div>
                      </div>
                      <span className="badge" style={{
                        background: simResult.predictions.will_ignite_and_propagate ? 'rgba(255, 61, 0, 0.2)' : 'rgba(0, 230, 118, 0.2)',
                        color: simResult.predictions.will_ignite_and_propagate ? 'var(--accent-flame)' : 'var(--accent-green)',
                        border: `1px solid ${simResult.predictions.will_ignite_and_propagate ? 'var(--accent-flame)' : 'var(--accent-green)'}`,
                        fontSize: '0.8rem',
                        padding: '0.35rem 0.8rem'
                      }}>
                        {simResult.predictions.hazard_level}
                      </span>
                    </div>

                    {/* Metric Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                      <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Limiting O₂ Conc. (LOC)</div>
                        <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '0.3rem' }}>
                          {simResult.predictions.limiting_oxygen_concentration_loc}%
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Extinction threshold</div>
                      </div>

                      <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Flame Spread Rate</div>
                        <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-orange)', marginTop: '0.3rem' }}>
                          {simResult.predictions.flame_spread_rate_mm_s} <span style={{ fontSize: '0.8rem' }}>mm/s</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Concurrent / Opposed flow</div>
                      </div>

                      <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Relative Soot Yield</div>
                        <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e040fb', marginTop: '0.3rem' }}>
                          {simResult.predictions.relative_soot_yield_factor}x
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Normalized vs Earth 1g</div>
                      </div>

                      <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Risk Index Score</div>
                        <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: simResult.predictions.risk_index_score > 70 ? 'var(--accent-flame)' : 'var(--accent-green)', marginTop: '0.3rem' }}>
                          {simResult.predictions.risk_index_score} <span style={{ fontSize: '0.8rem' }}>/100</span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Crew vulnerability index</div>
                      </div>
                    </div>

                    {/* Operational Recommendation Alert Box */}
                    <div style={{
                      background: 'rgba(14, 21, 38, 0.8)',
                      padding: '1.2rem',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${simResult.predictions.will_ignite_and_propagate ? 'var(--accent-flame)' : 'var(--accent-green)'}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: 600, color: '#fff' }}>
                        {simResult.predictions.will_ignite_and_propagate ? <AlertTriangle color="var(--accent-flame)" size={18} /> : <CheckCircle2 color="var(--accent-green)" size={18} />}
                        Automated Fire Suppression Protocol & Engineering Guidance
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        {simResult.engineering_guidance}
                      </p>
                    </div>

                    {/* Physics Explanation Callout */}
                    <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <h4 className="font-heading" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '0.4rem' }}>
                        Why this happens in microgravity:
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        At {simResult.inputs.airflow_cm_s} cm/s airflow, natural buoyant upward drafting is absent. The flame relies on forced convective oxidizer feed from cabin ventilation fans. Under Artemis exploration atmospheres (34% O₂ at 10.2 psi), combustion kinetics are accelerated while radiative losses are reduced, sustaining flame propagation over materials that would self-extinguish under normal terrestrial testing.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: SUPER-INTELLIGENCE (SI) ASSISTANT */}
            {activeTab === 'assistant' && (
              <div className="assistant-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', height: 'calc(100vh - 350px)' }}>
                {/* Chat Stream Window */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Sparkles size={18} color="var(--accent-cyan)" />
                      <span className="font-heading" style={{ fontWeight: 700, color: '#fff' }}>NASA Super-Intelligence Fire Safety Q&A</span>
                    </div>
                    <span className="badge" style={{ background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)' }}>
                      RAG-GROUNDED IN PSI DATA
                    </span>
                  </div>

                  {/* Message History */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          background: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-card)',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                          color: '#fff'
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', color: msg.role === 'user' ? '#bbdefb' : 'var(--accent-cyan)', marginBottom: '0.3rem', fontWeight: 600 }}>
                          {msg.role === 'user' ? 'AEROSPACE RESEARCHER' : 'NASA SI SYSTEM'}
                        </div>
                        <div style={{ fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                          {msg.text}
                        </div>
                        {msg.citations && msg.citations.length > 0 && (
                          <div style={{ marginTop: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.6rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                              Primary NASA Data Citations:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {msg.citations.map((c, i) => (
                                <div key={i} style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono, monospace' }}>
                                  • {c.citation_text} [Score: {c.relevance_score}]
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {chatLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontSize: '0.85rem' }}>
                        <RefreshCw size={16} className="animate-spin" />
                        Synthesizing PSI records and calculating flammability thresholds...
                      </div>
                    )}
                  </div>

                  {/* Input Box */}
                  <form onSubmit={handleSendChat} style={{ padding: '0.8rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.6rem' }}>
                    <input
                      type="text"
                      placeholder="Ask about microgravity flame spread, cool flames, SAME smoke detection, or Apollo/Mir..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.7rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.88rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={chatLoading}
                      style={{
                        padding: '0.7rem 1.2rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--accent-cyan)',
                        color: '#070b13',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Send size={16} />
                      Send
                    </button>
                  </form>
                </div>

                {/* Right Prompts & Quick Questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <h4 className="font-heading" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '0.8rem' }}>
                      Recommended Technical Inquiries
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {[
                        "How do cool flames behave and why do they pose an invisible hazard?",
                        "Why does smoke in microgravity trick terrestrial optical smoke detectors?",
                        "What makes Artemis Moon Base atmospheres (34% O2 at 10.2 psi) so dangerous?",
                        "What happened during the 1997 Mir fire and what did it teach us?",
                        "How does turning off ventilation fans extinguish fires in microgravity?"
                      ].map((promptText, i) => (
                        <button
                          key={i}
                          onClick={() => { setChatInput(promptText); }}
                          style={{
                            textAlign: 'left',
                            padding: '0.6rem',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            color: 'var(--text-muted)',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <h4 className="font-heading" style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '0.5rem' }}>
                      Configurable LLM Provider
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                      The backend auto-detects `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or operates in full offline Grounded SI Synthesis mode with 100% data integrity.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: EARTH SPINOFFS & HISTORICAL INCIDENTS */}
            {activeTab === 'spinoffs' && domain && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                
                {/* Historical Lessons Section with Mission Thumbnails */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <Rocket color="var(--accent-orange)" size={22} />
                    <h2 className="font-heading" style={{ fontSize: '1.35rem', color: '#fff' }}>
                      Historical Spaceflight Fire Incidents & Lessons Learned
                    </h2>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
                    Every combustion experiment in PSI directly traces its origin to lessons learned from near-fatal or catastrophic spaceflight fires.
                  </p>
                  
                  <div className="spinoffs-incident-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.4rem' }}>
                    {domain.historical_incidents.map((inc, i) => (
                      <div key={i} style={{ 
                        background: 'var(--bg-surface)', 
                        borderRadius: '10px', 
                        border: '1px solid var(--border-color)', 
                        overflow: 'hidden',
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.2s ease, border-color 0.2s ease'
                      }}>
                        {/* Thumbnail Image Header */}
                        <div style={{ height: '140px', position: 'relative', overflow: 'hidden', background: '#0a0f1d' }}>
                          <img 
                            src={inc.image || '/images/apollo1.jpg'} 
                            alt={inc.mission}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} 
                          />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(14, 21, 38, 0.95) 0%, transparent 60%)'
                          }} />
                          <div style={{ position: 'absolute', bottom: '10px', left: '12px' }}>
                            <span className="font-heading" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-orange)' }}>
                              {inc.mission}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                              {inc.date}
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', flex: 1 }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
                            CREW: {inc.crew}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#fff', lineHeight: '1.45' }}>
                            <strong style={{ color: 'var(--accent-cyan)' }}>Incident:</strong> {inc.incident}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45', marginTop: 'auto', background: 'var(--bg-card)', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <strong style={{ color: '#00e676' }}>Engineering Impact:</strong> {inc.lessons_learned}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Terrestrial Spinoffs Section with Images */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <ShieldAlert color="var(--accent-cyan)" size={22} />
                    <h2 className="font-heading" style={{ fontSize: '1.35rem', color: '#fff' }}>
                      Earth Benefits & Fire Protection Spinoffs
                    </h2>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
                    Technologies engineered for astronaut life support and microgravity fire prevention that now protect millions of lives on Earth.
                  </p>
                  
                  <div className="spinoffs-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.4rem' }}>
                    {domain.earth_spinoffs.map((spin, i) => (
                      <div key={i} style={{ 
                        background: 'var(--bg-surface)', 
                        borderRadius: '10px', 
                        border: '1px solid var(--border-color)', 
                        overflow: 'hidden',
                        display: 'grid',
                        gridTemplateColumns: '160px 1fr'
                      }}>
                        {/* Spinoff Image */}
                        <div style={{ position: 'relative', height: '100%', minHeight: '180px', background: '#0a0f1d' }}>
                          <img 
                            src={spin.image || '/images/firefighter.jpg'} 
                            alt={spin.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
                          />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to right, transparent 50%, var(--bg-surface) 100%)'
                          }} />
                        </div>

                        <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          <h3 className="font-heading" style={{ fontSize: '1.05rem', color: '#fff' }}>{spin.title}</h3>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                            <strong style={{ color: 'var(--text-muted)' }}>NASA Origin:</strong> {spin.nasa_origin}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <strong style={{ color: '#fff' }}>Commercialization:</strong> {spin.commercial_adaptation}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#00e676', lineHeight: '1.4', background: 'rgba(0, 230, 118, 0.06)', padding: '0.6rem', borderRadius: '6px', marginTop: 'auto', border: '1px solid rgba(0, 230, 118, 0.2)' }}>
                            <strong>Terrestrial Impact:</strong> {spin.terrestrial_impact}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </main>

      {/* Global Credibility & Data Sources Section */}
      <section style={{
        background: 'rgba(9, 14, 25, 0.9)',
        borderTop: '1px solid var(--border-color)',
        padding: '1.5rem 2rem',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <Database size={16} color="var(--accent-cyan)" />
              <span className="font-heading" style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                PRIMARY SCIENTIFIC DATA SOURCES & COLLABORATORS
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', maxWidth: '650px', lineHeight: '1.4' }}>
              Ingested from open scientific records published by the NASA Physical Sciences Informatics (PSI) repository, NASA Glenn Research Center Combustion Science Division, and the ISS US National Laboratory.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>NASA PSI</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Physical Sciences Informatics</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>NASA Glenn (GRC)</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Combustion Science Branch</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>ISS National Lab</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>CIR / MSG Flight Payloads</div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Footer */}
      <footer style={{
        background: '#070b13',
        borderTop: '1px solid rgba(30, 46, 79, 0.5)',
        padding: '0.8rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-dim)'
      }}>
        <div>NASA Space Apps 2026 Challenge Entry • "Flame in Freefall" • Physical Sciences Informatics (PSI)</div>
        <div style={{ display: 'flex', gap: '1.2rem' }}>
          <span>NASA-STD-6001 Protocol</span>
          <span>Open Science Data Initiative</span>
          <span>Artemis Fire Safety Task Force</span>
        </div>
      </footer>
    </div>
  );
}
