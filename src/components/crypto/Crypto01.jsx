import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import img1 from '../../assets/images/coin/btc.png'
import img2 from '../../assets/images/coin/eth.png'
import img3 from '../../assets/images/coin/tet.png'
import img4 from '../../assets/images/coin/bnb.png'
import './styles.scss';
import { Link } from 'react-router-dom';
import { TOKENS } from '../../assets/fake-data/data-coin';

function Crypto01() {
    const [dataCrytoTab] = useState([
        { id: 1, title: 'Crypto' },
        { id: 2, title: 'DeFi' },
        { id: 3, title: 'BSC' },
        { id: 4, title: 'NFT' },
        { id: 5, title: 'Metaverse' },
        { id: 6, title: 'Polkadot' },
        { id: 7, title: 'Solana' },
        { id: 8, title: 'Opensea' },
        { id: 9, title: 'Makersplace' },
    ]);

    const [cryptoData, setCryptoData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCryptoPrices = async () => {
        try {
            const promises = Object.entries(TOKENS).map(async ([symbol, details]) => {
                const response = await fetch(
                    `https://api.dexscreener.com/latest/dex/pairs/${details.chainId}/${details.pairAddress}`
                );
                
                if (!response.ok) throw new Error('Failed to fetch prices');
                
                const data = await response.json();
                if (!data.pairs || !data.pairs[0]) {
                    console.error(`No pair data for ${details.name}`);
                    return null;
                }
                const pair = data.pairs[0];

                let price = parseFloat(pair.priceUsd);
                let change24h = parseFloat(pair.priceChange.h24);

                if (pair.baseToken.symbol !== details.symbol) {
                    price = 1 / price;
                    change24h = -change24h;
                }

                return {
                    id: symbol,
                    active: symbol === 'bitcoin' ? 'active' : '',
                    icon: details.image,
                    name: details.name,
                    unit: details.symbol,
                    price: `$${price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    })}`,
                    pricesale: `Vol: $${Math.round(pair.volume.h24).toLocaleString()}`,
                    sale: `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`,
                    class: change24h >= 0 ? 'success' : 'critical'
                };
            });

            const results = await Promise.all(promises);
            const validResults = results.filter(Boolean);
            setCryptoData(validResults);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching crypto prices:', error);
            setError(error.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCryptoPrices();
        const interval = setInterval(fetchCryptoPrices, 15000);
        return () => clearInterval(interval);
    }, []);

    // Show error state if there's an error
    if (error) {
        console.log('Error state:', error);
    }

    const handleClick = (tradingId) => {
        console.log('Navigating to:', `/trading/${tradingId}`);
        // You can keep the Link component, this is just for debugging
    };

    if (loading) {
        return (
            <section className="crypto" data-aos="fade-up" data-aos-duration="1000">
                <div className="container">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="crypto__main">
                                Loading crypto prices...
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="crypto" data-aos="fade-up" data-aos-duration="1000">
            <div className="container">
                <div className="row">
                    <div className="col-md-12">
                        <div className="crypto__main">
                            <Tabs>
                                <TabList>
                                    {dataCrytoTab.map(idx => (
                                        <Tab key={idx.id}>{idx.title}</Tab>
                                    ))}
                                </TabList>

                                {dataCrytoTab.map(data => (
                                    <TabPanel key={data.id}>
                                        <div className="content-inner">
                                            {cryptoData.map(data => (
                                                <div key={data.id} className={`crypto-box ${data.active}`}>
                                                    <div className="left">
                                                        <Link to={`/trading/${data.id}`}>
                                                            <img 
                                                                src={TOKENS[data.id]?.image || img1} 
                                                                alt={data.name}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = img1;
                                                                }}
                                                            />
                                                            <span>{data.name}</span>
                                                            <span className="unit">{TOKENS[data.id]?.symbol}</span>
                                                        </Link>
                                                        <h6 className="price">{data.price}</h6>
                                                    </div>
                                                    <div className="right">
                                                        <div className="bottom">
                                                            <p>{data.pricesale}</p>
                                                            <p className={`sale ${data.class}`}>{data.sale}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </TabPanel>
                                ))}
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Crypto01;