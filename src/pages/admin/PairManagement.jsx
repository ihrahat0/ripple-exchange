<FormGroup>
  <Label>Blockchain (for DEX pairs)</Label>
  <Select 
    name="chainId" 
    value={formData.chainId} 
    onChange={handleChange}
    disabled={formData.type !== 'dex'}
  >
    <option value="ethereum">Ethereum (ETH)</option>
    <option value="bsc">Binance Smart Chain (BSC)</option>
    <option value="polygon">Polygon (MATIC)</option>
    <option value="avalanche">Avalanche (AVAX)</option>
    <option value="arbitrum">Arbitrum (ARB)</option>
    <option value="solana">Solana (SOL)</option>
  </Select>
</FormGroup>

{formData.chainId === 'solana' && formData.type === 'dex' && (
  <div style={{ 
    padding: '10px', 
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '14px',
    color: '#FFC107'
  }}>
    <strong>Note:</strong> For Solana pairs, ensure you use the correct program address format. 
    Solana DEX pairs may not show real-time charts from TradingView but will fallback to similar assets.
  </div>
)} 

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // Validate pair data
    if (formData.type === 'dex' && !formData.address) {
      throw new Error('Contract address is required for DEX tokens');
    }
    
    // For Solana pairs, add a note in the database
    const pairData = {
      ...formData,
      symbol: `${formData.token1}/${formData.token2}`,
      createdAt: serverTimestamp(),
      needsFallbackChart: formData.type === 'dex' && 
        (formData.chainId === 'solana' || !['ETH', 'BTC', 'USDT', 'USDC'].includes(formData.token1.toUpperCase())),
    };
    
    // Add to Firestore
    const docRef = await addDoc(collection(db, 'pairs'), pairData);
    
    // Show success message
    setSuccess('Pair created successfully!');
    setTimeout(() => {
      navigate('/admin/pairs');
    }, 2000);
  } catch (error) {
    console.error('Error adding pair:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
}; 