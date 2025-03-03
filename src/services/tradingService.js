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
    deleteDoc
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
                
                const position = {
                    userId,
                    symbol: tradeData.symbol,
                    type: tradeData.type,
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
            
            const limitOrder = {
                userId,
                symbol: tradeData.symbol,
                type: tradeData.type,
                amount: tradeData.amount,
                leverage: tradeData.leverage,
                targetPrice: tradeData.entryPrice, // The price at which the order should execute
                margin: tradeData.margin,
                status: 'PENDING',
                createdAt: serverTimestamp(),
                lastUpdated: serverTimestamp()
            };

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
            let q;
            if (symbol) {
                q = query(
                    collection(db, 'limitOrders'), 
                    where('userId', '==', userId),
                    where('symbol', '==', symbol),
                    where('status', '==', 'PENDING')
                );
            } else {
                q = query(
                    collection(db, 'limitOrders'), 
                    where('userId', '==', userId),
                    where('status', '==', 'PENDING')
                );
            }
            
            const snapshot = await getDocs(q);
            const orders = [];
            
            snapshot.forEach(doc => {
                orders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return orders;
        } catch (error) {
            console.error('Error getting limit orders:', error);
            throw new Error('Failed to fetch limit orders');
        }
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
        if (order.type === 'buy') {
            // Buy order executes when price falls to or below target price
            return currentPrice <= order.targetPrice;
        } else {
            // Sell order executes when price rises to or above target price
            return currentPrice >= order.targetPrice;
        }
    },
    
    // Execute a limit order by creating a position
    async executeLimitOrder(order, currentPrice) {
        try {
            const batch = writeBatch(db);
            const positionRef = doc(collection(db, 'positions'));
            const orderRef = doc(db, 'limitOrders', order.id);
            const userRef = doc(db, 'users', order.userId);
            
            // Create position from the limit order
            const position = {
                userId: order.userId,
                symbol: order.symbol,
                type: order.type,
                amount: order.amount,
                leverage: order.leverage,
                entryPrice: order.targetPrice, // Use the target price as entry price
                margin: order.margin,
                orderMode: 'limit',
                status: 'OPEN',
                openTime: serverTimestamp(),
                currentPnL: 0,
                lastUpdated: serverTimestamp(),
                closePrice: null,
                closeTime: null,
                finalPnL: null,
                limitOrderId: order.id // Keep a reference to the original order
            };

            // Set the new position
            batch.set(positionRef, position);
            
            // Move reserved funds to used funds (already deducted from available balance)
            batch.update(userRef, {
                [`reservedBalance.USDT`]: increment(-order.margin),
                lastUpdated: serverTimestamp()
            });
            
            // Mark the limit order as executed
            batch.update(orderRef, {
                status: 'EXECUTED',
                executedPrice: currentPrice,
                executedAt: serverTimestamp(),
                lastUpdated: serverTimestamp()
            });

            await batch.commit();

            return {
                success: true,
                positionId: positionRef.id
            };
        } catch (error) {
            console.error('Error executing limit order:', error);
            throw new Error('Failed to execute limit order');
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
     * Execute a pending limit order by moving it to positions
     * @param {string|Object} order - ID of the limit order to execute or the order object itself
     * @returns {Promise<Object>} - Result of the execution
     */
    async executeLimitOrder(order) {
        try {
            // Handle either order ID or full order object
            let orderId, orderData;
            
            if (typeof order === 'string') {
                // If we got an order ID string
                orderId = order;
                const orderRef = doc(db, 'limitOrders', orderId);
                const orderSnap = await getDoc(orderRef);
                
                if (!orderSnap.exists()) {
                    console.error(`Limit order with ID ${orderId} not found`);
                    throw new Error(`Limit order with ID ${orderId} not found`);
                }
                
                orderData = orderSnap.data();
                orderData.id = orderId; // Set the ID in the data
            } else {
                // If we got a full order object
                orderId = order.id;
                orderData = {...order}; // clone to avoid mutations
                
                // Double-check that the order exists in Firestore
                const orderRef = doc(db, 'limitOrders', orderId);
                const orderSnap = await getDoc(orderRef);
                
                if (!orderSnap.exists()) {
                    console.error(`Limit order with ID ${orderId} not found in database`);
                    throw new Error(`Limit order with ID ${orderId} not found in database`);
                }
            }
            
            console.log(`Executing limit order: ${orderData.side || orderData.type} ${orderData.amount} ${orderData.symbol} at ${orderData.price || orderData.targetPrice}`);
            
            // Create a position from the limit order
            const position = {
                id: uuidv4(),
                userId: orderData.userId,
                symbol: orderData.symbol,
                tokenAddress: orderData.tokenAddress,
                tokenType: orderData.tokenType,
                chainId: orderData.chainId,
                side: orderData.side || orderData.type, // Handle either field name
                amount: orderData.amount,
                entryPrice: orderData.price || orderData.targetPrice, // Handle either field name
                leverage: orderData.leverage,
                liquidationPrice: calculateLiquidationPrice(orderData),
                margin: orderData.margin,
                pnl: 0,
                status: 'OPEN',
                openTime: new Date().toISOString()
            };
            
            // Add position to Firebase
            const positionRef = await addDoc(collection(db, 'positions'), position);
            
            // Delete the limit order
            await deleteDoc(doc(db, 'limitOrders', orderId));
            
            console.log(`Successfully executed limit order ${orderId} and created position ${positionRef.id}`);
            
            // Return the created position
            return {
                success: true,
                position: {
                    ...position,
                    id: positionRef.id
                }
            };
        } catch (error) {
            console.error('Error executing limit order:', error);
            return {
                success: false,
                error: error.message
            };
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
    // Implementation of calculateLiquidationPrice function
    // This function should return the liquidation price based on the order data
    // For now, we'll return a placeholder value
    return 0; // Placeholder value, actual implementation needed
}

// Export all services
export default {
    ...tradingService
}; 