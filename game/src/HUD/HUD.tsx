import React, { useState, useEffect } from 'react';

interface HUDProps {
    isGameLoading: boolean;
    currentHealth: number;
    currentMana: number;
}

const HUD: React.FC<HUDProps> = ({ isGameLoading, currentHealth, currentMana }) => {
    const [health, setHealth] = useState(currentHealth);
    const [mana, setMana] = useState(currentMana);
  
    // Update state when props change
    useEffect(() => {
        setHealth(currentHealth);
        setMana(currentMana);
    }, [currentHealth, currentMana]);

    if(isGameLoading) {
        return <div style={{ backgroundColor: 'rgba(30,30,30,0.7)', width: `100vw`, height: `100vh`, position: 'absolute', top: 0, left: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <h1>Loading game</h1>
            <div className="spinner-border" role="status">
            </div>
        </div>;
    }

    return (

        <div style={{ position: 'absolute', bottom: "5%", left: "50%", width: '40%', height: '10%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transform: 'translate(-50%, 0)' }}>
            <div className='health-bar' style={{ width: `${health}%`, height:"100%", backgroundImage: "url('https://img1.picmix.com/output/stamp/normal/3/8/7/9/859783_9a17e.gif')", backgroundColor: 'red' }}></div>
            <div className='mana-bar' style={{ width: `${mana}%`, height:"100%", backgroundImage: "url('https://img1.picmix.com/output/stamp/normal/3/8/7/9/859783_9a17e.gif')", backgroundColor: 'blue' }}></div>
            {/* style  */}
            <style>{`
                @keyframes bubble {
                    0% {
                      box-shadow: 0 0;
                      opacity: 1;
                    }
                    100% {
                      box-shadow: 0 20px;
                      opacity: 0;
                    }
                  }
                  
                  .health-bar, .mana-bar {
                    position: relative;
                    overflow: hidden;
                    // background-image: linear-gradient(to bottom, #f00, #f00 50%, #000 50%, #000); https://img1.picmix.com/output/stamp/normal/3/8/7/9/859783_9a17e.gif
                    background-image: url('https://i.stack.imgur.com/kx8MT.gif');
                    background-size: 100% 200%;
                    background-position: 0 0;
                    transition: background-position 0.5s;
                    opacity: 0.7;
                  }
                  
                  .health-bar::after, .mana-bar::after {
                    content: "";
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 60%);
                    animation: bubble 1s infinite;
                  }
            `}</style>
        </div>
    );
};

export default HUD;