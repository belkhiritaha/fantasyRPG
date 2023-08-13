import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import Game from './Game.tsx'
import './index.css'
import MainScreen from './MainScreen.tsx'

const Menu = () => {
    const [menu, setMenu] = React.useState("main");
    const [classType, setClassType] = React.useState("");
    const [username, setUsername] = React.useState("");

    return (
        menu === "main" ? <MainScreen setMenu={setMenu} setClassType={setClassType} setUsername={setUsername} username={username} classType={classType} /> : <App username={username} classType={classType} />
    )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <>
        <Menu />
    </>
)
