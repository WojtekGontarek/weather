
function CityCard({ city }) {
    return (
        <div className="card mb-3">
            <div className="card-body">
                <h5 className="card-title">{city.LocalizedName}</h5>
                <p className="card-text">Temperature: {city.temperature}°C</p>
                <p className="card-text">Weather: {city.weatherText}</p>
            </div>
        </div>
    );
}
export default CityCard;