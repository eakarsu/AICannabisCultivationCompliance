import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSeedling, FaLeaf, FaBalanceScale, FaChartLine, FaFlask, FaBoxes, FaTasks, FaCut, FaDna, FaRecycle, FaBell } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setStats({
        growRooms: { total: 0, active: 0 },
        plants: { total: 0, stages: {} },
        compliance: { total: 0, compliant: 0 },
        yieldPredictions: { total: 0, avgYield: 0 },
        labTests: { total: 0, passRate: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const gr = stats?.growRooms || stats?.grow_rooms || { total: 0, active: 0 };
  const pl = stats?.plants || { total: 0, stages: {} };
  const co = stats?.compliance || { total: 0, compliant: 0 };
  const yp = stats?.yieldPredictions || stats?.yield_predictions || { total: 0, avgYield: 0, avg_yield: 0 };
  const lt = stats?.labTests || stats?.lab_tests || { total: 0, passRate: 0, pass_rate: 0 };

  const cards = [
    {
      title: 'Grow Rooms',
      icon: <FaSeedling />,
      iconClass: 'green',
      count: gr.total || 0,
      statsText: `${gr.active || 0} active rooms`,
      path: '/grow-rooms',
    },
    {
      title: 'Seed-to-Sale Tracking',
      icon: <FaLeaf />,
      iconClass: 'teal',
      count: pl.total || 0,
      statsText: Object.entries(pl.stages || {}).map(([k, v]) => `${v} ${k}`).join(', ') || 'Track your plants',
      path: '/plants',
    },
    {
      title: 'Regulatory Compliance',
      icon: <FaBalanceScale />,
      iconClass: 'purple',
      count: co.total || 0,
      statsText: `${co.compliant || 0} compliant records`,
      path: '/compliance',
    },
    {
      title: 'Yield Predictions',
      icon: <FaChartLine />,
      iconClass: 'orange',
      count: yp.total || 0,
      statsText: `Avg yield: ${yp.avgYield || yp.avg_yield || 0}g`,
      path: '/yield-predictions',
    },
    {
      title: 'Lab Testing',
      icon: <FaFlask />,
      iconClass: 'blue',
      count: lt.total || 0,
      statsText: `${lt.passRate || lt.pass_rate || 0}% pass rate`,
      path: '/lab-tests',
    },
    {
      title: 'Inventory',
      icon: <FaBoxes />,
      iconClass: 'orange',
      count: stats?.inventory_summary?.total || 0,
      statsText: `${stats?.inventory_summary?.low_stock || 0} items low stock`,
      path: '/inventory',
    },
    {
      title: 'Tasks',
      icon: <FaTasks />,
      iconClass: 'blue',
      count: stats?.tasks_summary?.total || 0,
      statsText: `${stats?.tasks_summary?.pending || 0} pending tasks`,
      path: '/tasks',
    },
    {
      title: 'Harvests',
      icon: <FaCut />,
      iconClass: 'green',
      count: stats?.harvests_summary?.total || 0,
      statsText: `${stats?.harvests_summary?.processing || 0} in processing`,
      path: '/harvests',
    },
    {
      title: 'Strain Library',
      icon: <FaDna />,
      iconClass: 'purple',
      count: stats?.strains_count || 0,
      statsText: 'Genetic catalog',
      path: '/strains',
    },
    {
      title: 'Waste Tracking',
      icon: <FaRecycle />,
      iconClass: 'teal',
      count: stats?.waste_records_count || 0,
      statsText: 'Disposal records',
      path: '/waste-records',
    },
    {
      title: 'Alerts',
      icon: <FaBell />,
      iconClass: 'orange',
      count: stats?.alerts_summary?.active || 0,
      statsText: 'Active environmental alerts',
      path: '/environmental-alerts',
    },
  ];

  return (
    <div className="fade-in">
      <div className="dashboard-welcome">
        <h1>Welcome back, {user.name || user.email || 'Operator'}</h1>
        <p>Here is an overview of your cannabis cultivation operations.</p>
      </div>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <div
            key={card.title}
            className="dashboard-card"
            onClick={() => navigate(card.path)}
          >
            <div className={`dashboard-card-icon ${card.iconClass}`}>
              {card.icon}
            </div>
            <div className="dashboard-card-title">{card.title}</div>
            <div className="dashboard-card-count">{card.count}</div>
            <div className="dashboard-card-stats">{card.statsText}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
