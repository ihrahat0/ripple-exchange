import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatters';

const NotificationContainer = styled.div`
  position: absolute;
  top: 60px;
  right: 10px;
  width: 360px;
  max-height: 480px;
  overflow-y: auto;
  background: #1a1b23;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
  padding: 0;
  display: ${({ show }) => (show ? 'block' : 'none')};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #fff;
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #4A6BF3;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #7A7A7A;
  font-size: 14px;
`;

const NotificationItem = styled.div`
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  gap: 12px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  ${({ unread }) => unread && `
    background-color: rgba(74, 107, 243, 0.05);
    
    &:hover {
      background-color: rgba(74, 107, 243, 0.08);
    }
  `}
`;

const IconContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ type }) => 
    type === 'commission' ? 'rgba(14, 203, 129, 0.1)' : 
    type === 'deposit' ? 'rgba(74, 107, 243, 0.1)' : 
    type === 'system' ? 'rgba(255, 193, 7, 0.1)' : 
    'rgba(255, 255, 255, 0.1)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ type }) => 
    type === 'commission' ? '#0ECB81' : 
    type === 'deposit' ? '#4A6BF3' : 
    type === 'system' ? '#FFC107' : 
    '#F7931A'
  };
  font-size: 18px;
`;

const Content = styled.div`
  flex: 1;
`;

const Title2 = styled.h4`
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
`;

const Message = styled.p`
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #999;
  line-height: 1.4;
`;

const Time = styled.span`
  font-size: 12px;
  color: #7A7A7A;
`;

const Amount = styled.span`
  color: ${({ type }) => type === 'commission' ? '#0ECB81' : '#F7931A'};
  font-weight: 500;
`;

const Notifications = ({ show, onClose }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !show) return;

    setLoading(true);
    
    // Query notifications collection for current user
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = [];
      snapshot.forEach((doc) => {
        notificationsData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setNotifications(notificationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, show]);

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Handle navigation or additional actions here
    if (notification.type === 'commission') {
      // Navigate to referrals tab in user profile
      window.location.href = '/user-profile';
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all notifications as read
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const date = new Date(timestamp.seconds * 1000);
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInMs / (1000 * 60))} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'commission':
        return '💰';
      case 'deposit':
        return '📥';
      case 'system':
        return '🔔';
      default:
        return '📣';
    }
  };

  return (
    <NotificationContainer show={show} onClick={e => e.stopPropagation()}>
      <Header>
        <Title>Notifications</Title>
        <ClearButton onClick={markAllAsRead}>Mark all as read</ClearButton>
      </Header>
      
      {loading ? (
        <EmptyState>Loading notifications...</EmptyState>
      ) : notifications.length === 0 ? (
        <EmptyState>No notifications available</EmptyState>
      ) : (
        notifications.map((notification) => (
          <NotificationItem 
            key={notification.id} 
            unread={!notification.read}
            onClick={() => handleNotificationClick(notification)}
          >
            <IconContainer type={notification.type}>
              {getIcon(notification.type)}
            </IconContainer>
            <Content>
              <Title2>{notification.title}</Title2>
              <Message>
                {notification.message}
                {notification.amount && (
                  <Amount type={notification.type}> {formatCurrency(notification.amount, notification.currency)}</Amount>
                )}
              </Message>
              <Time>{formatTime(notification.createdAt)}</Time>
            </Content>
          </NotificationItem>
        ))
      )}
    </NotificationContainer>
  );
};

export default Notifications; 