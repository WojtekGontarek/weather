import "bootstrap/dist/css/bootstrap.css";
import {useEffect, useState} from "react";
import CityCard from "./CityCard.jsx";
import API_KEY from "./api_keys.jsx";

function Home() {
    const testMode = false; // Set to true to disable autocomplete API calls for testing purposes

    const [nameInput, setNameInput] = useState("");
    // Load saved cities from localStorage using lazy initializer to avoid setting state inside an effect
    const [cities, setCities] = useState(() => {
        try {
            const raw = localStorage.getItem('cities');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (err) {
            console.log('Error reading cities from localStorage', err);
        }
        return [];
    });
    const [suggestedCities, setSuggestedCities] = useState([]);
    const [isAdding, setIsAdding] = useState(false);

    // Persist cities to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('cities', JSON.stringify(cities));
        } catch (err) {
            console.log('Error saving cities to localStorage', err);
        }
    }, [cities]);

    // Remove city by key
    function removeCity(key) {
        if (!key) return;
        setCities(prev => prev.filter(c => c.key !== key));
    }

    function handleInputChange(e) {
        const value = e.target.value;
        setNameInput(value);
    }

    useEffect(() => {
        if (testMode) return;
        const timeOut = setTimeout(() => {
            const requestUrl = "https://dataservice.accuweather.com/locations/v1/cities/autocomplete";
            const fetchUrl = `${requestUrl}?q=${encodeURIComponent(nameInput)}&language=pl-pl`;

            const requestOptions = {
                method: "GET",
                redirect: "follow",
                headers: {
                    Authorization: `Bearer ${API_KEY}`
                }
            };

            fetch(fetchUrl, requestOptions)
                .then(response => response.json())
                .then(result => {
                    setSuggestedCities(result);
                })
                .catch(error => console.log("error", error));
        }, 500)
        return () => clearTimeout(timeOut);
    }, [nameInput, testMode]);

    function handleClickSuggestion(e, city) {
        setNameInput(city.LocalizedName);
        setSuggestedCities([]);
    }

    async function handleAddCity() {
        setIsAdding(true);
        try {
            const name = nameInput.trim().toLowerCase();
            const weatherRequestOptions = {
                method: "GET",
                redirect: "follow",
                headers: {
                    Authorization: `Bearer ${API_KEY}`
                }
            };
            const weatherRequestUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?q=${encodeURIComponent(name)}&language=pl-pl`;
            let englishName = null;
            const weatherResponse = await fetch(weatherRequestUrl, weatherRequestOptions);
            const weatherData = await weatherResponse.json();
            if (weatherData && weatherData.length > 0) {
                englishName = weatherData[0].EnglishName;
            } else {
                console.log("Nie znaleziono miasta w AccuWeather");
                return;
            }

            if (!englishName) {
                console.log("Brak angielskiej nazwy miasta, nie można kontynuować.");
                return;
            }

            // Getting photos and conditions from AccuWeather (currentconditions?getPhotos=true)
            let photoUrl = null;
            let conditionsObj = null;
            try {
                const locationKey = weatherData[0].Key;
                const queryUrl = `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?language=pl-pl&getPhotos=true`;
                const response = await fetch(queryUrl, weatherRequestOptions);
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    const first = data[0];
                    conditionsObj = first;
                    if (first && Array.isArray(first.Photos) && first.Photos.length > 0) {
                        const p = first.Photos[0];
                        photoUrl = p.LandscapeLink || p.PortraitLink || null;
                    }
                }
            } catch (errPhotos) {
                console.log("Błąd pobierania zdjęć/warunków z AccuWeather:", errPhotos);
            }

            const newCity = {
                name: name,
                key: weatherData[0].Key,
                accuwData: weatherData,
                photoUrl: photoUrl,
                conditions: conditionsObj
            };
            setCities(prev => [...prev, newCity]);
            setNameInput("");
            setSuggestedCities([]);
        } catch (error) {
            console.log("error", error);
        } finally {
            setIsAdding(false);
        }
    }

    return (
        <div className={"container align-content-center mt-5 w-100"}>
            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Wpisz nazwę miasta"
                    aria-label="Wpisz nazwę miasta"
                    aria-describedby="add_button"
                    value={nameInput}
                    onChange={handleInputChange}
                    disabled={isAdding}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!isAdding && nameInput.trim() !== '') {
                                handleAddCity();
                            }
                        }
                    }}
                />
                <button
                    className="btn btn-outline-primary"
                    type="button"
                    id="add_button"
                    onClick={handleAddCity}
                    disabled={isAdding}
                >
                    {isAdding ? 'Dodawanie...' : 'Dodaj miasto'}
                </button>
            </div>
            <div className={"suggested-cities-list"}>
                {suggestedCities && suggestedCities.length > 0 && (
                    <ul className="list-group">
                        {suggestedCities.map(city => (
                            <li className="list-group-item" key={city.Key || city.LocalizedName} onClick={(e) => handleClickSuggestion(e, city)}>
                                {city.LocalizedName}{city.Country ? `, ${city.Country.ID}` : ""}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className={"cities-list d-flex flex-wrap gap-3 mt-4"}>
                {cities.map((city, index) => (
                    <CityCard key={city.key || index} city={city} onDelete={() => removeCity(city.key)} />
                ))}
            </div>
        </div>
    );
}

export default Home;
