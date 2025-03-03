import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { getUserWalletAddress, generateUserWallet, SUPPORTED_CHAINS, resetUserWallet } from '../services/walletService';
import { DEFAULT_COINS } from '../utils/constants';

// Import coin logos
import btcLogo from '../assets/images/coin/btc.png';
import ethLogo from '../assets/images/coin/eth.png';
import usdtLogo from '../assets/images/coin/usdt.png';
import solLogo from '../assets/images/coin/sol.png';
import bnbLogo from '../assets/images/coin/bnb.png';
import dogeLogo from '../assets/images/coin/doge.png';
import xrpLogo from '../assets/images/coin/xrp.png';
import adaLogo from '../assets/images/coin/ada.png';
import maticLogo from '../assets/images/coin/matic.png';
import dotLogo from '../assets/images/coin/dot.png';
import avaxLogo from '../assets/images/coin/avax.png';
import linkLogo from '../assets/images/coin/link.png';
import uniLogo from '../assets/images/coin/uni.png';
import atomLogo from '../assets/images/coin/atom.png';

const COIN_LOGOS = {
  BTC: btcLogo,
  ETH: ethLogo,
  USDT: usdtLogo,
  SOL: solLogo,
  BNB: bnbLogo,
  DOGE: dogeLogo,
  XRP: xrpLogo,
  ADA: adaLogo,
  MATIC: maticLogo,
  DOT: dotLogo,
  AVAX: avaxLogo,
  LINK: linkLogo,
  UNI: uniLogo,
  ATOM: atomLogo
};

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, rgba(0, 40, 20, 0.8), rgba(0, 20, 40, 0.8));
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 60px;
`;

const WalletCard = styled(motion.div)`
  background: rgba(0, 0, 0, 0.8);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  gap: 12px;
`;

const WalletIcon = styled.div`
  width: 24px;
  height: 24px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;

const HeaderText = styled.h2`
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  flex-grow: 1;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button`
  flex: 1;
  padding: 16px;
  background: none;
  border: none;
  color: ${props => props.active ? '#00ff9d' : 'rgba(255, 255, 255, 0.6)'};
  font-size: 16px;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.active ? '#00ff9d' : 'transparent'};
    transition: background 0.2s;
  }

  &:hover {
    color: ${props => props.active ? '#00ff9d' : '#fff'};
  }
`;

const ContentSection = styled.div`
  padding: 20px;
`;

const Description = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 20px;
  line-height: 1.6;
`;

const WalletAddress = styled.div`
  background: rgba(0, 255, 157, 0.1);
  border: 1px solid rgba(0, 255, 157, 0.3);
  border-radius: 8px;
  padding: 16px;
  position: relative;
  margin-bottom: 20px;
`;

const AddressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const AddressLabel = styled.span`
  color: #00ff9d;
  font-size: 14px;
  font-weight: 500;
`;

const CopyButton = styled.button`
  background: rgba(0, 255, 157, 0.2);
  border: none;
  border-radius: 4px;
  color: #00ff9d;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(0, 255, 157, 0.3);
  }
`;

const AddressText = styled.div`
  color: #fff;
  font-family: monospace;
  font-size: 14px;
  word-break: break-all;
`;

const QRCodeContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
  background: white;
  padding: 12px;
  border-radius: 8px;
  width: fit-content;
  margin: 0 auto 20px;
`;

const WarningBox = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  span {
    font-size: 18px;
  }
`;

const WarningText = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
  font-size: 14px;
`;

const GenerateWalletButton = styled.button`
  background: #00ff9d;
  border: none;
  border-radius: 8px;
  width: 100%;
  padding: 16px;
  color: #000;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 10px;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const MnemonicDisplay = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  
  h4 {
    color: #00ff9d;
    margin-top: 0;
    margin-bottom: 12px;
    font-size: 16px;
  }
  
  p {
    color: #fff;
    font-family: monospace;
    background: rgba(255, 255, 255, 0.1);
    padding: 12px;
    border-radius: 6px;
    margin: 0;
    line-height: 1.5;
    word-break: break-all;
  }
`;

const SelectContainer = styled.div`
  margin-bottom: 20px;
  
  label {
    display: block;
    color: #fff;
    margin-bottom: 8px;
    font-size: 14px;
  }
`;

const Select = styled.select`
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  padding: 12px;
  font-size: 16px;
  appearance: none;
  position: relative;
  cursor: pointer;
  outline: none;
  
  &:focus {
    border-color: #00ff9d;
  }
  
  option {
    background: #000;
  }
