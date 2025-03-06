import React from 'react';
import PropTypes from 'prop-types';
import Sale01 from '../components/sale/Sale01';
import { Accordion } from 'react-bootstrap-accordion';
import styled from 'styled-components';
import dataFaq from '../assets/fake-data/data-faq';
import {Link} from 'react-router-dom';
import PageTitle from '../components/pagetitle';

// Styled components for enhanced UI
const FaqContainer = styled.section`
  padding: 98px 0 65px;
  max-width: 960px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 30%, rgba(78, 227, 255, 0.15) 0%, transparent 50%);
    z-index: -1;
    pointer-events: none;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 80% 70%, rgba(107, 115, 255, 0.15) 0%, transparent 50%);
    z-index: -1;
    pointer-events: none;
  }
  
  @media only screen and (max-width: 1200px) {
    max-width: 100%;
  }
`;

const HeaderText = styled.h3`
  background: linear-gradient(90deg, #4ee3ff, #6b73ff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: textGlow 3s ease-in-out infinite;
  margin-bottom: 15px !important;
  font-weight: 700;
  text-align: center;
  
  @keyframes textGlow {
    0% {
      text-shadow: 0 0 5px rgba(78, 227, 255, 0.3);
    }
    50% {
      text-shadow: 0 0 10px rgba(78, 227, 255, 0.6);
    }
    100% {
      text-shadow: 0 0 5px rgba(78, 227, 255, 0.3);
    }
  }
`;

const Description = styled.p`
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 30px;
  text-align: center;
`;

const AccordionContainer = styled.div`
  margin-top: 60px;
  backdrop-filter: blur(10px);
  background: rgba(13, 14, 30, 0.2);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 0 30px rgba(78, 227, 255, 0.1);
  border: 1px solid rgba(78, 227, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 0 40px rgba(78, 227, 255, 0.2);
  }
  
  .accordion-item {
    border: none !important;
    border-bottom: 1px solid rgba(78, 227, 255, 0.1) !important;
    background: transparent !important;
    transition: all 0.3s ease;
    
    &:last-child {
      border-bottom: none !important;
    }
    
    .accordion-header .accordion-button {
      background: transparent !important;
      color: #fff;
      font-weight: 700;
      text-shadow: 0 0 5px rgba(78, 227, 255, 0.3);
      transition: all 0.3s ease;
      
      &:hover {
        color: #4ee3ff;
        text-shadow: 0 0 10px rgba(78, 227, 255, 0.6);
      }
      
      &:focus {
        box-shadow: none;
      }
      
      &::after {
        color: #4ee3ff;
        filter: drop-shadow(0 0 5px rgba(78, 227, 255, 0.5));
      }
    }
    
    .accordion-body {
      background: rgba(13, 14, 30, 0.3);
      border-radius: 0 0 10px 10px;
      
      p {
        color: rgba(255, 255, 255, 0.9);
      }
      
      a {
        background: linear-gradient(90deg, #4ee3ff, #6b73ff);
        color: #0d0e1e;
        border: none;
        padding: 10px 20px;
        border-radius: 30px;
        display: inline-block;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 0 15px rgba(78, 227, 255, 0.3);
        margin-top: 20px;
        
        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(78, 227, 255, 0.4);
        }
      }
    }
  }
  
  .flat-toggle {
    border-top: 1px solid rgba(78, 227, 255, 0.1);
    padding: 25px 0;
    position: relative;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(78, 227, 255, 0.05);
    }
    
    &:first-child {
      border-top: none;
    }
    
    .toggle-title {
      margin-bottom: 0;
      position: relative;
      color: #fff;
      font-weight: 600;
      padding: 10px 15px;
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:hover {
        color: #4ee3ff;
        text-shadow: 0 0 10px rgba(78, 227, 255, 0.6);
      }
      
      &::after {
        position: absolute;
        right: 10px;
        font-family: "Font Awesome 6 Free";
        font-weight: 700;
        content: "\f107";
        font-size: 20px;
        color: #4ee3ff;
        text-shadow: 0 0 10px rgba(78, 227, 255, 0.4);
      }
    }
    
    .toggle-content {
      margin-top: 22px;
      padding: 0 15px;
      display: none;
      animation: fadeIn 0.5s ease;
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      p {
        font-size: 18px;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.6;
      }
      
      a {
        background: linear-gradient(90deg, #4ee3ff, #6b73ff);
        color: #0d0e1e;
        border: none;
        padding: 8px 18px;
        border-radius: 30px;
        display: inline-block;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s ease;
        box-shadow: 0 0 15px rgba(78, 227, 255, 0.3);
        margin-top: 15px;
        
        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(78, 227, 255, 0.5);
        }
      }
    }
    
    &.active {
      .toggle-title {
        color: #4ee3ff;
        text-shadow: 0 0 10px rgba(78, 227, 255, 0.6);
        
        &::after {
          content: "\f106";
        }
      }
    }
  }
`;

Faq.propTypes = {
    
};

function Faq(props) {
    return (
        <div>
            <PageTitle heading='FAQ' title='FAQ' />

            <FaqContainer className="faq">
              <div className="container">
                <div className="row">
                  <div className="col-md-12">
                    <div className="block-text center">
                      <HeaderText className="heading">Frequently Asked Questions</HeaderText>
                      <Description className="desc fs-20">Learn how to get started</Description>
                    </div>
                  </div>
                  <div className="col-md-12">
                    <AccordionContainer className="flat-accordion">
                      {
                        dataFaq.map(idx => (
                          <Accordion key={idx.id} title={idx.title} show={idx.show}>
                            <p className="toggle-content">{idx.text}</p>
                            <Link to="#">Learn more</Link>
                          </Accordion>
                        ))
                      }
                    </AccordionContainer>
                  </div>
                </div>
              </div>
            </FaqContainer>

            <Sale01 />
        </div>
    );
}

export default Faq;