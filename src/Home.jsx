import "bootstrap/dist/css/bootstrap.css";
import { useState } from "react";
import CityCard from "./CityCard.jsx";

function Home() {
    const API_KEY = "zpka_3aba0f05ae8247e8b90a06d1d29f7d07_8fdc1727";
    const testMode = true;

    const [nameInput, setNameInput] = useState("");
    const [cities, setCities] = useState([]);
    const [suggestedCities, setSuggestedCities] = useState([]);

    function handleInputChange(e) {
        const value = e.target.value;
        setNameInput(value);
        if (testMode) return;
        const requestUrl = "https://dataservice.accuweather.com/locations/v1/cities/autocomplete";
        const fetchUrl = `${requestUrl}?q=${encodeURIComponent(value)}&language=pl-pl`;

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
                // zaktualizuj stan wynikami wyszukiwania
                setSuggestedCities(result);
            })
            .catch(error => console.log("error", error));
    }

    function handleClickSuggestion(e, city) {
        setNameInput(city.LocalizedName);
        setSuggestedCities([]);
    }

    async function handleAddCity() {
        const weatherRequestOptions = {
            method: "GET",
            redirect: "follow",
            headers: {
                Authorization: `Bearer ${API_KEY}`
            }
        };
        const weatherRequestUrl = `https://dataservice.accuweather.com/locations/v1/cities/search?q=${encodeURIComponent(nameInput)}&language=pl-pl`;
        let englishName = null;
        const weatherResponse = await fetch(weatherRequestUrl, weatherRequestOptions);
        const weatherData = await weatherResponse.json();
        if (weatherData && weatherData.length > 0) {
            englishName = weatherData[0].EnglishName;
        } else {
            console.log("Nie znaleziono miasta w AccuWeather");
            return;
        }
        try {
            if (!englishName) {
                console.log("Brak angielskiej nazwy miasta, nie można kontynuować.");
                return;
            }
            const wikiUrl = "https://en.wikipedia.org/w/api.php";
            // 1) Pobierz listę obrazów dla strony
            const params1 = new URLSearchParams({
                action: "query",
                titles: nameInput,
                format: "json",
                prop: "images",
                imlimit: "1",
                origin: "*"
            });
            const res1 = await fetch(`${wikiUrl}?${params1.toString()}`);
            const data1 = await res1.json();

            // Wyciągnij pierwszy tytuł pliku, jeśli istnieje
            let imageTitle = null;
            if (data1.query && data1.query.pages) {
                const page = Object.values(data1.query.pages)[0];
                if (page && page.images && page.images.length > 0) {
                    imageTitle = page.images[0].title; // np. "File:Example.jpg"
                }
            }
            console.log(data1);
            // 2) Jeśli mamy tytuł pliku, pobierz jego URL
            let imageUrl = null;
            if (imageTitle) {
                const params2 = new URLSearchParams({
                    action: "query",
                    titles: imageTitle,
                    prop: "imageinfo",
                    iiprop: "url",
                    format: "json",
                    origin: "*"
                });
                const res2 = await fetch(`${wikiUrl}?${params2.toString()}`);
                const data2 = await res2.json();

                if (data2.query && data2.query.pages) {
                    const page2 = Object.values(data2.query.pages)[0];
                    if (page2 && page2.imageinfo && page2.imageinfo.length > 0) {
                        imageUrl = page2.imageinfo[0].url;
                    }
                }
            }

            const newCity = {
                name: nameInput,
                wikiData: data1,
                wikiImageUrl: imageUrl
            };
            setCities([...cities, newCity]);
            setNameInput("");
            setSuggestedCities([]);
        } catch (error) {
            console.log("error", error);
        }
        console.log(cities);
    }


    return (
        <div className={"container align-content-center mt-5"}>
            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Wpisz nazwę miasta"
                    aria-label="Wpisz nazwę miasta"
                    aria-describedby="add_button"
                    value={nameInput}
                    onChange={handleInputChange}
                />
                <button
                    className="btn btn-outline-primary"
                    type="button"
                    id="add_button"
                    onClick={handleAddCity}
                >
                    Dodaj miasto
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
            <div className={"cities-list"}>
                {cities.map((city, index) => (
                    <CityCard key={index} city={city} />
                ))}
            </div>
        </div>
    );
}

export default Home;
