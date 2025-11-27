import API_KEY from "./api_keys.jsx";
import {useEffect, useState} from "react";

function CityCard({ city }) {
    const [conditions, setConditions] = useState({})

    useEffect(() => {
        const requestUrl = `https://dataservice.accuweather.com/currentconditions/v1/${city.key}?language=pl-pl&getPhotos=true`
        const requestOptions = {
            method: "GET",
            redirect: "follow",
            headers: {
                Authorization: `Bearer ${API_KEY}`
            }
        }
        fetch(requestUrl, requestOptions)
            .then(response => response.json())
            .then(result => {

            })
    })

    return (
        <div className="card mb-3">
            <img src={city.wikiImageUrl} className="card-img-top" alt="..."/>
            <div className="card-body">
                <h5 className="card-title">{city.name}</h5>
                <p className="card-text">Temperature: {city.temperature}°C</p>
                <p className="card-text">Weather: {city.weatherText}</p>
            </div>
        </div>

    );
}

export default CityCard;