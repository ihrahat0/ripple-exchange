import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import axios from 'axios';
import { toast } from 'react-toastify';

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SettingsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
  
  .spin {
    animation: ${rotate} 1s linear infinite;
    display: inline-block;
  }
`;

const Card = styled.div`
  background: rgba(22, 27, 34, 0.5);
  border-radius: 10px;
  padding: 25px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const SectionTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #e6edf3;
  font-size: 18px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  
  i {
    color: #ff725a;
    font-size: 18px;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: grid;
  gap: 8px;
`;

const Label = styled.label`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
`;

const Input = styled.input`
  background: rgba(30, 35, 44, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #ff725a;
  }
`;

const Select = styled.select`
  background: rgba(30, 35, 44, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='white' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: calc(100% - 12px) center;
  padding-right: 30px;
  
  &:focus {
    outline: none;
    border-color: #ff725a;
  }
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  
  input {
    width: 16px;
    height: 16px;
  }
`;

const Button = styled.button`
  background: rgba(255, 114, 90, 0.15);
  color: #ff725a;
  border: 1px solid rgba(255, 114, 90, 0.3);
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  
  &:hover {
    background: rgba(255, 114, 90, 0.25);
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  i {
    font-size: 16px;
  }
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.2);
    transition: .3s;
    border-radius: 24px;
  }
  
  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .3s;
    border-radius: 50%;
  }
  
  input:checked + .slider {
    background-color: #ff725a;
  }
  
  input:checked + .slider:before {
    transform: translateX(26px);
  }
`;

const ToggleSetting = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
  
  .label {
    display: flex;
    flex-direction: column;
    
    .title {
      color: #e6edf3;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .description {
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
    }
  }
`;

