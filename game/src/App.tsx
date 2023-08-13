import "bootstrap/dist/css/bootstrap.min.css"

import Game from './Game'

import './App.css'

function App(props: { username: string, classType: string }) {
    
    return (
        <>
            <Game username={props.username} classType={props.classType} />
        </>
    )
}


export default App