import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

Coinlist01.propTypes = {
    dataCoin: PropTypes.array,
};

function Coinlist01(props) {
    const { dataCoin } = props;
    const navigate = useNavigate();

    const [dataCoinTab] = useState([
        {
            id: 1,
            title: 'All',
        },
        {
            id: 2,
            title: 'Popular',
        },
        {
            id: 3,
            title: 'Recently added',
        },
        {
            id: 4,
            title: 'Trending',
        },
        {
            id: 5,
            title: 'Memes',
        },
    ]);

    const handleTrade = (coin) => {
        const coinId = coin.name.toLowerCase().replace(/\s+/g, '-');
        navigate(`/trading/${coinId}`);
    };

    return (
        <section className="coin-list">
            <div className="container">
                <div className="row">
                    <div className="col-md-12">
                        <div className="block-text">
                            <h3 className="heading">Market Update</h3>
                            <Link to="/market" className="btn-action-2">See All Coins</Link>
                        </div>

                        <div className="coin-list__main">
                            <Tabs>
                                <TabList>
                                    {dataCoinTab.map(idx => (
                                        <Tab key={idx.id}>{idx.title}</Tab>
                                    ))}
                                </TabList>

                                {dataCoinTab.map(data => (
                                    <TabPanel key={data.id}>
                                        <div className="content-inner">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th scope="col"></th>
                                                        <th scope="col">#</th>
                                                        <th scope="col">Name</th>
                                                        <th scope="col">Last Price</th>
                                                        <th scope="col">24h %</th>
                                                        <th scope="col">Market Cap</th>
                                                        <th scope="col">Last 7 Days</th>
                                                        <th scope="col"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dataCoin.map(idx => (
                                                        <tr key={idx.id}>
                                                            <td><span className="icon-star"></span></td>
                                                            <td>{idx.id}</td>
                                                            <td>
                                                                <Link to="#">
                                                                    <img src={idx.icon} alt="Ripple Exchange" />
                                                                    <span>{idx.name}</span>
                                                                    <span className="unit">{idx.unit}</span>
                                                                </Link>
                                                            </td>
                                                            <td className="boild">{idx.price}</td>
                                                            <td className={`${idx.class}`}>{idx.sale}</td>
                                                            <td className="boild">{idx.cap}</td>
                                                            <td><img src={idx.chart} alt="Ripple Exchange" /></td>
                                                            <td>
                                                                <button 
                                                                    onClick={() => handleTrade(idx)} 
                                                                    className="btn"
                                                                >
                                                                    Trade
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
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

export default Coinlist01;