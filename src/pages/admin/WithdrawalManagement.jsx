import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled.div`
  padding: 0;
  animation: ${fadeIn} 0.3s ease;
`;

const Title = styled.h2`
  font-size: 24px;
  margin-bottom: 15px;
  color: #e6edf3;
  display: flex;
  align-items: center;
  gap: 10px;
  
  span.badge {
    font-size: 14px;
    background: #ff725a;
    color: white;
    padding: 4px 8px;
    border-radius: 20px;
    font-weight: normal;
  }
`;

const WithdrawalTable = styled.div`
  background: rgba(20, 22, 29, 0.5);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background: rgba(22, 27, 34, 0.8);
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const TableRow = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 16px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  vertical-align: middle;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.$status) {
      case 'pending': return 'rgba(255, 152, 0, 0.1)';
      case 'approved': return 'rgba(0, 200, 83, 0.1)';
      case 'rejected': return 'rgba(244, 67, 54, 0.1)';
      case 'completed': return 'rgba(33, 150, 243, 0.1)';
      default: return 'rgba(158, 158, 158, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'pending': return '#ff9800';
      case 'approved': return '#00c853';
      case 'rejected': return '#f44336';
      case 'completed': return '#2196f3';
      default: return '#9e9e9e';
    }
  }};
  
  i {
    font-size: 10px;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.$approve ? 'rgba(0, 200, 83, 0.1)' : props.$reject ? 'rgba(244, 67, 54, 0.1)' : 'rgba(33, 150, 243, 0.1)'};
  color: ${props => props.$approve ? '#00c853' : props.$reject ? '#f44336' : '#2196f3'};
  border: 1px solid ${props => props.$approve ? 'rgba(0, 200, 83, 0.3)' : props.$reject ? 'rgba(244, 67, 54, 0.3)' : 'rgba(33, 150, 243, 0.3)'};
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  margin-right: 8px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: ${props => props.$approve ? 'rgba(0, 200, 83, 0.2)' : props.$reject ? 'rgba(244, 67, 54, 0.2)' : 'rgba(33, 150, 243, 0.2)'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  i {
    font-size: 12px;
  }
`;

const RefreshButton = styled(ActionButton)`
  margin-left: 10px;
`;

const FilterBar = styled.div`
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
  align-items: center;
`;

const FilterSelect = styled.select`
  background: rgba(30, 35, 44, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: calc(100% - 12px) center;
  padding-right: 30px;
  min-width: 150px;
  
  &:focus {
    outline: none;
    border-color: rgba(33, 150, 243, 0.5);
  }
`;

const SearchInput = styled.input`
  flex-grow: 1;
  background: rgba(30, 35, 44, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: rgba(33, 150, 243, 0.5);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const MessageBox = styled.div`
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  background: ${props => props.$error ? 'rgba(244, 67, 54, 0.1)' : 'rgba(0, 200, 83, 0.1)'};
  color: ${props => props.$error ? '#f44336' : '#00c853'};
  border: 1px solid ${props => props.$error ? 'rgba(244, 67, 54, 0.3)' : 'rgba(0, 200, 83, 0.3)'};
  display: flex;
  align-items: center;
  gap: 12px;
  
  i {
    font-size: 20px;
  }
