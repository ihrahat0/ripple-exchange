import React , { useState , useEffect } from 'react';

import { Link , NavLink } from 'react-router-dom';
import menus from '../../pages/menu';
import { Dropdown } from 'react-bootstrap';

import './styles.scss';
import logo from '../../assets/images/logo/logo.png';
import logodark from '../../assets/images/logo/logo-dark.png';
import avt from '../../assets/images/avt/avt-01.jpg';
import DarkMode from './DarkMode';

import icon1 from '../../assets/images/flags/us.jpg'
import icon2 from '../../assets/images/flags/spain.jpg'
import icon3 from '../../assets/images/flags/germany.jpg'
import icon4 from '../../assets/images/flags/italy.jpg'
import icon5 from '../../assets/images/flags/russia.jpg'
// import Button from '../button';



const Header = () => {

    const [scroll, setScroll] = useState(false);
        useEffect(() => {
        window.addEventListener("scroll", () => {
            setScroll(window.scrollY > 300);
        });
        return () => {
            setScroll({});
        }
    }, []);

    const [menuActive, setMenuActive] = useState(null);

    const handleMenuActive = () => {
        setMenuActive(!menuActive);
      };

    
    const [activeIndex, setActiveIndex] = useState(null);
    const handleDropdown = index => {
        setActiveIndex(index); 
    };

    return (
        <header id="header_main" className={`header ${scroll ? 'is-fixed' : ''}`}>
            <div className="container-fluid">
                <div className="row">
                <div className="col-12">
                    <div className="header__body d-flex justify-content-between">
                    <div className="header__left">
                        <div className="logo">
                        <NavLink to='/' className="light">
                            <img
                            src={logo}
                            alt="Ripple Exchange"
                            />
                        </NavLink>
                        <NavLink to='/' className="dark">
                            <img
                            src={logodark}
                            alt="Ripple Exchange"
                            />
                        </NavLink>
                        </div>
                        <div className="left__main">
                            <nav id="main-nav" className={`main-nav ${menuActive ? 'active' : ''}`}>
                                <ul id="menu-primary-menu" className="menu">
                                {
                                    menus.map((data,idx) => (
                                        <li key={idx} onClick={()=> handleDropdown(idx)} className={`menu-item ${data.namesub ? 'menu-item-has-children' : ''} ${activeIndex === idx ? 'active' : ''}`} 
                                        
                                        >
                                            <Link to={data.links}>{data.name}</Link>
                                            {
                                                data.namesub &&
                                                <ul className="sub-menu">
                                                    {
                                                        data.namesub.map((submenu) => (
                                                            <li key={submenu.id} className="menu-item"><NavLink to={submenu.links}>{submenu.sub}</NavLink></li>
                                                        ))
                                                    }
                                                </ul>
                                            }
                                            
                                        </li>
                                    ))
                                }
                                </ul>
                            </nav>
                            
                 
                        </div>
                    </div>

                    <div className="header__right">
                            <Dropdown>
                                <Dropdown.Toggle >
                                    Assets      
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                <Dropdown.Item href="#">
                                    <li data-toggle="modal" data-target="#delete_client">Binance Visa Card</li>
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                    <li data-toggle="modal" data-target="#edit_client">Crypto Loans</li>
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                    <li data-toggle="modal" data-target="#edit_client">Binance Pay</li>
                                </Dropdown.Item>
                                
                                </Dropdown.Menu>
                            </Dropdown>

                            <Dropdown>
                                <Dropdown.Toggle >
                                Orders & Trades    
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                <Dropdown.Item href="#">
                                    <li data-toggle="modal" data-target="#delete_client">Binance Convert</li>
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                    <li data-toggle="modal" data-target="#edit_client">Spot</li>
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                    <li data-toggle="modal" data-target="#edit_client">Margin</li>
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                    <li data-toggle="modal" data-target="#edit_client">P2P</li>
                                </Dropdown.Item>
                                
                                </Dropdown.Menu>
                            </Dropdown>

                            <Dropdown>
                                <Dropdown.Toggle >
                                    EN/USD  
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                <Dropdown.Item href="#">
                                    <Link
                                        to="#"
                                        className="dropdown-item notify-item language"
                                        data-lang="en"
                                        >
                                        <img
                                            src={icon1}
                                            alt="user-image"
                                            className="me-1"
                                            height="12"
                                        />
                                        <span className="align-middle">English</span>
                                    </Link>
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                    <Link
                                        to="#"
                                        className="dropdown-item notify-item language"
                                        data-lang="en"
                                        >
                                        <img
                                            src={icon2}
                                            alt="user-image"
                                            className="me-1"
                                            height="12"
                                        />
                                        <span className="align-middle">English</span>
                                    </Link>
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                    <Link
                                        to="#"
                                        className="dropdown-item notify-item language"
                                        data-lang="en"
                                        >
                                        <img
                                            src={icon3}
                                            alt="user-image"
                                            className="me-1"
                                            height="12"
                                        />
                                        <span className="align-middle">English</span>
                                    </Link>
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                    <Link
                                        to="#"
                                        className="dropdown-item notify-item language"
                                        data-lang="en"
                                        >
                                        <img
                                            src={icon4}
                                            alt="user-image"
                                            className="me-1"
                                            height="12"
                                        />
                                        <span className="align-middle">English</span>
                                    </Link>
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                    <Link
                                        to="#"
                                        className="dropdown-item notify-item language"
                                        data-lang="en"
                                        >
                                        <img
                                            src={icon5}
                                            alt="user-image"
                                            className="me-1"
                                            height="12"
                                        />
                                        <span className="align-middle">English</span>
                                    </Link>
                                </Dropdown.Item>
                                
                                
                                </Dropdown.Menu>
                            </Dropdown>

                        <DarkMode />

                        
                        <div className="dropdown notification">
                        <button
                            className="btn dropdown-toggle"
                            type="button"
                            id="dropdownMenuButton3"
                            data-toggle="dropdown"
                            aria-haspopup="true"
                            aria-expanded="false"
                        >
                            <span className="icon-notification"></span>
                        </button>

                        <div
                            className="dropdown-menu"
                            aria-labelledby="dropdownMenuButton3"
                        >
                            <div className="dropdown-item">
                            <div className="media server-log">
                                <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="feather feather-server"
                                >
                                <rect
                                    x="2"
                                    y="2"
                                    width="20"
                                    height="8"
                                    rx="2"
                                    ry="2"
                                ></rect>
                                <rect
                                    x="2"
                                    y="14"
                                    width="20"
                                    height="8"
                                    rx="2"
                                    ry="2"
                                ></rect>
                                <line x1="6" y1="6" x2="6" y2="6"></line>
                                <line x1="6" y1="18" x2="6" y2="18"></line>
                                </svg>
                                <div className="media-body">
                                <div className="data-info">
                                    <h6 className="">Server Rebooted</h6>
                                    <p className="">45 min ago</p>
                                </div>

                                <div className="icon-status">
                                    <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="feather feather-x"
                                    >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </div>
                                </div>
                            </div>
                            </div>

                            <div className="dropdown-item">
                            <div className="media">
                                <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="feather feather-heart"
                                >
                                <path
                                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                                ></path>
                                </svg>
                                <div className="media-body">
                                <div className="data-info">
                                    <h6 className="">Licence Expiring Soon</h6>
                                    <p className="">8 hrs ago</p>
                                </div>

                                <div className="icon-status">
                                    <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="feather feather-x"
                                    >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </div>
                                </div>
                            </div>
                            </div>

                            <div className="dropdown-item">
                            <div className="media file-upload">
                                <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="feather feather-file-text"
                                >
                                <path
                                    d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                                ></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <div className="media-body">
                                <div className="data-info">
                                    <h6 className="">Kelly Portfolio.pdf</h6>
                                    <p className="">670 kb</p>
                                </div>

                                <div className="icon-status">
                                    <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="feather feather-check"
                                    >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                        <div className={`mobile-button ${menuActive ? 'active' : ''}`} onClick={handleMenuActive}><span></span></div>
                        <div className="wallet">
                        <Link to="/wallet"> Wallet </Link>
                        </div>

                        
                        <Dropdown className='user'>
                                <Dropdown.Toggle >
                                    <img src={avt} alt="Ripple Exchange" />  
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                <Dropdown.Item href="#">
                                    <Link className="dropdown-item" to="#"><i className="bx bx-user font-size-16 align-middle me-1"></i>
                                    <span>Profile</span></Link>
                                </Dropdown.Item>
                              
                                <Dropdown.Item href="#">
                                    <Link className="dropdown-item d-block" to="#"
                                    ><i
                                        className="bx bx-wrench font-size-16 align-middle me-1"
                                    ></i>
                                    <span>Settings</span></Link>
                                </Dropdown.Item>
                                <Dropdown.Item href="#">
                                    <Link className="dropdown-item text-danger" to="/login"
                                    ><i
                                        className="bx bx-power-off font-size-16 align-middle me-1 text-danger"
                                    ></i>
                                    <span>Logout</span></Link>
                                </Dropdown.Item>
                                
                                </Dropdown.Menu>
                            </Dropdown>

                        
                    </div>
                    </div>
                </div>
                </div>
            </div>
        </header>
       
    );
}

export default Header;