`;

const InfoBox = styled.div`
  background: rgba(0, 153, 255, 0.1);
  border: 1px solid rgba(0, 153, 255, 0.3);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  
  span {
    font-size: 18px;
    color: #0099ff;
  }
`;

const InfoText = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
  font-size: 14px;
`;

const CoinLogo = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
`;

const TokenTag = styled.span`
  background: ${props => props.isSPL ? 'rgba(20, 120, 255, 0.2)' : 'rgba(0, 255, 157, 0.1)'};
  color: ${props => props.isSPL ? '#0099ff' : '#00ff9d'};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
`;

const DebugButton = styled.button`
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid rgba(255, 0, 0, 0.4);
  border-radius: 8px;
  padding: 8px 12px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  cursor: pointer;
  margin-left: auto;
  
  &:hover {
    background: rgba(255, 0, 0, 0.3);
  }
`;

// Add new styled components for the confirmation modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: rgba(20, 22, 25, 0.95);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid rgba(255, 0, 0, 0.2);
  background: rgba(255, 0, 0, 0.05);
`;

const ModalTitle = styled.h3`
  color: #ff3b30;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ModalBody = styled.div`
  padding: 20px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  line-height: 1.6;
`;

const ModalFooter = styled.div`
  padding: 15px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const CancelButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const ConfirmButton = styled.button`
  background: rgba(255, 0, 0, 0.6);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 0, 0, 0.8);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HighlightText = styled.span`
  color: #ff3b30;
  font-weight: 500;
`;

const BoldText = styled.span`
  font-weight: 600;
