import React, { useState, useEffect } from 'react';
import './styles.scss';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

import img from '../../assets/images/logo/log-footer.png'
import img1 from '../../assets/images/logo/logo-footer-dark.png'

// Define keyframe animations
const glow = keyframes`
  0% {
    box-shadow: 0 0 10px rgba(247, 147, 26, 0.3), 0 0 20px rgba(247, 147, 26, 0.1);
  }
  50% {
    box-shadow: 0 0 20px rgba(247, 147, 26, 0.5), 0 0 40px rgba(247, 147, 26, 0.2);
  }
  100% {
    box-shadow: 0 0 10px rgba(247, 147, 26, 0.3), 0 0 20px rgba(247, 147, 26, 0.1);
  }
`;

const textGlow = keyframes`
  0% {
    text-shadow: 0 0 5px rgba(247, 147, 26, 0.3);
  }
  50% {
    text-shadow: 0 0 10px rgba(247, 147, 26, 0.6);
  }
  100% {
    text-shadow: 0 0 5px rgba(247, 147, 26, 0.3);
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const shine = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Styled Components
const FooterContainer = styled.footer`
  position: relative;
  margin: 0 auto;
  max-width: 1200px;
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  background: linear-gradient(180deg, rgba(19, 19, 27, 0.7) 0%, rgba(33, 33, 41, 0.7) 100%);
  border: 1px solid rgba(247, 147, 26, 0.1);
  margin-bottom: 20px;
  padding: 20px 20px 10px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 10% 20%, rgba(247, 147, 26, 0.2) 0%, transparent 30%),
      radial-gradient(circle at 80% 60%, rgba(247, 147, 26, 0.15) 0%, transparent 30%);
    background-size: 200% 200%;
    z-index: -1;
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(247, 147, 26, 0.5), transparent);
    z-index: 1;
  }
`;

const FooterMain = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const InfoColumn = styled.div`
  flex: 1;
  min-width: 250px;
  margin-bottom: 10px;
  padding-right: 20px;
  
  @media (max-width: 768px) {
    flex: 0 0 100%;
    padding-right: 0;
  }
`;

const Logo = styled(Link)`
  display: block;
  margin-bottom: 15px;
  
  img {
    max-width: 120px;
    filter: drop-shadow(0 0 8px rgba(247, 147, 26, 0.4));
  }
`;

const ContactHeading = styled.h6`
  font-size: 16px;
  margin-bottom: 10px;
  background: linear-gradient(to right, #F7931A, #FFDB60);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${textGlow} 3s infinite ease-in-out;
`;

const ContactList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    margin-bottom: 10px;
    
    p {
      color: #fff;
      font-size: 14px;
      transition: all 0.3s ease;
      
      &:hover {
        text-shadow: 0 0 8px rgba(247, 147, 26, 0.6);
        color: #F7931A;
      }
    }
  }
`;

const WidgetColumn = styled.div`
  flex: 1;
  min-width: 200px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex: 0 0 50%;
  }
  
  @media (max-width: 480px) {
    flex: 0 0 100%;
  }
`;

const Widget = styled.div`
  display: flex;
  justify-content: space-between;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const WidgetLink = styled.div`
  flex: 1;
  
  h6 {
    font-size: 14px;
    letter-spacing: 0.7px;
    margin-bottom: 15px;
    background: linear-gradient(90deg, #F7931A, #FFDB60);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ${textGlow} 3s infinite ease-in-out;
    font-weight: 700;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      margin-bottom: 8px;
      
      a {
        color: #fff;
        font-size: 14px;
        transition: all 0.3s ease;
        
        &:hover {
          text-shadow: 0 0 8px rgba(247, 147, 26, 0.6);
          color: #F7931A;
          transform: translateX(5px);
          display: inline-block;
        }
      }
    }
  }
`;

const NewsletterColumn = styled.div`
  flex: 1;
  min-width: 250px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    flex: 0 0 100%;
  }
`;

const NewsletterHeading = styled.h5`
  font-size: 18px;
  margin-bottom: 15px;
  background: linear-gradient(to right, #F7931A, #FFDB60);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${textGlow} 3s infinite ease-in-out;
`;

const NewsletterText = styled.p`
  color: #fff;
  font-size: 14px;
  margin-bottom: 15px;
`;

const NewsletterForm = styled.form`
  display: flex;
  margin-bottom: 20px;
  position: relative;
  
  input {
    flex: 1;
    height: 46px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(247, 147, 26, 0.2);
    border-radius: 8px;
    padding: 0 15px;
    color: #fff;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: rgba(247, 147, 26, 0.5);
      box-shadow: 0 0 10px rgba(247, 147, 26, 0.3);
    }
  }
  
  button {
    position: absolute;
    right: 5px;
    top: 5px;
    height: 36px;
    background: linear-gradient(90deg, #F7931A, #FFDB60);
    border: none;
    border-radius: 6px;
    color: #000;
    font-weight: 500;
    padding: 0 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      filter: brightness(1.1);
      box-shadow: 0 0 10px rgba(247, 147, 26, 0.5);
    }
  }
