import {useParams, Link} from "react-router-dom";
import {useEffect, useState, useCallback, useRef} from "react";
import API_KEY from "./api_keys.jsx";
import Chart from 'chart.js/auto';

function DetView() {
    const cityId = useParams().cityId;
    const [city, setCity] = useState(null);
    const [historical, setHistorical] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    // Load city from localStorage by name or key
    useEffect(() => {
        try {
            const raw = localStorage.getItem('cities');
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return;
            const found = parsed.find(c => (c.name && String(c.name) === String(cityId)) || (c.key && String(c.key) === String(cityId)));
            if (found) setCity(found);
        } catch (err) {
            console.log('Error reading city from localStorage', err);
        }
    }, [cityId]);

    // Fetch historical 24h data for city's locationKey - made reusable for manual refresh
    const fetchHistorical = useCallback(async () => {
        if (!city || !city.key) return;
        setIsLoading(true);
        setError(null);
        const baseUrl = `https://dataservice.accuweather.com/currentconditions/v1/${city.key}/historical/24`;

        try {
            // Attempt with Authorization header first
            const headerOptions = {
                method: 'GET',
                headers: { Authorization: `Bearer ${API_KEY}` }
            };
            let response = null;
            try {
                response = await fetch(`${baseUrl}?language=pl-pl`, headerOptions);
            } catch (errHeader) {
                // network error for header attempt, try other method
                console.warn('Header fetch failed:', errHeader);
                response = null;
            }

            // If header attempt failed or returned non-ok, try apikey query param
            if (!response || !response.ok) {
                try {
                    response = await fetch(`${baseUrl}?language=pl-pl&apikey=${encodeURIComponent(API_KEY)}`);
                } catch (errQuery) {
                    // both attempts failed
                    console.warn('Query param fetch failed:', errQuery);
                    setError(errQuery.message || String(errQuery));
                    setHistorical([]);
                    setIsLoading(false);
                    return;
                }
            }

            if (!response.ok) {
                const msg = `HTTP ${response.status}`;
                setError(msg);
                setHistorical([]);
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            setHistorical(Array.isArray(data) ? data : []);
        } catch (err) {
            console.log('Error fetching historical data', err);
            setError(err.message || String(err));
            setHistorical([]);
        } finally {
            setIsLoading(false);
        }
    }, [city]);

    useEffect(() => {
        // initial fetch when city page is loaded
        if (!city) return;
        fetchHistorical();
    }, [city, fetchHistorical]);

    // Draw chart when historical changes
    useEffect(() => {
        if (!historical || historical.length === 0) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
            return;
        }

        const labels = historical.map(h => {
            if (h.LocalObservationDateTime) return new Date(h.LocalObservationDateTime).toLocaleString(undefined, {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
            if (h.EpochTime) return new Date(h.EpochTime * 1000).toLocaleString(undefined, {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
            return '';
        }).reverse();

        const temps = historical.map(h => h.Temperature?.Metric?.Value).reverse();

        const ctx = chartRef.current && chartRef.current.getContext('2d');
        if (!ctx) return;

        // cleanup previous
        if (chartInstanceRef.current) chartInstanceRef.current.destroy();

        chartInstanceRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Temperatura (°C)',
                    data: temps,
                    fill: false,
                    borderColor: 'rgba(75,192,192,1)',
                    tension: 0.2,
                    pointRadius: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: false }
                }
            }
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [historical]);

    // Helper to format timestamp from EpochTime (seconds)
    const formatTime = (item) => {
        if (!item) return '';
        const opts = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        if (item.LocalObservationDateTime) return new Date(item.LocalObservationDateTime).toLocaleString(undefined, opts);
        if (item.EpochTime) return new Date(item.EpochTime * 1000).toLocaleString(undefined, opts);
        return '';
    };

    if (!city) {
        return (
            <div className="container mt-4">
                <p>Nie znaleziono danych dla miasta: <strong>{cityId}</strong></p>
                <p><Link to="/">Powrót do strony głównej</Link></p>
            </div>
        );
    }

    const current = city.conditions || null;
    const temp = current?.Temperature?.Metric?.Value;
    const weatherText = current?.WeatherText;
    const photo = (current && Array.isArray(current.Photos) && current.Photos.length > 0)
        ? (current.Photos[0].LandscapeLink || current.Photos[0].PortraitLink)
        : city.photoUrl || null;
    const weatherIconNumber = current?.WeatherIcon ? String(current.WeatherIcon) : null;
    const weatherIconUrl = weatherIconNumber ? `https://www.accuweather.com/assets/images/weather-icons/v2a/${weatherIconNumber}.svg` : null;

    return (
        <div className="container mt-4">
            <div className="d-flex align-items-center mb-3">
                <p className="mb-0"><Link to="/">← Powrót</Link></p>
                <h2 className="mb-0 ms-3" style={{textTransform: 'capitalize'}}>{city.name}</h2>
                <div className="ms-auto">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={fetchHistorical} disabled={isLoading}>
                        {isLoading ? 'Ładowanie...' : 'Odśwież dane historyczne'}
                    </button>
                    <a className="btn btn-sm btn-outline-secondary" href={current?.MobileLink || current?.Link || '#'} target="_blank" rel="noreferrer">Otwórz AccuWeather</a>
                </div>
            </div>

            <div className="card mb-3" style={{maxWidth: 720}}>
                <div className="row g-0">
                    {photo && (
                        <div className="col-md-4">
                            <img src={photo} className="img-fluid rounded-start" alt={city.name} />
                        </div>
                    )}
                    <div className={photo ? 'col-md-8' : 'col-md-12'}>
                        <div className="card-body">
                            <h5 className="card-title">Aktualna pogoda</h5>
                            {weatherIconUrl && (<img src={weatherIconUrl} alt={weatherText} style={{width:40,height:40}} />)}
                            <p className="card-text">{weatherText ?? '—'}</p>
                            <p className="card-text">Temperatura: {temp !== undefined ? `${temp}°C` : '—'}</p>
                            <p className="card-text"><small className="text-muted">Ostatnia aktualizacja: {formatTime(current)}</small></p>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h4>Dane historyczne (ostatnie 24h)</h4>
                {/* Loading skeleton */}
                {isLoading && (
                    <>
                        <div className="card mb-3" aria-hidden="true">
                            <div className="card-body">
                                <h5 className="placeholder-glow"><span className="placeholder col-6"></span></h5>
                                <p className="placeholder-glow"><span className="placeholder col-7"></span></p>
                            </div>
                        </div>
                        <ul className="list-group">
                            {[...Array(6)].map((_, i) => (
                                <li className="list-group-item placeholder-glow" key={i}>
                                    <span className="placeholder col-4"></span>
                                    <span className="placeholder col-6 ms-3"></span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                {error && <p className="text-danger">Błąd podczas pobierania danych: {error}</p>}

                {!isLoading && !error && historical && historical.length === 0 && (
                    <p>Brak dostępnych danych historycznych.</p>
                )}

                {!isLoading && !error && historical && historical.length > 0 && (
                    <>
                        <div style={{height: 240}} className="mb-3">
                            <canvas ref={chartRef}></canvas>
                        </div>
                        <ul className="list-group" style={{height: '300px', overflowY: 'scroll'}}>
                            {historical.slice().map((h, idx) => (
                                <li className="list-group-item" key={idx}>
                                    <div><strong>{formatTime(h)}</strong></div>
                                    <div>{h.WeatherText ?? ''} — {h.Temperature?.Metric?.Value !== undefined ? `${h.Temperature.Metric.Value}°C` : ''}</div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </div>
    )
}

export default DetView;
