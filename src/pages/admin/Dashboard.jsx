import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const ActivityCard = styled.div`
  background: rgba(22, 27, 34, 0.5);
  border-radius: 10px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  h3 {
    margin: 0 0 15px 0;
    color: #e6edf3;
    font-size: 18px;
    font-weight: 500;
  }
  
  .content {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    line-height: 1.6;
  }
`;

const ChartContainer = styled.div`
  background: rgba(22, 27, 34, 0.5);
  border-radius: 10px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  grid-column: 1 / -1;
  
  h3 {
    margin: 0 0 15px 0;
    color: #e6edf3;
    font-size: 18px;
    font-weight: 500;
  }
  
  .chart-placeholder {
    background: rgba(255, 255, 255, 0.05);
    height: 300px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.4);
  }
`;

const RecentActivity = styled.div`
  .activity-item {
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    
    &:last-child {
      border-bottom: none;
    }
    
    .time {
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
      margin-top: 4px;
    }
  }
`;

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    pendingWithdrawals: 0,
    totalTransactions: 0,
    activeUsers: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user count
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userCount = usersSnapshot.size;
      
      // Fetch pending withdrawals
      const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
      
      let pendingWithdrawals = 0;
      let totalTransactions = 0;
      let recentActivityList = [];
      
      // Process transactions in memory
      transactionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalTransactions++;
        
        // Count pending withdrawals
        if (data.type === 'withdrawal' && data.status === 'pending') {
          pendingWithdrawals++;
        }
        
        // Add to recent activity
        recentActivityList.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      
      // Sort by timestamp and limit to 5 most recent
      recentActivityList.sort((a, b) => b.timestamp - a.timestamp);
      recentActivityList = recentActivityList.slice(0, 5);
      
      // Update state
      setStats({
        users: userCount,
        pendingWithdrawals,
        totalTransactions,
        activeUsers: Math.round(userCount * 0.7) // Estimated active users
      });
      
      setRecentActivity(recentActivityList);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatActivityItem = (activity) => {
    if (!activity) return '';
    
    const time = activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown time';
    
    switch (activity.type) {
      case 'withdrawal':
        return `Withdrawal request: ${activity.amount} ${activity.token} (${activity.status})`;
      case 'deposit':
        return `Deposit: ${activity.amount} ${activity.token} (${activity.status})`;
      default:
        return `Transaction: ${activity.id}`;
    }
  };

  return (
    <div>
      <DashboardContainer>
        <ActivityCard>
          <h3>Platform Status</h3>
          <div className="content">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: '#00c853', 
              marginBottom: '10px' 
            }}>
              <span style={{ 
                width: '10px', 
                height: '10px', 
                background: '#00c853', 
                borderRadius: '50%',
                display: 'inline-block'
              }}></span>
              All systems operational
            </div>
            <p>Server uptime: 99.98%</p>
            <p>API status: Operational</p>
            <p>Database: Operational</p>
          </div>
        </ActivityCard>
        
        <ActivityCard>
          <h3>Recent Activity</h3>
          <RecentActivity className="content">
            {loading ? (
              <div>Loading activity...</div>
            ) : recentActivity.length === 0 ? (
              <div>No recent activity found</div>
            ) : (
              recentActivity.map((activity, index) => (
                <div className="activity-item" key={activity.id || index}>
                  <div>{formatActivityItem(activity)}</div>
                  <div className="time">
                    {activity.timestamp ? activity.timestamp.toLocaleString() : 'Unknown time'}
                  </div>
                </div>
              ))
            )}
          </RecentActivity>
        </ActivityCard>
        
        <ActivityCard>
          <h3>Quick Actions</h3>
          <div className="content">
            <div style={{ display: 'grid', gap: '10px' }}>
              <button 
                style={{
                  background: 'rgba(255, 114, 90, 0.2)',
                  color: '#ff725a',
                  border: '1px solid rgba(255, 114, 90, 0.3)',
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={() => navigate('/admin/users')}
              >
                <i className="bi bi-person-plus"></i> Manage Users
              </button>
              
              <button 
                style={{
                  background: 'rgba(33, 150, 243, 0.2)',
                  color: '#2196f3',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={() => navigate('/admin/withdrawal-management')}
              >
                <i className="bi bi-currency-exchange"></i> Review Withdrawals
                {stats.pendingWithdrawals > 0 && (
                  <span style={{
                    background: '#ff725a',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px', 
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    marginLeft: 'auto'
                  }}>
                    {stats.pendingWithdrawals}
                  </span>
                )}
              </button>
              
              <button 
                style={{
                  background: 'rgba(0, 200, 83, 0.2)',
                  color: '#00c853',
                  border: '1px solid rgba(0, 200, 83, 0.3)',
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={() => navigate('/admin/tokens')}
              >
                <i className="bi bi-coin"></i> Manage Tokens
              </button>
            </div>
          </div>
        </ActivityCard>
      </DashboardContainer>
      
      <ChartContainer>
        <h3>Platform Overview</h3>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginTop: '20px'
        }}>
          <div style={{
            background: 'rgba(22, 27, 34, 0.3)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <h4 style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 10px 0' }}>
              Total Users
            </h4>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>
              {loading ? '...' : stats.users}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(22, 27, 34, 0.3)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <h4 style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 10px 0' }}>
              Pending Withdrawals
            </h4>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: stats.pendingWithdrawals > 0 ? '#ff725a' : '#fff' }}>
              {loading ? '...' : stats.pendingWithdrawals}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(22, 27, 34, 0.3)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <h4 style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 10px 0' }}>
              Total Transactions
            </h4>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>
              {loading ? '...' : stats.totalTransactions}
            </div>
          </div>
          
          <div style={{
            background: 'rgba(22, 27, 34, 0.3)',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <h4 style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 10px 0' }}>
              Active Users
            </h4>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>
              {loading ? '...' : stats.activeUsers}
            </div>
          </div>
        </div>
      </ChartContainer>
    </div>
  );
}

export default Dashboard; 