`;

const SocialList = styled.ul`
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    margin-right: 15px;
    
    a {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(247, 147, 26, 0.2);
      border-radius: 50%;
      color: #fff;
      transition: all 0.3s ease;
      
      &:hover {
        background: linear-gradient(90deg, #F7931A, #FFDB60);
        color: #000;
        box-shadow: 0 0 10px rgba(247, 147, 26, 0.5);
        transform: translateY(-3px);
      }
      
      span {
        font-size: 14px;
      }
    }
  }
`;

const FooterBottom = styled.div`
  text-align: center;
  padding-top: 10px;
  border-top: 1px solid rgba(247, 147, 26, 0.1);
  
  p {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    padding-bottom: 5px;
    
    &:hover {
      color: #F7931A;
      text-shadow: 0 0 5px rgba(247, 147, 26, 0.4);
    }
  }
`;

const ScrollTop = styled(Link)`
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(90deg, #F7931A, #FFDB60);
  border-radius: 50%;
  color: #000;
  box-shadow: 0 0 15px rgba(247, 147, 26, 0.4);
  transition: all 0.3s ease;
  z-index: 99;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 20px rgba(247, 147, 26, 0.6);
  }
  
  &::before {
    content: '↑';
    font-size: 20px;
    font-weight: bold;
  }
`;

function Footer(props) {
    const [productLink] = useState([
        {
            title: 'Market',
            path: '/market'
        },
        {
            title: 'Deposit',
            path: '/deposit'
        }
    ]);
    const [servicesLink] = useState([
        {
            title: 'Sign Up',
            path: '/register'
        },
        {
            title: 'Login',
            path: '/login'
        }
    ]);

    const [listSocial] = useState([
        {
            icon: 'icon-twitter',
            path: 'https://x.com/ripple_exch'
        },
    ]);

    const [isVisible, setIsVisible] = useState(false);

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    };
  
    useEffect(() => {
      const toggleVisibility = () => {
        if (window.pageYOffset > 500) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      };
  
      window.addEventListener("scroll", toggleVisibility);
  
      return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    return (
        <FooterContainer>
            <FooterMain>
                <InfoColumn>
                    <Logo to="/">
                        <img src={img} alt="Ripple Exchange" />
                    </Logo>
                    <ContactHeading>Let's talk! 🤙</ContactHeading>
                    <ContactList>
                        <li><p>support@rippleexchange.org</p></li>
                        <li>
                            <p>
                            Cecilia Chapman 711-2880 Nulla St. Mankato Mississippi
                            96522
                            </p>
                        </li>
                    </ContactList>
                </InfoColumn>
                
                <WidgetColumn>
                    <Widget>
                        <WidgetLink>
                            <h6>PRODUCTS</h6>
                        <ul>
                            {
                                productLink.map((data,idx) => (
                                    <li key={idx}><Link to={data.path}>{data.title}</Link></li>
                                ))
                            }
                        </ul>
                        </WidgetLink>
                        <WidgetLink>
                            <h6>SERVICES</h6>
                        <ul>
                            {
                                servicesLink.map((data,idx) => (
                                    <li key={idx}><Link to={data.path}>{data.title}</Link></li>
                                ))
                            }
                        </ul>
                        </WidgetLink>
                    </Widget>
                </WidgetColumn>
                
                <NewsletterColumn>
                    <NewsletterHeading>Newsletters</NewsletterHeading>
                    <NewsletterText>
                        Subscribe our newsletter to get more free design course and
                        resource.
                    </NewsletterText>
                    <NewsletterForm action="#">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            required=""
                        />
                        <button type="submit">Submit</button>
                    </NewsletterForm>
                    <SocialList>
                            {
                                listSocial.map((data,idx) => (
                                    <li key={idx}>
                                        <Link to={data.path}><span className={data.icon}></span></Link>
                                    </li>
                                ))
                            }
                    </SocialList>
                </NewsletterColumn>
            </FooterMain>
            
            <FooterBottom>
                <p>
                    ©2025 RippleExchange.org. All rights reserved. Terms of Service | Privacy
                    Terms
                </p>
            </FooterBottom>

            {isVisible && <ScrollTop onClick={scrollToTop} to='#'></ScrollTop>}
        </FooterContainer>
    );
}

export default Footer;