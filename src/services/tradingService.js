import { db } from '../firebase';
import { 
    doc, 
    collection, 
    getDoc, 
    serverTimestamp,
    writeBatch,
    increment,
    getDocs,
    query,
    where,
    arrayUnion,
    addDoc,
    deleteDoc,
    updateDoc,
    runTransaction
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export const tradingService = {
    async openPosition(userId, tradeData) {
        try {
            // Check order mode
            if (tradeData.orderMode === 'market') {
                // For market orders, execute immediately
                const batch = writeBatch(db);
                const positionRef = doc(collection(db, 'positions'));
                const userRef = doc(db, 'users', userId);
                
                // Verify user has enough balance
                const userDoc = await getDoc(userRef);
                if (!userDoc.exists()) {
                    throw new Error('User not found');
                }
                
                const userData = userDoc.data();
                console.log('User data when opening position:', userData);
                
                // Validate if user has sufficient balance
                let userBalance = 0;
                
                if (userData.balances && typeof userData.balances.USDT === 'number') {
                    userBalance = userData.balances.USDT;
                } else {
                    // Try to get balance from a separate balances document (legacy)
                    try {
                        const balanceDoc = await getDoc(doc(db, 'balances', userId));
                        if (balanceDoc.exists()) {
                            userBalance = balanceDoc.data().USDT || 0;
                        }
                    } catch (err) {
                        console.warn('Error fetching balance document:', err);
                    }
                }
                
                console.log(`User balance: ${userBalance}, Required margin: ${tradeData.margin}`);
                
                if (userBalance < tradeData.margin) {
                    throw new Error('Insufficient balance');
                }
                
                console.log('Creating position with data:', JSON.stringify(tradeData));
                
                const position = {
                    userId,
                    symbol: tradeData.symbol,
                    type: tradeData.type,
                    side: tradeData.side || tradeData.type, // Ensure side is always set
                    amount: tradeData.amount,
                    leverage: tradeData.leverage,
                    entryPrice: tradeData.entryPrice,
                    margin: tradeData.margin,
                    orderMode: tradeData.orderMode,
                    status: 'OPEN',
                    openTime: serverTimestamp(),
                    currentPnL: 0,
                    lastUpdated: serverTimestamp(),
                    closePrice: null,
                    closeTime: null,
                    finalPnL: null
                };

                batch.set(positionRef, position);
                
                // Update user balance based on document structure
                if (userData.balances) {
                    // User has balances field, update it directly
                    batch.update(userRef, {
                        [`balances.USDT`]: increment(-tradeData.margin),
                        lastUpdated: serverTimestamp()
                    });
                } else {
                    // For legacy users, create the balances object
                    console.log('User has no balances field, creating it');
                    
                    batch.update(userRef, {
                        balances: {
                            USDT: userBalance - tradeData.margin,
                            BTC: 0,
                            ETH: 0
                        },
                        lastUpdated: serverTimestamp()
                    });
                }

                await batch.commit();

                return {
                    success: true,
                    positionId: positionRef.id,
                    position: { ...position, id: positionRef.id }
                };
            } 
            // For limit orders, create a pending order
            else if (tradeData.orderMode === 'limit') {
                return await this.createLimitOrder(userId, tradeData);
            }
            
            throw new Error('Invalid order mode');
        } catch (error) {
            console.error('Error opening position:', error);
            throw new Error('Failed to open position');
        }
    },

    async closePosition(userId, positionId, closePrice) {
        try {
            const batch = writeBatch(db);
            const positionRef = doc(db, 'positions', positionId);
            const userRef = doc(db, 'users', userId);

            const positionDoc = await getDoc(positionRef);
            if (!positionDoc.exists()) throw new Error('Position not found');

            const position = positionDoc.data();
            
            // Validate closePrice
            if (!closePrice || isNaN(closePrice) || closePrice <= 0) {
                console.error('Invalid close price:', closePrice);
                throw new Error('Invalid close price');
            }
            
            console.log(`Calculating PnL for position ${positionId} with close price ${closePrice}`);
            
            const pnl = calculatePnL(position, closePrice);
            let returnAmount = +(position.margin + pnl).toFixed(2);
            let bonusUsed = 0;
            let liquidationProtected = false;
            
            console.log(`Position ${positionId} PnL: ${pnl}, Initial Return Amount: ${returnAmount}`);

            // Check if the user would be liquidated (negative PnL exceeds margin)
            if (returnAmount <= 0) {
                // User would be liquidated, check for liquidation protection bonus
                const userDoc = await getDoc(userRef);
                if (!userDoc.exists()) {
                    throw new Error('User document not found');
                }
                
                const userData = userDoc.data();
                
                // Check if bonus account exists and is active
                if (userData.bonusAccount && 
                    userData.bonusAccount.isActive && 
                    userData.bonusAccount.purpose === 'liquidation_protection' &&
                    userData.bonusAccount.amount > 0) {
                    
                    console.log(`User has liquidation protection bonus: ${userData.bonusAccount.amount} USDT`);
                    
                    // Calculate how much bonus is needed
                    const neededBonus = Math.abs(returnAmount);
                    
                    // Use either the full needed amount or whatever is available in bonus
                    bonusUsed = Math.min(neededBonus, userData.bonusAccount.amount);
                    
                    console.log(`Using ${bonusUsed} USDT from bonus for liquidation protection`);
                    
                    // Adjust the return amount with the bonus
                    returnAmount = Math.max(0, returnAmount + bonusUsed);
                    liquidationProtected = true;
                    
                    // Update the bonus amount
                    batch.update(userRef, {
                        'bonusAccount.amount': increment(-bonusUsed),
                        'bonusAccount.lastUsed': serverTimestamp(),
                        'bonusAccount.usageHistory': arrayUnion({
                            date: new Date(),
                            amount: bonusUsed,
                            positionId,
                            reason: 'liquidation_protection'
                        })
                    });
                    
                    console.log(`Updated return amount after bonus: ${returnAmount}`);
                }
                else {
                    console.log(`User has no active liquidation protection bonus or it's depleted`);
                    // User has no bonus or it's depleted, they get liquidated (return 0)
                    returnAmount = 0;
                }
            }

            // Update the position data
            batch.update(positionRef, {
                status: 'CLOSED',
                closePrice,
                closeTime: serverTimestamp(),
                finalPnL: pnl,
                returnAmount,
                bonusUsed,
                liquidationProtected
            });

            // Check if user has balances field
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('User document not found');
            }
            
            const userData = userDoc.data();
            console.log('User data when closing position:', userData);
            
            // Only update user balance if there's something to return
            if (returnAmount > 0) {
                // If user has balances object, update it directly
                if (userData.balances) {
                    console.log(`Updating user balances.USDT with returnAmount: ${returnAmount}`);
                    batch.update(userRef, {
                        [`balances.USDT`]: increment(returnAmount)
                    });
                } else {
                    // For legacy users, create the balances object
                    console.log('User has no balances field, creating it');
                    
                    // Check if there's a balances document for this user
                    let existingBalance = 0;
                    try {
                        const balanceDoc = await getDoc(doc(db, 'balances', userId));
                        if (balanceDoc.exists()) {
                            existingBalance = balanceDoc.data().USDT || 0;
                        }
                    } catch (err) {
                        console.warn('Error fetching balance document:', err);
                    }
                    
                    // Create balances field and add the return amount
                    batch.update(userRef, {
                        balances: {
                            USDT: existingBalance + returnAmount,
                            BTC: 0,
                            ETH: 0
                        }
                    });
                }
            }

            await batch.commit();

            return { 
                success: true, 
                pnl, 
                returnAmount,
                bonusUsed,
                liquidationProtected 
            };
        } catch (error) {
            console.error('Error closing position:', error);
            throw new Error('Failed to close position');
        }
    },

    // Create a new limit order
    async createLimitOrder(userId, tradeData) {
        try {
            console.log('===== CREATING LIMIT ORDER IN SERVICE =====');
            console.log('User ID:', userId);
            console.log('Trade data:', tradeData);
            
            const batch = writeBatch(db);
            const orderRef = doc(collection(db, 'limitOrders'));
            const userRef = doc(db, 'users', userId);
            
            // Check if user has sufficient balance
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) throw new Error('User not found');
            
            const userData = userDoc.data();
            console.log('User data when creating limit order:', userData);
            
            // Determine user balance
            let userBalance = 0;
            
            if (userData.balances && typeof userData.balances.USDT === 'number') {
                userBalance = userData.balances.USDT;
            } else {
                // Try to get balance from a separate balances document (legacy)
                try {
                    const balanceDoc = await getDoc(doc(db, 'balances', userId));
                    if (balanceDoc.exists()) {
                        userBalance = balanceDoc.data().USDT || 0;
                    }
                } catch (err) {
                    console.warn('Error fetching balance document:', err);
                }
            }
            
            console.log(`User balance: ${userBalance}, Required margin: ${tradeData.margin}`);
            
            if (userBalance < tradeData.margin) {
                throw new Error('Insufficient balance for limit order');
            }
            
            // Create a consistent limit order object with all necessary fields
            const limitOrder = {
                userId,
                symbol: tradeData.symbol,
                type: tradeData.type,
                side: tradeData.side || tradeData.type, // Ensure side is consistent with type if not provided
                amount: tradeData.amount,
                leverage: tradeData.leverage,
                targetPrice: tradeData.entryPrice, // The price at which the order should execute
                price: tradeData.entryPrice, // Add price field for compatibility
                margin: tradeData.margin,
                status: 'PENDING',
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp()
            };

            console.log('Creating limit order in Firestore:', limitOrder);
            batch.set(orderRef, limitOrder);
            
            // Update user balance based on document structure
            if (userData.balances) {
                // User has balances field, update it directly
                batch.update(userRef, {
                    [`balances.USDT`]: increment(-tradeData.margin),
                    [`reservedBalance.USDT`]: increment(tradeData.margin),
                    lastUpdated: serverTimestamp()
                });
            } else {
                // For legacy users, create the balances object
                console.log('User has no balances field, creating it with reserved balance');
                
                batch.update(userRef, {
                    balances: {
                        USDT: userBalance - tradeData.margin,
                        BTC: 0,
                        ETH: 0
                    },
                    reservedBalance: {
                        USDT: tradeData.margin,
                    },
                    lastUpdated: serverTimestamp()
                });
            }

            await batch.commit();
            console.log('Limit order created successfully:', orderRef.id);

            return {
                success: true,
                orderId: orderRef.id,
                order: { ...limitOrder, id: orderRef.id }
            };
        } catch (error) {
            console.error('Error creating limit order:', error);
            throw new Error(`Failed to create limit order: ${error.message}`);
        }
    },

    // Cancel a limit order
    async cancelLimitOrder(userId, orderId) {
        try {
            const batch = writeBatch(db);
            const orderRef = doc(db, 'limitOrders', orderId);
            const userRef = doc(db, 'users', userId);

            const orderDoc = await getDoc(orderRef);
            if (!orderDoc.exists()) throw new Error('Order not found');

            const order = orderDoc.data();
            
            // Verify the order belongs to this user
            if (order.userId !== userId) {
                throw new Error('Unauthorized to cancel this order');
            }
            
            // Return the reserved margin to user's available balance
            batch.update(userRef, {
                [`balances.USDT`]: increment(order.margin),
                [`reservedBalance.USDT`]: increment(-order.margin),
                lastUpdated: serverTimestamp()
            });
            
            // Delete the limit order
            batch.delete(orderRef);

            await batch.commit();

            return { success: true };
        } catch (error) {
            console.error('Error canceling limit order:', error);
            throw new Error('Failed to cancel limit order');
        }
    },
    
    // Get limit orders for a user
    async getLimitOrders(userId, symbol = null) {
        try {
            console.log('Getting limit orders for user:', userId, 'symbol:', symbol);
            let q;
            if (symbol) {
                q = query(
                    collection(db, 'limitOrders'), 
                    where('userId', '==', userId),
                    where('symbol', '==', symbol),
                    where('status', '==', 'PENDING')
                );
                console.log('Querying with symbol filter:', symbol);
            } else {
                q = query(
                    collection(db, 'limitOrders'), 
                    where('userId', '==', userId),
                    where('status', '==', 'PENDING')
                );
                console.log('Querying without symbol filter');
            }
            
            const snapshot = await getDocs(q);
            const orders = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                orders.push({
                    id: doc.id,
                    ...data
                });
            });
            
            console.log(`Found ${orders.length} pending limit orders:`, orders);
            return orders;
        } catch (error) {
            console.error('Error getting limit orders:', error);
            throw new Error('Failed to fetch limit orders');
        }
    },
    
    /**
     * Get pending limit orders for a user - alias for getLimitOrders
     * @param {string} userId - User ID
     * @param {string} symbol - Optional symbol to filter by
     * @returns {Promise<Array>} - Array of pending limit orders
     */
    async getPendingLimitOrders(userId, symbol = null) {
        return this.getLimitOrders(userId, symbol);
    },
    
    // Check and execute limit orders if conditions are met
    async checkAndExecuteLimitOrders(userId, symbol, currentPrice) {
        try {
            if (!currentPrice || isNaN(currentPrice)) return { executed: 0 };
            
            const orders = await this.getLimitOrders(userId, symbol);
            let executedCount = 0;
            
            for (const order of orders) {
                const shouldExecute = this.shouldExecuteLimitOrder(order, currentPrice);
                
                if (shouldExecute) {
                    await this.executeLimitOrder(order, currentPrice);
                    executedCount++;
                }
            }
            
            return { executed: executedCount };
        } catch (error) {
            console.error('Error checking limit orders:', error);
            throw new Error('Failed to check limit orders');
        }
    },
    
    // Determine if a limit order should be executed based on price
    shouldExecuteLimitOrder(order, currentPrice) {
        console.log('Checking if order should execute:', order);
        console.log('Current price:', currentPrice);
        
        // Handle both field naming conventions
        const orderType = (order.side || order.type || '').toLowerCase();
        const orderPrice = parseFloat(order.price || order.targetPrice);
        const marketPrice = parseFloat(currentPrice);
        
        console.log(`Order type: ${orderType}, Order price: ${orderPrice}, Market price: ${marketPrice}`);
        
        if (orderType === 'buy') {
            // Buy order executes when price falls to or below target price
            const shouldExecute = marketPrice <= orderPrice;
            console.log(`Buy order should execute? ${shouldExecute} (${marketPrice} <= ${orderPrice})`);
            return shouldExecute;
        } else if (orderType === 'sell') {
            // Sell order executes when price rises to or above target price
            const shouldExecute = marketPrice >= orderPrice;
            console.log(`Sell order should execute? ${shouldExecute} (${marketPrice} >= ${orderPrice})`);
            return shouldExecute;
        }
        
        console.log('Unknown order type:', orderType);
        return false;
    },
    
    /**
     * Execute a pending limit order by creating a market position
     * Simplified and robust implementation
     */
    async executeLimitOrder(order) {
        try {
            console.log('⚙️ EXECUTE LIMIT ORDER SERVICE:', order);
            let orderId, orderData;
            
            // Handle case when order is passed as an object
            if (typeof order === 'object' && order.id) {
                orderId = order.id;
                orderData = {...order};
            } 
            // Handle case when order is passed as an ID string
            else if (typeof order === 'string') {
                orderId = order;
                const orderDoc = await getDoc(doc(db, 'limitOrders', orderId));
                if (!orderDoc.exists()) {
                    throw new Error(`Limit order ${orderId} not found`);
                }
                orderData = {
                    ...orderDoc.data(),
                    id: orderId
                };
            } else {
                throw new Error('Invalid order format');
            }
            
            // Verify the order exists and get latest data
            const orderRef = doc(db, 'limitOrders', orderId);
            const orderSnapshot = await getDoc(orderRef);
            
            if (!orderSnapshot.exists()) {
                throw new Error(`Limit order not found: ${orderId}`);
            }
            
            // Get fresh order data
            const freshOrderData = orderSnapshot.data();
            
            // Handle case where order was already executed
            if (freshOrderData.status !== 'PENDING') {
                console.log(`Order ${orderId} is already ${freshOrderData.status}`);
                return { 
                    success: false, 
                    error: `Order is already ${freshOrderData.status}`
                };
            }
            
            // Check if a position already exists for this limit order
            const existingPositionsQuery = query(
                collection(db, 'positions'),
                where('limitOrderId', '==', orderId)
            );
            
            const existingPositionsSnapshot = await getDocs(existingPositionsQuery);
            
            if (!existingPositionsSnapshot.empty) {
                console.log(`Position already exists for limit order ${orderId}`);
                
                // Return the first existing position
                const existingPosition = {
                    ...existingPositionsSnapshot.docs[0].data(),
                    id: existingPositionsSnapshot.docs[0].id
                };
                
                // Convert timestamp to string for UI
                if (existingPosition.openTime) {
                    existingPosition.openTime = new Date(existingPosition.openTime.seconds * 1000).toISOString();
                }
                
                return {
                    success: true,
                    position: existingPosition,
                    message: 'Position already exists for this order'
                };
            }
            
            console.log('⚙️ Creating position from order:', orderData);
            
            // Try to use a transaction for atomic operations
            try {
                // Start transaction
                const result = await runTransaction(db, async (transaction) => {
                    // 1. Create position document
                    const positionRef = doc(collection(db, 'positions'));
                    const position = {
                        userId: orderData.userId,
                        symbol: orderData.symbol,
                        type: (orderData.side || orderData.type || 'buy').toLowerCase(),
                        side: (orderData.side || orderData.type || 'buy').toLowerCase(),
                        amount: parseFloat(orderData.amount),
                        leverage: parseInt(orderData.leverage || 1),
                        entryPrice: parseFloat(orderData.price || orderData.targetPrice),
                        margin: parseFloat(orderData.margin),
                        status: 'OPEN',
                        openTime: serverTimestamp(),
                        lastUpdated: serverTimestamp(),
                        orderMode: 'market',
                        limitOrderId: orderId,
                        pnl: 0,
                        closePrice: null,
                        closeTime: null,
                        finalPnL: null
                    };
                    
                    transaction.set(positionRef, position);
                    
                    // 2. Delete the limit order
                    transaction.delete(orderRef);
                    
                    // 3. Update user's reserved balance if needed
                    if (orderData.userId) {
                        const userRef = doc(db, 'users', orderData.userId);
                        const userDoc = await transaction.get(userRef);
                        
                        if (userDoc.exists() && userDoc.data().reservedBalance?.USDT) {
                            transaction.update(userRef, {
                                'reservedBalance.USDT': increment(-orderData.margin),
                                lastUpdated: serverTimestamp()
                            });
                        }
                    }
                    
                    // Return the position with ID for the caller
                    return {
                        success: true,
                        position: {
                            ...position,
                            id: positionRef.id,
                            openTime: new Date().toISOString() // Convert timestamp for UI
                        }
                    };
                });
                
                console.log('⚙️ Transaction completed successfully:', result);
                return result;
            } catch (txError) {
                console.error('⚙️ Transaction failed:', txError);
                
                // Check again if position was created (could be race condition)
                const checkAgainQuery = query(
                    collection(db, 'positions'),
                    where('limitOrderId', '==', orderId)
                );
                
                const checkAgainSnapshot = await getDocs(checkAgainQuery);
                
                if (!checkAgainSnapshot.empty) {
                    console.log(`Position was actually created for limit order ${orderId}`);
                    
                    // Return the existing position
                    const existingPosition = {
                        ...checkAgainSnapshot.docs[0].data(),
                        id: checkAgainSnapshot.docs[0].id
                    };
                    
                    // Convert timestamp to string for UI
                    if (existingPosition.openTime) {
                        existingPosition.openTime = new Date(existingPosition.openTime.seconds * 1000).toISOString();
                    }
                    
                    return {
                        success: true,
                        position: existingPosition,
                        message: 'Position existed despite transaction error'
                    };
                }
                
                // Fallback approach if transaction fails
                console.log('⚙️ Using fallback approach');
                
                // Create position document
                const position = {
                    userId: orderData.userId,
                    symbol: orderData.symbol,
                    type: (orderData.side || orderData.type || 'buy').toLowerCase(),
                    side: (orderData.side || orderData.type || 'buy').toLowerCase(),
                    amount: parseFloat(orderData.amount),
                    leverage: parseInt(orderData.leverage || 1),
                    entryPrice: parseFloat(orderData.price || orderData.targetPrice),
                    margin: parseFloat(orderData.margin),
                    status: 'OPEN',
                    openTime: serverTimestamp(),
                    lastUpdated: serverTimestamp(),
                    orderMode: 'market',
                    limitOrderId: orderId,
                    pnl: 0,
                    closePrice: null,
                    closeTime: null,
                    finalPnL: null
                };
                
                // Add position directly
                const positionRef = await addDoc(collection(db, 'positions'), position);
                
                // Delete the limit order
                await deleteDoc(orderRef);
                
                // Update user's reserved balance if needed
                if (orderData.userId) {
                    try {
                        const userRef = doc(db, 'users', orderData.userId);
                        await updateDoc(userRef, {
                            'reservedBalance.USDT': increment(-orderData.margin),
                            lastUpdated: serverTimestamp()
                        });
                    } catch (userError) {
                        console.error('Failed to update user balance:', userError);
                        // Continue anyway, the position is created
                    }
                }
                
                return {
                    success: true,
                    position: {
                        ...position,
                        id: positionRef.id,
                        openTime: new Date().toISOString() // Convert timestamp for UI
                    }
                };
            }
        } catch (error) {
            console.error('⚙️ Error executing limit order:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Get user's bonus account details
    async getUserBonusAccount(userId) {
        try {
            if (!userId) throw new Error('User ID is required');
            
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('User not found');
            }
            
            const userData = userDoc.data();
            
            if (!userData.bonusAccount) {
                // No bonus account exists
                return {
                    exists: false,
                    message: 'No bonus account found'
                };
            }
            
            // Return the full bonus account details
            return {
                exists: true,
                bonusAccount: userData.bonusAccount,
                formattedAmount: `${userData.bonusAccount.amount.toFixed(2)} ${userData.bonusAccount.currency}`,
                isActive: userData.bonusAccount.isActive,
                expiryDate: userData.bonusAccount.expiresAt ? new Date(userData.bonusAccount.expiresAt.seconds * 1000) : null,
                usageHistory: userData.bonusAccount.usageHistory || []
            };
        } catch (error) {
            console.error('Error fetching bonus account:', error);
            throw new Error('Failed to fetch bonus account details');
        }
    },

    /**
     * Get all open positions for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} - Array of positions
     */
    async getUserPositions(userId) {
        try {
            const q = query(
                collection(db, 'positions'),
                where('userId', '==', userId),
                where('status', '==', 'OPEN')
            );
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
        } catch (error) {
            console.error('Error getting user positions:', error);
            return [];
        }
    },

    /**
     * Updates the target price of a limit order
     * @param {string} userId - User ID
     * @param {string} orderId - Limit order ID
     * @param {number} newPrice - New target price
     * @returns {Promise<Object>} - Result of the update operation
     */
    async updateLimitOrderPrice(userId, orderId, newPrice) {
        try {
            // Validate parameters
            if (!userId) throw new Error('User ID is required');
            if (!orderId) throw new Error('Order ID is required');
            if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
                throw new Error('Invalid price');
            }
            
            // Get order reference
            const orderRef = doc(db, 'limitOrders', orderId);
            
            // Get the order to check ownership
            const orderSnap = await getDoc(orderRef);
            
            if (!orderSnap.exists()) {
                throw new Error('Order not found');
            }
            
            const orderData = orderSnap.data();
            
            // Verify the order belongs to this user
            if (orderData.userId !== userId) {
                throw new Error('Unauthorized to update this order');
            }
            
            // Update the order
            await updateDoc(orderRef, {
                targetPrice: newPrice,
                price: newPrice, // Update both fields for compatibility
                lastUpdated: serverTimestamp()
            });
            
            return { 
                success: true,
                message: 'Order updated successfully'
            };
        } catch (error) {
            console.error('Error updating limit order price:', error);
            throw new Error(`Failed to update order: ${error.message}`);
        }
    }
};

