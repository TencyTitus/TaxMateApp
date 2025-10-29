import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AIAssistant from "../components/AIAssistant";
import { notificationAPI } from "../utils/api";

function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Fallback to localStorage if not authenticated
      try {
        const stored = JSON.parse(localStorage.getItem('notifications') || '[]');
        setItems(stored);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await notificationAPI.getNotifications();
      setItems(response.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      // Update local state
      setItems(items.map(item => 
        item._id === notificationId ? { ...item, isRead: true } : item
      ));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      // Update local state
      setItems(items.filter(item => item._id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return (
    <div className="page-container">
      <Header />
      <main className="page-main">
        <div className="page-content">
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Your recent reminders and system updates.</p>

          {loading ? (
            <p>Loading…</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : items.length === 0 ? (
            <div className="user-dashboard-section">
              <em>No notifications yet.</em>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
              {items.map((n, i) => (
                <li 
                  key={n._id || i} 
                  className="user-dashboard-section" 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    opacity: n.isRead ? 0.6 : 1,
                    borderLeft: n.isRead ? 'none' : '4px solid #6c5ce7'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {n.title || 'Notification'}
                      {!n.isRead && (
                        <span style={{ 
                          background: '#6c5ce7', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px' 
                        }}>
                          New
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#6b7280', marginTop: 4 }}>{n.message || ''}</div>
                    <div style={{ color: '#9ca3af', marginTop: 4, fontSize: '14px' }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : n.date ? new Date(n.date).toLocaleString() : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!n.isRead && n._id && (
                      <button 
                        onClick={() => handleMarkAsRead(n._id)}
                        className="btn-outline"
                        style={{ padding: '6px 12px', fontSize: '14px' }}
                      >
                        Mark as Read
                      </button>
                    )}
                    {n._id && (
                      <button 
                        onClick={() => handleDelete(n._id)}
                        className="btn-outline"
                        style={{ padding: '6px 12px', fontSize: '14px', borderColor: '#dc2626', color: '#dc2626' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
      <AIAssistant />
    </div>
  );
}

export default Notifications;


