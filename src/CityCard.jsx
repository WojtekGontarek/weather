import API_KEY from "./api_keys.jsx";
import {useEffect, useState, useCallback} from "react";
import {Link} from "react-router-dom";

function CityCard({ city, onDelete }) {
    // Prefer using stored conditions if present to avoid extra API calls
    const [conditions, setConditions] = useState(city?.conditions || null);
    const [isLoading, setIsLoading] = useState(false);
    const key = city?.key;
    const storedEpoch = city?.conditions?.EpochTime || null;

    const fetchAndPersist = useCallback(async (force = false) => {
        if (!key) return;

        const TTL_SECONDS = 3600;
        const nowSec = Date.now() / 1000;
        const age = storedEpoch ? (nowSec - storedEpoch) : Infinity;

        // If not forced, and we have stored conditions, and they're fresh, skip fetching to save on API calls
        if (!force && storedEpoch && age < TTL_SECONDS) {
            return;
        }

        setIsLoading(true);
        try {
            const requestUrl = `https://dataservice.accuweather.com/currentconditions/v1/${key}?language=pl-pl&getPhotos=true`;
            const requestOptions = {
                method: "GET",
                redirect: "follow",
                headers: {
                    Authorization: `Bearer ${API_KEY}`
                }
            };
            const res = await fetch(requestUrl, requestOptions);
            const result = await res.json();
            if (Array.isArray(result) && result.length > 0) {
                const first = result[0];
                setConditions(first);

                // persist to localStorage
                try {
                    const raw = localStorage.getItem('cities');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) {
                            const updated = parsed.map(c => {
                                if (c.key === key) {
                                    const updatedCity = { ...c };
                                    updatedCity.conditions = first;
                                    if (Array.isArray(first.Photos) && first.Photos.length > 0) {
                                        const p = first.Photos[0];
                                        updatedCity.photoUrl = p.LandscapeLink || p.PortraitLink || updatedCity.photoUrl || null;
                                    }
                                    return updatedCity;
                                }
                                return c;
                            });
                            localStorage.setItem('cities', JSON.stringify(updated));
                        }
                    }
                } catch (err) {
                    console.log('Error updating city in localStorage', err);
                }
            } else {
                setConditions(result);
            }
            console.log("fetch currentconditions result:", result);
        } catch (err) {
            console.log("fetch currentconditions error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [key, storedEpoch]);

    useEffect(() => {
        if (!key) return;
        fetchAndPersist(false);
    }, [fetchAndPersist, key]);

    const temp = conditions?.Temperature?.Metric?.Value;
    const weatherText = conditions?.WeatherText;

    // Use photo from conditions if present, otherwise fallback to city.photoUrl
    const photoFromConditions = (conditions && Array.isArray(conditions.Photos) && conditions.Photos.length > 0)
        ? (conditions.Photos[0].LandscapeLink || conditions.Photos[0].PortraitLink)
        : null;
    const photo = photoFromConditions || city.photoUrl || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

    // Build weather icon URL from WeatherIcon number
    const weatherIconNumber = conditions?.WeatherIcon ? String(conditions.WeatherIcon) : null;
    const weatherIconUrl = weatherIconNumber ? `https://www.accuweather.com/assets/images/weather-icons/v2a/${weatherIconNumber}.svg` : null;

    return (
        <div className="card mb-3" style={{ position: 'relative', width: '18rem' }}>
            {weatherIconUrl && (
                <img
                    src={weatherIconUrl}
                    alt={weatherText || 'weather icon'}
                    title={weatherText || ''}
                    style={{ position: 'absolute', top: 8, left: 8, width: 40, height: 40, zIndex: 5 }}
                />
            )}

            <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => fetchAndPersist(true)}
                disabled={isLoading}
                style={{ position: 'absolute', top: 8, right: 8, zIndex: 6 }}
                title={isLoading ? 'Loading...' : 'Refresh'}
            >
                {isLoading ? '...' : '⟳'}
            </button>

            <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => onDelete && onDelete()}
                disabled={isLoading}
                aria-label="Delete city"
                title="Delete city"
                style={{ position: 'absolute', top: 8, right: 48, zIndex: 6 }}
            >
                🗑
            </button>

            <img src={photo} className="card-img-top" alt={city.name}/>
            <div className="card-body">
                <h5 className="card-title" style={{textTransform: "capitalize"}}>{city.name}</h5>
                <p className="card-text">Temperatura: {temp !== undefined ? `${temp}°C` : "—"}</p>
                <p className="card-text">Pogoda: {weatherText ?? "—"}</p>
                <p className={"card-text"}><Link to={`/city/${city.key}`}>Pokaż więcej</Link></p>
            </div>
        </div>
    );
}

export default CityCard;