function calculatePnL(position, closePrice) {
    const { type, entryPrice, leverage, margin } = position;
    
    if (type === 'buy') {
        const priceDiff = closePrice - entryPrice;
        const percentageChange = (priceDiff / entryPrice) * 100;
        return +(margin * (percentageChange / 100) * leverage).toFixed(2);
    } else {
        const priceDiff = entryPrice - closePrice;
        const percentageChange = (priceDiff / entryPrice) * 100;
        return +(margin * (percentageChange / 100) * leverage).toFixed(2);
    }
}

function calculateLiquidationPrice(order) {
    if (!order) return 0;
    
    try {
        const entryPriceNum = parseFloat(order.entryPrice);
        const leverageNum = parseFloat(order.leverage);
        
        if (isNaN(entryPriceNum) || isNaN(leverageNum) || leverageNum === 0) {
            console.warn("Invalid entry price or leverage for liquidation calculation", order);
            return 0;
        }
        
        // Calculate the liquidation threshold (percentage of margin that triggers liquidation)
        const liquidationThreshold = 0.8;
        
        // Calculate liquidation price based on position type (buy/long or sell/short)
        if (order.type === 'buy') {
            // For long positions, liquidation happens when price falls
            // Formula: entry_price - (entry_price / leverage) * liquidationThreshold
            return entryPriceNum * (1 - (liquidationThreshold / leverageNum));
        } else {
            // For short positions, liquidation happens when price rises
            // Formula: entry_price + (entry_price / leverage) * liquidationThreshold
            return entryPriceNum * (1 + (liquidationThreshold / leverageNum));
        }
    } catch (error) {
        console.error("Error calculating liquidation price:", error);
        return 0;
    }
}

// Export all services
export default {
    ...tradingService
}; 