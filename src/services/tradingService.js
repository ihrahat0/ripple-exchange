import { db } from '../firebase';
import { 
    doc, 
    collection, 
    getDoc, 
    serverTimestamp,
    writeBatch,
    increment
} from 'firebase/firestore';

export const tradingService = {
    async openPosition(userId, tradeData) {
        try {
            const batch = writeBatch(db);
            const positionRef = doc(collection(db, 'positions'));
            const userRef = doc(db, 'users', userId);
            
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
            batch.update(userRef, {
                [`balances.USDT`]: increment(-tradeData.margin),
                lastUpdated: serverTimestamp()
            });

            await batch.commit();

            return {
                success: true,
                positionId: positionRef.id,
                position: { ...position, id: positionRef.id }
            };
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
            const pnl = calculatePnL(position, closePrice);
            const returnAmount = +(position.margin + pnl).toFixed(2);

            batch.update(positionRef, {
                status: 'CLOSED',
                closePrice,
                closeTime: serverTimestamp(),
                finalPnL: pnl,
                returnAmount
            });

            batch.update(userRef, {
                [`balances.USDT`]: increment(returnAmount)
            });

            await batch.commit();

            return { success: true, pnl, returnAmount };
        } catch (error) {
            console.error('Error closing position:', error);
            throw new Error('Failed to close position');
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