`;

const EmptyState = styled.div`
  padding: 40px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  
  i {
    font-size: 48px;
    margin-bottom: 15px;
    display: block;
  }
  
  h3 {
    margin: 0 0 10px 0;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
`;

const DetailView = styled.div`
  background: rgba(22, 27, 34, 0.5);
  border-radius: 10px;
  padding: 25px;
  margin-bottom: 25px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: ${fadeIn} 0.3s ease;
`;

const DetailItem = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  margin-bottom: 6px;
`;

const DetailValue = styled.div`
  color: #fff;
  font-size: 15px;
  word-break: break-all;
`;

const DetailActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const DebugSection = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
  font-family: monospace;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
`;

const WithdrawalStats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 25px;
`;

const StatCard = styled.div`
  background: rgba(22, 27, 34, 0.5);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  h3 {
    margin: 0 0 5px 0;
    color: ${props => props.$color || 'rgba(255, 255, 255, 0.6)'};
    font-size: 13px;
    font-weight: 500;
  }
  
  .value {
    font-size: 26px;
    font-weight: 600;
    color: #e6edf3;
  }
  
  .icon {
    float: right;
    background: ${props => {
      switch (props.$status) {
        case 'pending': return 'rgba(255, 152, 0, 0.1)';
        case 'approved': return 'rgba(0, 200, 83, 0.1)';
        case 'rejected': return 'rgba(244, 67, 54, 0.1)';
        case 'completed': return 'rgba(33, 150, 243, 0.1)';
        default: return 'rgba(158, 158, 158, 0.1)';
      }
    }};
    color: ${props => {
      switch (props.$status) {
        case 'pending': return '#ff9800';
        case 'approved': return '#00c853';
        case 'rejected': return '#f44336';
        case 'completed': return '#2196f3';
        default: return '#9e9e9e';
      }
    }};
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    margin-top: -40px;
  }
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #30363d;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e6edf3;
    font-weight: 500;
  }
  
  .info {
    .email {
      font-size: 14px;
      color: #e6edf3;
    }
    
    .userId {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
  }
`;

const CopyableAddress = styled.div`
  position: relative;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 5px;
  word-break: break-all;
  
  button {
    position: absolute;
    top: 5px;
    right: 5px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: rgba(255, 255, 255, 0.7);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
`;

const PageControls = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  gap: 10px;
`;

function WithdrawalManagement() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [statCounts, setStatCounts] = useState({
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [processingIds, setProcessingIds] = useState([]);

  // Fetch all withdrawal requests
  useEffect(() => {
    console.log("Fetching withdrawals with status filter:", statusFilter);
    fetchWithdrawals();
  }, [statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setMessage({ text: '', isError: false });
      
      // Base query parts
      const withdrawalsRef = collection(db, 'transactions');
      let withdrawalList = [];
      
      try {
        // Simplified query to avoid requiring a composite index
        // First fetch all withdrawal transactions
        const withdrawalsSnapshot = await getDocs(collection(db, 'transactions'));
        
        // Filter in memory instead of in the query
        withdrawalList = withdrawalsSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Convert Firebase timestamp to Date
              timestamp: data.timestamp?.toDate() || new Date()
            };
          })
          .filter(transaction => transaction.type === 'withdrawal')
          .filter(transaction => statusFilter === 'all' || transaction.status === statusFilter)
          .sort((a, b) => b.timestamp - a.timestamp);
        
        console.log(`Found ${withdrawalList.length} withdrawal requests after filtering`);
        
        // Count stats from the fetched data
        const stats = {
          total: 0,
          pending: 0,
          approved: 0,
          completed: 0,
          rejected: 0
        };
        
        withdrawalsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.type === 'withdrawal') {
            const status = data.status || 'pending';
            stats[status] = (stats[status] || 0) + 1;
            stats.total++;
          }
        });
        
        setStatCounts(stats);
        setWithdrawals(withdrawalList);
      } catch (error) {
        console.error('Error with simplified query:', error);
        
        // Fallback approach - create Firebase index using the console link
        setMessage({
          text: `Please create an index for this query. Visit https://console.firebase.google.com/project/_/firestore/indexes to create an index with collection 'transactions', fields: 'type', 'status', 'timestamp' (descending)`,
          isError: true
        });
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setMessage({
        text: `Failed to fetch withdrawal requests: ${error.message}`,
        isError: true
      });
    } finally {
      setLoading(false);
    }
  };

  // Approve a withdrawal request
  const handleApproveWithdrawal = async (withdrawalId) => {
    try {
      setProcessingIds(prev => [...prev, withdrawalId]);
      
      // Get the withdrawal data
      const withdrawalDoc = await getDoc(doc(db, 'transactions', withdrawalId));
      if (!withdrawalDoc.exists()) {
        throw new Error('Withdrawal not found');
      }
      
      const withdrawalData = withdrawalDoc.data();
      const { userId, amount, token } = withdrawalData;
      
      // Update withdrawal status
      await updateDoc(doc(db, 'transactions', withdrawalId), {
        status: 'approved',
        approvedAt: new Date(),
        processingNotes: 'Approved by admin, awaiting blockchain confirmation'
      });
      
      // Update user balance
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const currentBalance = userData.balances?.[token] || 0;
      
      // Ensure sufficient balance
      if (currentBalance < amount) {
        await updateDoc(doc(db, 'transactions', withdrawalId), {
          status: 'rejected',
          processingNotes: 'Insufficient balance'
        });
        
        throw new Error(`User has insufficient ${token} balance`);
      }
      
      // Update user balance
      const newBalance = currentBalance - amount;
      await updateDoc(doc(db, 'users', userId), {
        [`balances.${token}`]: newBalance
      });
      
      // Successfully processed
      setMessage({
        text: `Withdrawal of ${amount} ${token} approved successfully. User balance updated.`,
        isError: false
      });
      
      if (selectedWithdrawal?.id === withdrawalId) {
        setSelectedWithdrawal({
          ...selectedWithdrawal,
          status: 'approved',
          approvedAt: new Date()
        });
      }
      
      // Refresh the list
      fetchWithdrawals();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      setMessage({
        text: `Failed to approve withdrawal: ${error.message}`,
        isError: true
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== withdrawalId));
    }
  };

  // Reject a withdrawal request
  const handleRejectWithdrawal = async (withdrawalId) => {
    try {
      setProcessingIds(prev => [...prev, withdrawalId]);
      
      // Update status to rejected
      await updateDoc(doc(db, 'transactions', withdrawalId), {
        status: 'rejected',
        processingNotes: 'Rejected by admin',
        rejectedAt: new Date()
      });
      
      setMessage({
        text: 'Withdrawal request rejected successfully.',
        isError: false
      });
      
      if (selectedWithdrawal?.id === withdrawalId) {
        setSelectedWithdrawal({
          ...selectedWithdrawal,
          status: 'rejected',
          rejectedAt: new Date()
        });
      }
      
      // Refresh the list
      fetchWithdrawals();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      setMessage({
        text: `Failed to reject withdrawal: ${error.message}`,
        isError: true
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== withdrawalId));
    }
  };

  // Complete a withdrawal (mark as sent)
  const handleCompleteWithdrawal = async (withdrawalId) => {
    try {
      setProcessingIds(prev => [...prev, withdrawalId]);
      
      // Get the withdrawal to check if it's approved
      const withdrawalDoc = await getDoc(doc(db, 'transactions', withdrawalId));
      if (!withdrawalDoc.exists()) {
        throw new Error('Withdrawal not found');
      }
      
      const withdrawalData = withdrawalDoc.data();
      if (withdrawalData.status !== 'approved') {
        throw new Error('Only approved withdrawals can be marked as completed');
      }
      
      // Update status to completed
      await updateDoc(doc(db, 'transactions', withdrawalId), {
        status: 'completed',
        completedAt: new Date(),
        processingNotes: 'Funds sent to user wallet'
        // In a real system, you'd add txHash here
      });
      
      setMessage({
        text: 'Withdrawal marked as completed successfully.',
        isError: false
      });
      
      if (selectedWithdrawal?.id === withdrawalId) {
        setSelectedWithdrawal({
          ...selectedWithdrawal,
          status: 'completed',
          completedAt: new Date()
        });
      }
      
      // Refresh the list
      fetchWithdrawals();
    } catch (error) {
      console.error('Error completing withdrawal:', error);
      setMessage({
        text: `Failed to complete withdrawal: ${error.message}`,
        isError: true
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== withdrawalId));
    }
  };

  // View withdrawal details
  const handleViewDetails = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
  };

  // Format date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({
      text: "Text copied to clipboard",
      isError: false
    });
    
    // Clear message after 2 seconds
    setTimeout(() => {
      setMessage({ text: '', isError: false });
    }, 2000);
  };
  
  // Get initials for avatar
  const getInitials = (email) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };
  
  // Get user name from email
  const getUserName = (email) => {
    if (!email) return 'Unknown User';
    return email.split('@')[0];
  };

  // Filter withdrawals based on search
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const searchLower = search.toLowerCase();
    return (
      (withdrawal.userId?.toLowerCase().includes(searchLower)) ||
      (withdrawal.requestedBy?.toLowerCase().includes(searchLower)) ||
      (withdrawal.token?.toLowerCase().includes(searchLower)) ||
      (withdrawal.destinationAddress?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Container>
      <Title>
        Withdrawal Management
        {statCounts.pending > 0 && (
          <span className="badge">{statCounts.pending} pending</span>
        )}
      </Title>
      
      <WithdrawalStats>
        <StatCard $status="pending">
          <div className="icon"><i className="bi bi-hourglass-split"></i></div>
          <h3>Pending</h3>
          <div className="value">{statCounts.pending}</div>
        </StatCard>
        <StatCard $status="approved">
          <div className="icon"><i className="bi bi-check-circle"></i></div>
          <h3>Approved</h3>
          <div className="value">{statCounts.approved}</div>
        </StatCard>
        <StatCard $status="completed">
          <div className="icon"><i className="bi bi-check-all"></i></div>
          <h3>Completed</h3>
          <div className="value">{statCounts.completed}</div>
        </StatCard>
        <StatCard $status="rejected">
          <div className="icon"><i className="bi bi-x-circle"></i></div>
          <h3>Rejected</h3>
          <div className="value">{statCounts.rejected}</div>
        </StatCard>
      </WithdrawalStats>
      
      {message.text && (
        <MessageBox $error={message.isError}>
          <i className={message.isError ? "bi bi-exclamation-triangle" : "bi bi-check-circle"}></i>
          <div>{message.text}</div>
        </MessageBox>
      )}
      
      <FilterBar>
        <FilterSelect 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </FilterSelect>
        
        <SearchInput 
          placeholder="Search by user, token or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <RefreshButton onClick={fetchWithdrawals}>
          <i className="bi bi-arrow-repeat"></i> Refresh
        </RefreshButton>
      </FilterBar>
      
      {selectedWithdrawal && (
        <DetailView>
          <Title>Withdrawal Details</Title>
          
          <DetailItem>
            <DetailLabel>Requested By</DetailLabel>
            <DetailValue>
              <UserRow>
                <div className="avatar">{getInitials(selectedWithdrawal.requestedBy)}</div>
                <div className="info">
                  <div className="email">{selectedWithdrawal.requestedBy}</div>
                  <div className="userId">ID: {selectedWithdrawal.userId}</div>
                </div>
              </UserRow>
            </DetailValue>
          </DetailItem>
          
          <DetailItem>
            <DetailLabel>Amount</DetailLabel>
            <DetailValue style={{ fontSize: '18px', fontWeight: '500' }}>
              {selectedWithdrawal.amount} {selectedWithdrawal.token}
            </DetailValue>
          </DetailItem>
          
          <DetailItem>
            <DetailLabel>Destination Address</DetailLabel>
            <DetailValue>
              <CopyableAddress>
                {selectedWithdrawal.destinationAddress}
                <button onClick={() => copyToClipboard(selectedWithdrawal.destinationAddress)}>Copy</button>
              </CopyableAddress>
            </DetailValue>
          </DetailItem>
          
          <DetailItem>
            <DetailLabel>Chain</DetailLabel>
            <DetailValue style={{ textTransform: 'capitalize' }}>
              {selectedWithdrawal.chain}
            </DetailValue>
          </DetailItem>
          
          <DetailItem>
            <DetailLabel>Status</DetailLabel>
            <DetailValue>
              <StatusBadge $status={selectedWithdrawal.status}>
                <i className={
                  selectedWithdrawal.status === 'pending' ? 'bi bi-hourglass-split' :
                  selectedWithdrawal.status === 'approved' ? 'bi bi-check-circle' :
                  selectedWithdrawal.status === 'completed' ? 'bi bi-check-all' :
                  'bi bi-x-circle'
                }></i>
                {selectedWithdrawal.status.charAt(0).toUpperCase() + selectedWithdrawal.status.slice(1)}
              </StatusBadge>
            </DetailValue>
          </DetailItem>
          
          <DetailItem>
            <DetailLabel>Requested At</DetailLabel>
            <DetailValue>{formatDate(selectedWithdrawal.timestamp)}</DetailValue>
          </DetailItem>
          
          {selectedWithdrawal.approvedAt && (
            <DetailItem>
              <DetailLabel>Approved At</DetailLabel>
              <DetailValue>{formatDate(selectedWithdrawal.approvedAt)}</DetailValue>
            </DetailItem>
          )}
          
          {selectedWithdrawal.completedAt && (
            <DetailItem>
              <DetailLabel>Completed At</DetailLabel>
              <DetailValue>{formatDate(selectedWithdrawal.completedAt)}</DetailValue>
            </DetailItem>
          )}
          
          {selectedWithdrawal.rejectedAt && (
            <DetailItem>
              <DetailLabel>Rejected At</DetailLabel>
              <DetailValue>{formatDate(selectedWithdrawal.rejectedAt)}</DetailValue>
            </DetailItem>
          )}
          
          {selectedWithdrawal.processingNotes && (
            <DetailItem>
              <DetailLabel>Processing Notes</DetailLabel>
              <DetailValue>{selectedWithdrawal.processingNotes}</DetailValue>
            </DetailItem>
          )}
          
          <DetailActions>
            <ActionButton onClick={() => setSelectedWithdrawal(null)}>
              <i className="bi bi-arrow-left"></i> Back to List
            </ActionButton>
            
            {selectedWithdrawal.status === 'pending' && (
              <>
                <ActionButton 
                  $approve
                  onClick={() => handleApproveWithdrawal(selectedWithdrawal.id)}
                  disabled={processingIds.includes(selectedWithdrawal.id)}
                >
                  <i className="bi bi-check"></i> Approve
                </ActionButton>
                
                <ActionButton 
                  $reject
                  onClick={() => handleRejectWithdrawal(selectedWithdrawal.id)}
                  disabled={processingIds.includes(selectedWithdrawal.id)}
                >
                  <i className="bi bi-x"></i> Reject
                </ActionButton>
              </>
            )}
            
            {selectedWithdrawal.status === 'approved' && (
              <ActionButton 
                onClick={() => handleCompleteWithdrawal(selectedWithdrawal.id)}
                disabled={processingIds.includes(selectedWithdrawal.id)}
              >
                <i className="bi bi-check-all"></i> Complete
              </ActionButton>
            )}
          </DetailActions>
        </DetailView>
      )}
      
      <WithdrawalTable>
        <Table>
          <TableHead>
            <tr>
              <TableHeader>Date</TableHeader>
              <TableHeader>User</TableHeader>
              <TableHeader>Amount</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Actions</TableHeader>
            </tr>
          </TableHead>
          
          <tbody>
            {loading ? (
              <TableRow>
                <TableCell colSpan="5" style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '20px 0' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255, 255, 255, 0.2)', borderTopColor: '#ff725a', animation: 'spin 1s linear infinite' }}></div>
                    Loading withdrawal requests...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredWithdrawals.length > 0 ? (
              filteredWithdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>{formatDate(withdrawal.timestamp)}</TableCell>
                  <TableCell>
                    <UserRow>
                      <div className="avatar">{getInitials(withdrawal.requestedBy)}</div>
                      <div className="info">
                        <div className="email">{getUserName(withdrawal.requestedBy)}</div>
                        <div className="userId">{withdrawal.requestedBy}</div>
                      </div>
                    </UserRow>
                  </TableCell>
                  <TableCell>
                    <strong>{withdrawal.amount}</strong> {withdrawal.token}
                  </TableCell>
                  <TableCell>
                    <StatusBadge $status={withdrawal.status}>
                      <i className={
                        withdrawal.status === 'pending' ? 'bi bi-hourglass-split' :
                        withdrawal.status === 'approved' ? 'bi bi-check-circle' :
                        withdrawal.status === 'completed' ? 'bi bi-check-all' :
                        'bi bi-x-circle'
                      }></i>
                      {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <ActionButton 
                      onClick={() => handleViewDetails(withdrawal)}
                    >
                      <i className="bi bi-eye"></i> View
                    </ActionButton>
                    
                    {withdrawal.status === 'pending' && (
                      <>
                        <ActionButton 
                          $approve
                          onClick={() => handleApproveWithdrawal(withdrawal.id)}
                          disabled={processingIds.includes(withdrawal.id)}
                        >
                          <i className="bi bi-check"></i> Approve
                        </ActionButton>
                        
                        <ActionButton 
                          $reject
                          onClick={() => handleRejectWithdrawal(withdrawal.id)}
                          disabled={processingIds.includes(withdrawal.id)}
                        >
                          <i className="bi bi-x"></i> Reject
                        </ActionButton>
                      </>
                    )}
                    
                    {withdrawal.status === 'approved' && (
                      <ActionButton 
                        onClick={() => handleCompleteWithdrawal(withdrawal.id)}
                        disabled={processingIds.includes(withdrawal.id)}
                      >
                        <i className="bi bi-check-all"></i> Complete
                      </ActionButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan="5">
                  <EmptyState>
                    <i className="bi bi-inbox"></i>
                    <h3>No withdrawal requests found</h3>
                    <p>There are no withdrawal requests matching your filter criteria.</p>
                  </EmptyState>
                </TableCell>
              </TableRow>
            )}
          </tbody>
        </Table>
      </WithdrawalTable>
      
      {filteredWithdrawals.length > 10 && (
        <PageControls>
          <ActionButton><i className="bi bi-chevron-left"></i> Previous</ActionButton>
          <ActionButton>Next <i className="bi bi-chevron-right"></i></ActionButton>
        </PageControls>
      )}
      
      {/* Add the debug section at the end */}
      {process.env.NODE_ENV === 'development' && (
        <DebugSection>
          <p>Debug Info:</p>
          <p>Status Filter: {statusFilter}</p>
          <p>Loading: {loading.toString()}</p>
          <p>Withdrawals Count: {withdrawals.length}</p>
          <p>Processing IDs: {processingIds.join(', ') || 'none'}</p>
          <p>Filtered Withdrawals Count: {filteredWithdrawals.length}</p>
          <div style={{ marginTop: '10px' }}>
            <p>Raw Data:</p>
            <pre>{JSON.stringify(withdrawals.slice(0, 2), null, 2)}</pre>
          </div>
        </DebugSection>
      )}
    </Container>
  );
}

export default WithdrawalManagement; 