import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import axios from 'axios';

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

const BalanceCard = styled(ActivityCard)`
  .balance-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .balance-item {
    padding: 10px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
    
    .token {
      font-weight: 500;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .amount {
      font-size: 18px;
      font-weight: 600;
      color: #e6edf3;
    }
  }
  
  .last-updated {
    margin-top: 12px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-align: right;
  }
  
  .refresh-button {
    margin-top: 15px;
    background: rgba(255, 114, 90, 0.1);
    color: #ff725a;
    border: 1px solid rgba(255, 114, 90, 0.2);
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      background: rgba(255, 114, 90, 0.2);
    }
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
    color: rgba(255, 255, 255, 0.3);
  }
`;

const StatsCard = styled(ActivityCard)`
  .stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }
  
  .stat-item {
    padding: 10px;
    
    .label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.5);
      margin-bottom: 5px;
    }
    
    .value {
      font-size: 24px;
      font-weight: 600;
      color: #e6edf3;
    }
  }
`;

const RecentActivity = styled(ActivityCard)`
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
  const [balances, setBalances] = useState({
    ETH: 0,
    BNB: 0,
    MATIC: 0,
    SOL: 0,
    lastUpdated: null,
    walletCount: 0,
    userCount: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up polling to refresh data every 30 seconds
    const intervalId = setInterval(() => {
      fetchDepositStats();
    }, 30000);
    
    return () => clearInterval(intervalId);
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
      
      // Fetch deposit stats separately
      await fetchDepositStats();
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDepositStats = async () => {
    try {
      const response = await axios.get('/api/admin/deposit-stats');
      if (response.data && response.data.success && response.data.stats) {
        const { latestBalances } = response.data.stats;
        if (latestBalances) {
          console.log('Latest balances:', latestBalances);
          setBalances(latestBalances);
        }
      }
    } catch (error) {
      console.error("Error fetching deposit stats:", error);
    }
  };
  
  const formatBalanceTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    return date.toLocaleString();
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
  
  const handleBalanceRefresh = async () => {
    setRefreshing(true);
    try {
      // Call the manual refresh endpoint
      const refreshResponse = await axios.get('/api/admin/refresh-all-balances');
      
      if (refreshResponse.data && refreshResponse.data.success) {
        // Show success message
        alert(refreshResponse.data.message || 'Balance refresh initiated');
        
        // Wait a moment before fetching updated stats
        setTimeout(async () => {
          await fetchDepositStats();
          setRefreshing(false);
        }, 3000); // Wait 3 seconds to allow some time for the refresh to start
      } else {
        throw new Error('Failed to initiate balance refresh');
      }
    } catch (error) {
      console.error("Error refreshing balances:", error);
      alert('Failed to refresh balances: ' + (error.message || 'Unknown error'));
      setRefreshing(false);
    }
  };

  return (
    <div>
      <DashboardContainer>
        <StatsCard>
          <h3>Platform Status</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <div className="label">Users</div>
              <div className="value">{stats.users}</div>
            </div>
            <div className="stat-item">
              <div className="label">Active Users</div>
              <div className="value">{stats.activeUsers}</div>
            </div>
            <div className="stat-item">
              <div className="label">Transactions</div>
              <div className="value">{stats.totalTransactions}</div>
            </div>
            <div className="stat-item">
              <div className="label">Pending Withdrawals</div>
              <div className="value">{stats.pendingWithdrawals}</div>
            </div>
          </div>
        </StatsCard>
        
        <BalanceCard>
          <h3>Latest Balances</h3>
          <div className="balance-grid">
            <div className="balance-item">
              <div className="token">ETH <img src="/images/tokens/eth.svg" width="16" alt="ETH" /></div>
              <div className="amount">{balances.ETH.toFixed(4)}</div>
            </div>
            <div className="balance-item">
              <div className="token">BNB <img src="/images/tokens/bnb.svg" width="16" alt="BNB" /></div>
              <div className="amount">{balances.BNB.toFixed(4)}</div>
            </div>
            <div className="balance-item">
              <div className="token">MATIC <img src="/images/tokens/matic.svg" width="16" alt="MATIC" /></div>
              <div className="amount">{balances.MATIC.toFixed(4)}</div>
            </div>
            <div className="balance-item">
              <div className="token">SOL <img src="/images/tokens/sol.svg" width="16" alt="SOL" /></div>
              <div className="amount">{balances.SOL.toFixed(4)}</div>
            </div>
          </div>
          <div className="last-updated">
            Last updated: {formatBalanceTimestamp(balances.lastUpdated)}
          </div>
          <button 
            className="refresh-button" 
            onClick={handleBalanceRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Balances'}
          </button>
        </BalanceCard>
        
        <RecentActivity>
          <h3>Recent Activity</h3>
          <div className="content">
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>No recent activity</div>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div>{formatActivityItem(activity)}</div>
                  <div className="time">{new Date(activity.timestamp).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </RecentActivity>
      </DashboardContainer>
    </div>
  );
}

export default Dashboard; 