import {BrowserRouter, Routes, Route} from 'react-router-dom'
import './App.css'
import Home from "./Home.jsx";
import DetView from "./DetView.jsx";

function App() {

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home/>} />
                <Route path="/city/:cityId" element={<DetView/>} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
