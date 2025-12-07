# Weather App
## Running
### 1. Get API key
(If you don't have one)
Go to [AccuWeather Developer](https://developer.accuweather.com/) and create new account with free trial. 
Create an app and copy your API key.
### 2. Create api_keys.jsx file
Create a new file named `api_keys.jsx` in the `src` folder of the project with the following content:
```jsx
export const API_KEY = "YOUR_API_KEY_HERE";
export default API_KEY;
```
Replace `YOUR_API_KEY_HERE` with the API key you obtained from AccuWeather.
### 3. Start the application
In the project directory, run:
```bash
npm install
npm run dev
```
This will start the development server. Open [http://localhost:5173](http://localhost:5173) to view it in your browser.