`;

const Deposit = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('deposit');
  const [selectedCoin, setSelectedCoin] = useState('');
  const [selectedChain, setSelectedChain] = useState('');
  const [copied, setCopied] = useState(false);
  const [userWallets, setUserWallets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingWallet, setGeneratingWallet] = useState(false);
  const [mnemonic, setMnemonic] = useState(null);
  const [showMnemonicConfirm, setShowMnemonicConfirm] = useState(false);
  const [availableChains, setAvailableChains] = useState([]);
  const [depositAddress, setDepositAddress] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  // Filter available chains based on selected coin
  useEffect(() => {
    if (selectedCoin) {
      const chains = Object.entries(SUPPORTED_CHAINS)
        .filter(([_, chainData]) => chainData.tokens.includes(selectedCoin))
        .map(([chainId, chainData]) => ({
          id: chainId,
          name: chainData.name,
          isSPL: chainData.isSPL || false
        }));
      
      setAvailableChains(chains);
      
      if (chains.length > 0 && !selectedChain) {
        setSelectedChain(chains[0].id);
      } else if (chains.length > 0 && !chains.some(chain => chain.id === selectedChain)) {
        setSelectedChain(chains[0].id);
      } else if (chains.length === 0) {
        setSelectedChain('');
      }
    } else {
      setAvailableChains([]);
      setSelectedChain('');
    }
  }, [selectedCoin]);

  // Update deposit address when chain is selected
  useEffect(() => {
    if (userWallets && selectedChain) {
      setDepositAddress(userWallets[selectedChain] || '');
      
      // For debugging - verify Solana address format
      if (selectedChain === 'solana') {
        console.log('Solana deposit address:', userWallets[selectedChain]);
        // Solana addresses are typically ~44 characters and Base58 encoded
        if (userWallets[selectedChain]?.startsWith('0x')) {
          console.error('Invalid Solana address format detected (starts with 0x)');
        }
      }
    } else {
      setDepositAddress('');
    }
  }, [userWallets, selectedChain]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchUserWallet = async () => {
      try {
        const wallets = await getUserWalletAddress(currentUser.uid);
        setUserWallets(wallets);
        
        // Set default selections if available
        if (Object.keys(DEFAULT_COINS).length > 0) {
          const defaultCoin = Object.keys(DEFAULT_COINS)[0];
          setSelectedCoin(defaultCoin);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user wallet:', error);
        setLoading(false);
      }
    };

    fetchUserWallet();
  }, [currentUser, navigate]);

  const handleGenerateWallet = async () => {
    try {
      setGeneratingWallet(true);
      const { wallets, mnemonic: newMnemonic } = await generateUserWallet(currentUser.uid);
      setMnemonic(newMnemonic);
      setUserWallets(wallets);
      setShowMnemonicConfirm(true);
    } catch (error) {
      console.error('Error generating wallet:', error);
    } finally {
      setGeneratingWallet(false);
    }
  };

  const handleConfirmMnemonic = () => {
    setMnemonic(null);
    setShowMnemonicConfirm(false);
  };

  const handleResetWalletRequest = () => {
    setShowResetConfirmation(true);
  };

  const handleResetWalletConfirm = async () => {
    if (!currentUser) return;
    
    try {
      setIsResetting(true);
      const { wallets, mnemonic: newMnemonic } = await resetUserWallet(currentUser.uid);
      setMnemonic(newMnemonic);
      setUserWallets(wallets);
      setShowMnemonicConfirm(true);
      setShowResetConfirmation(false);
    } catch (error) {
      console.error('Error resetting wallet:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetWalletCancel = () => {
    setShowResetConfirmation(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getChainSpecificInfo = () => {
    if (!selectedChain) return null;
    
    const chainInfo = SUPPORTED_CHAINS[selectedChain];
    if (!chainInfo) return null;
    
    if (chainInfo.isSPL) {
      return (
        <InfoBox>
          <span>ℹ️</span>
          <InfoText>
            This is a Solana address that supports SPL tokens. Your private key is securely stored in the database and can 
            be used to access your SPL tokens on the Solana blockchain. For USDT and other tokens, make sure you're sending 
            the SPL version of the token.
          </InfoText>
        </InfoBox>
      );
    } else if (selectedChain === 'bitcoin' || selectedChain === 'dogecoin') {
      return (
        <InfoBox>
          <span>ℹ️</span>
          <InfoText>
            This is a {chainInfo.name} address. Your private key is securely stored in the database and can be used 
            to access your funds on the {chainInfo.name} blockchain.
          </InfoText>
        </InfoBox>
      );
    } else {
      return (
        <InfoBox>
          <span>ℹ️</span>
          <InfoText>
            This is an EVM-compatible wallet address for the {chainInfo.name} network. Your private key is securely stored in the 
            database and can be used across all EVM networks (Ethereum, BSC, Polygon, etc.).
          </InfoText>
        </InfoBox>
      );
    }
  };

  if (loading) {
    return (
      <Container>
        <WalletCard>
          <CardHeader>
            <WalletIcon>💰</WalletIcon>
            <HeaderText>Loading wallet...</HeaderText>
          </CardHeader>
        </WalletCard>
      </Container>
    );
  }

  if (!userWallets) {
    return (
      <Container>
        <WalletCard>
          <CardHeader>
            <WalletIcon>🔐</WalletIcon>
            <HeaderText>Generate Your Wallet</HeaderText>
          </CardHeader>
          <ContentSection>
            <Description>
              You need to generate a wallet to start depositing funds. This wallet will work across all supported networks, 
              with specialized wallet generation for Solana SPL tokens. Your private keys will be securely stored in your account.
            </Description>
            {!mnemonic ? (
              <GenerateWalletButton 
                onClick={handleGenerateWallet}
                disabled={generatingWallet}
              >
                {generatingWallet ? 'Generating...' : 'Generate Wallet'}
              </GenerateWalletButton>
            ) : (
              <>
                <MnemonicDisplay>
                  <h4>🔑 Your Secret Recovery Phrase</h4>
                  <p>{mnemonic}</p>
                </MnemonicDisplay>
                <WarningBox>
                  <span>⚠️</span>
                  <WarningText>
                    IMPORTANT: Save this recovery phrase in a secure location. 
                    It will only be shown once and cannot be recovered if lost.
                    Your private keys are stored securely in your account.
                  </WarningText>
                </WarningBox>
                <GenerateWalletButton onClick={handleConfirmMnemonic}>
                  I've Saved My Recovery Phrase
                </GenerateWalletButton>
              </>
            )}
          </ContentSection>
        </WalletCard>
      </Container>
    );
  }

  return (
    <Container>
      {showResetConfirmation && (
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>
                <span>⚠️</span> Important Warning: Wallet Reset
              </ModalTitle>
            </ModalHeader>
            <ModalBody>
              <p>
                You are about to <HighlightText>reset your cryptocurrency wallet</HighlightText>. This action will:
              </p>
              <ul>
                <li>Generate <BoldText>completely new wallet addresses</BoldText> for all blockchains</li>
                <li><HighlightText>Permanently delete</HighlightText> your current wallet addresses</li>
                <li>Create new private keys that will replace your existing ones</li>
              </ul>
              <p>
                <BoldText>Important:</BoldText> If you have shared your current deposit addresses with others or have pending transactions, 
                these funds may be <HighlightText>permanently lost</HighlightText> as the addresses will no longer be associated with your account.
              </p>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={handleResetWalletCancel}>
                Cancel
              </CancelButton>
              <ConfirmButton 
                onClick={handleResetWalletConfirm}
                disabled={isResetting}
              >
                {isResetting ? 'Processing...' : 'Reset My Wallet'}
              </ConfirmButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
      
      <WalletCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <CardHeader>
          <WalletIcon>💰</WalletIcon>
          <HeaderText>Deposit Funds</HeaderText>
          <DebugButton onClick={handleResetWalletRequest} disabled={isResetting}>
            {isResetting ? 'Resetting...' : 'Reset Wallet'}
          </DebugButton>
          <CloseButton onClick={() => navigate('/dashboard')}>✕</CloseButton>
        </CardHeader>
        
        <TabsContainer>
          <Tab 
            active={activeTab === 'deposit'} 
            onClick={() => setActiveTab('deposit')}
          >
            Deposit
          </Tab>
          <Tab 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
          >
            History
          </Tab>
        </TabsContainer>
        
        <ContentSection>
          {activeTab === 'deposit' ? (
            <>
              <Description>
                Select the coin you want to deposit and the blockchain network. Only send{' '}
                {selectedCoin && <><CoinLogo src={COIN_LOGOS[selectedCoin]} alt={selectedCoin} />{selectedCoin}</>}{' '}
                on the {SUPPORTED_CHAINS[selectedChain]?.name || ''} network to this address.
                {SUPPORTED_CHAINS[selectedChain]?.isSPL && selectedCoin && <TokenTag isSPL>SPL Token</TokenTag>}
              </Description>
              
              <SelectContainer>
                <label>Select Coin</label>
                <Select 
                  value={selectedCoin} 
                  onChange={(e) => setSelectedCoin(e.target.value)}
                >
                  <option value="">Select a coin</option>
                  {Object.keys(DEFAULT_COINS).map(coin => (
                    <option key={coin} value={coin}>
                      {coin} - {DEFAULT_COINS[coin].name}
                    </option>
                  ))}
                </Select>
              </SelectContainer>
              
              <SelectContainer>
                <label>Select Network</label>
                <Select 
                  value={selectedChain} 
                  onChange={(e) => setSelectedChain(e.target.value)}
                  disabled={availableChains.length === 0}
                >
                  <option value="">Select a network</option>
                  {availableChains.map(chain => (
                    <option key={chain.id} value={chain.id}>
                      {chain.name} {chain.isSPL ? '(SPL)' : ''}
                    </option>
                  ))}
                </Select>
              </SelectContainer>
              
              {selectedCoin && selectedChain && depositAddress && (
                <>
                  {getChainSpecificInfo()}
                  
                  <WalletAddress>
                    <AddressHeader>
                      <AddressLabel>
                        Deposit Address ({SUPPORTED_CHAINS[selectedChain]?.name})
                        {SUPPORTED_CHAINS[selectedChain]?.isSPL && <TokenTag isSPL>SPL</TokenTag>}
                      </AddressLabel>
                      <CopyButton onClick={() => copyToClipboard(depositAddress)}>
                        {copied ? 'Copied!' : 'Copy'}
                      </CopyButton>
                    </AddressHeader>
                    <AddressText>{depositAddress}</AddressText>
                  </WalletAddress>
                  
                  <QRCodeContainer>
                    <QRCode 
                      value={depositAddress} 
                      size={150} 
                      level="H"
                    />
                  </QRCodeContainer>
                  
                  <WarningBox>
                    <span>⚠️</span>
                    <WarningText>
                      {SUPPORTED_CHAINS[selectedChain]?.isSPL ? 
                        `This is a Solana SPL token address. Only send ${selectedCoin} using the Solana network.` : 
                        `Only send ${selectedCoin} on the ${SUPPORTED_CHAINS[selectedChain]?.name} network to this address.`} 
                      Sending any other asset may result in permanent loss.
                    </WarningText>
                  </WarningBox>
                </>
              )}
            </>
          ) : (
            <Description>
              Your deposit history will appear here.
            </Description>
          )}
        </ContentSection>
      </WalletCard>
    </Container>
  );
};

export default Deposit; 