function Settings() {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Ripple Exchange',
    siteDescription: 'Cryptocurrency trading platform',
    supportEmail: 'support@rippleexchange.com',
    timezone: 'UTC',
    theme: 'dark'
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    enableTwoFactor: true,
    adminApproval: true,
    kyc: true,
    maxLoginAttempts: 5,
    sessionTimeout: 60
  });
  
  const [transactionSettings, setTransactionSettings] = useState({
    minWithdrawal: 0.001,
    withdrawalFee: 0.0005,
    minDeposit: 0.0001,
    depositFee: 0
  });
  
  const [initializing, setInitializing] = useState(false);
  
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSecurityToggle = (setting) => {
    setSecuritySettings(prev => ({ 
      ...prev, 
      [setting]: !prev[setting] 
    }));
  };
  
  const handleTransactionChange = (e) => {
    const { name, value } = e.target;
    setTransactionSettings(prev => ({ 
      ...prev, 
      [name]: parseFloat(value) || 0 
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would save the settings to Firebase or your backend
    alert('Settings saved successfully!');
  };
  
  const handleInitializeRipplex = async () => {
    setInitializing(true);
    try {
      const response = await axios.get('/api/admin/initialize-ripplex');
      
      if (response.data && response.data.success) {
        toast.success(`RIPPLEX token initialized successfully. ${response.data.details.usersUpdated} users updated. ${response.data.details.airdropsProcessed} airdrops processed.`);
      } else {
        toast.error('Failed to initialize RIPPLEX token');
      }
    } catch (error) {
      console.error('Error initializing RIPPLEX token:', error);
      toast.error(`Error initializing RIPPLEX token: ${error.response?.data?.message || error.message}`);
    } finally {
      setInitializing(false);
    }
  };
  
  return (
    <SettingsContainer>
      <Card>
        <SectionTitle>
          <i className="bi bi-gear"></i> General Settings
        </SectionTitle>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="siteName">Site Name</Label>
            <Input 
              type="text" 
              id="siteName" 
              name="siteName" 
              value={generalSettings.siteName} 
              onChange={handleGeneralChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="siteDescription">Site Description</Label>
            <Input 
              type="text" 
              id="siteDescription" 
              name="siteDescription" 
              value={generalSettings.siteDescription} 
              onChange={handleGeneralChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input 
              type="email" 
              id="supportEmail" 
              name="supportEmail" 
              value={generalSettings.supportEmail} 
              onChange={handleGeneralChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="timezone">Timezone</Label>
            <Select 
              id="timezone" 
              name="timezone" 
              value={generalSettings.timezone} 
              onChange={handleGeneralChange}
            >
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time (EST)</option>
              <option value="CST">Central Time (CST)</option>
              <option value="MST">Mountain Time (MST)</option>
              <option value="PST">Pacific Time (PST)</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="theme">Theme</Label>
            <Select 
              id="theme" 
              name="theme" 
              value={generalSettings.theme} 
              onChange={handleGeneralChange}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto (System)</option>
            </Select>
          </FormGroup>
          
          <Button type="submit">
            <i className="bi bi-save"></i> Save Settings
          </Button>
        </Form>
      </Card>
      
      <Card>
        <SectionTitle>
          <i className="bi bi-coin"></i> Token Management
        </SectionTitle>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#e6edf3', marginBottom: '15px' }}>Initialize RIPPLEX token for all users. This will ensure all users have the RIPPLEX token in their balances and anyone who completed the airdrop gets 100 tokens.</p>
          
          <Button 
            onClick={handleInitializeRipplex} 
            disabled={initializing}
            style={{ 
              background: initializing ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.25)',
              color: '#3B82F6', 
              borderColor: 'rgba(59, 130, 246, 0.4)' 
            }}
          >
            {initializing ? (
              <>
                <i className="bi bi-arrow-repeat spin"></i> Initializing...
              </>
            ) : (
              <>
                <i className="bi bi-currency-exchange"></i> Initialize RIPPLEX Token
              </>
            )}
          </Button>
        </div>
      </Card>
      
      <Card>
        <SectionTitle>
          <i className="bi bi-shield-lock"></i> Security Settings
        </SectionTitle>
        
        <div>
          <ToggleSetting>
            <div className="label">
              <div className="title">Two-Factor Authentication</div>
              <div className="description">Require 2FA for admin access</div>
            </div>
            <ToggleSwitch>
              <input 
                type="checkbox" 
                checked={securitySettings.enableTwoFactor}
                onChange={() => handleSecurityToggle('enableTwoFactor')}
              />
              <span className="slider"></span>
            </ToggleSwitch>
          </ToggleSetting>
          
          <ToggleSetting>
            <div className="label">
              <div className="title">Admin Approval for Withdrawals</div>
              <div className="description">Require admin review for all withdrawals</div>
            </div>
            <ToggleSwitch>
              <input 
                type="checkbox" 
                checked={securitySettings.adminApproval}
                onChange={() => handleSecurityToggle('adminApproval')}
              />
              <span className="slider"></span>
            </ToggleSwitch>
          </ToggleSetting>
          
          <ToggleSetting>
            <div className="label">
              <div className="title">KYC Requirements</div>
              <div className="description">Require KYC verification for users</div>
            </div>
            <ToggleSwitch>
              <input 
                type="checkbox" 
                checked={securitySettings.kyc}
                onChange={() => handleSecurityToggle('kyc')}
              />
              <span className="slider"></span>
            </ToggleSwitch>
          </ToggleSetting>
          
          <Form style={{ marginTop: '20px' }}>
            <FormGroup>
              <Label>Max Login Attempts</Label>
              <Input 
                type="number" 
                name="maxLoginAttempts" 
                value={securitySettings.maxLoginAttempts}
                onChange={(e) => setSecuritySettings(prev => ({ 
                  ...prev, 
                  maxLoginAttempts: parseInt(e.target.value) || 0 
                }))}
                min="1"
                max="10"
              />
            </FormGroup>
            
            <FormGroup>
              <Label>Session Timeout (minutes)</Label>
              <Input 
                type="number" 
                name="sessionTimeout" 
                value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings(prev => ({ 
                  ...prev, 
                  sessionTimeout: parseInt(e.target.value) || 0 
                }))}
                min="5"
              />
            </FormGroup>
            
            <Button type="button" onClick={(e) => handleSubmit(e)}>
              <i className="bi bi-save"></i> Save Security Settings
            </Button>
          </Form>
        </div>
      </Card>
      
      <Card>
        <SectionTitle>
          <i className="bi bi-cash-stack"></i> Transaction Settings
        </SectionTitle>
        
        <Form>
          <FormGroup>
            <Label>Minimum Withdrawal Amount (BTC)</Label>
            <Input 
              type="number" 
              name="minWithdrawal" 
              value={transactionSettings.minWithdrawal}
              onChange={handleTransactionChange}
              step="0.0001"
              min="0"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Withdrawal Fee (%)</Label>
            <Input 
              type="number" 
              name="withdrawalFee" 
              value={transactionSettings.withdrawalFee}
              onChange={handleTransactionChange}
              step="0.0001"
              min="0"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Minimum Deposit Amount (BTC)</Label>
            <Input 
              type="number" 
              name="minDeposit" 
              value={transactionSettings.minDeposit}
              onChange={handleTransactionChange}
              step="0.0001"
              min="0"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Deposit Fee (%)</Label>
            <Input 
              type="number" 
              name="depositFee" 
              value={transactionSettings.depositFee}
              onChange={handleTransactionChange}
              step="0.0001"
              min="0"
            />
          </FormGroup>
          
          <Button type="button" onClick={(e) => handleSubmit(e)}>
            <i className="bi bi-save"></i> Save Transaction Settings
          </Button>
        </Form>
      </Card>
    </SettingsContainer>
  );
}

export default Settings; 