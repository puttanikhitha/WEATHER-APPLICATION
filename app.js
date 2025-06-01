
const apiKey = "YOUR_API_KEY"; // Replace with your OpenWeatherMap API key
let currentUnit = "metric"; // Default: Celsius

const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("searchBtn");
const geoBtn = document.getElementById("geoBtn");
const weatherInfo = document.getElementById("weatherInfo");
const forecastContainer = document.getElementById("forecast");
const unitToggle = document.getElementById("unitToggle");
const darkToggle = document.getElementById("darkToggle");
const loading = document.getElementById("loading");

const chartCtx = document.getElementById("tempChart").getContext("2d");
let tempChart;

// 🌐 Fetch Weather Data
async function fetchWeather(city) {
  loading.classList.remove("hidden");
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=\${city}&units=\${currentUnit}&appid=\${apiKey}\`
    );
    const data = await res.json();
    if (data.cod !== 200) throw new Error(data.message);
    updateCurrentWeather(data);
    fetchForecast(city);
  } catch (err) {
    weatherInfo.innerHTML = \`<p>Error: \${err.message}</p>\`;
    forecastContainer.innerHTML = "";
  } finally {
    loading.classList.add("hidden");
  }
}

// 📍 Geolocation
geoBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const res = await fetch(
        \`https://api.openweathermap.org/data/2.5/weather?lat=\${latitude}&lon=\${longitude}&units=\${currentUnit}&appid=\${apiKey}\`
      );
      const data = await res.json();
      updateCurrentWeather(data);
      fetchForecast(data.name);
    });
  }
});

// 📅 Fetch Forecast
async function fetchForecast(city) {
  const res = await fetch(
    \`https://api.openweathermap.org/data/2.5/forecast?q=\${city}&units=\${currentUnit}&appid=\${apiKey}\`
  );
  const data = await res.json();
  updateForecast(data);
}

// 🖼️ Update Current Weather
function updateCurrentWeather(data) {
  const temp = data.main.temp;
  const desc = data.weather[0].description;
  const icon = data.weather[0].icon;
  const name = data.name;
  weatherInfo.innerHTML = \`
    <img src="https://openweathermap.org/img/wn/\${icon}@2x.png" alt="\${desc}" />
    <h2>\${name}</h2>
    <h3>\${temp}° \${currentUnit === "metric" ? "C" : "F"}</h3>
    <p>\${desc}</p>
  \`;
  saveOfflineData({ data });
}

// 🧊 Update Forecast
function updateForecast(data) {
  const daily = data.list.filter((item, index) => index % 8 === 0);
  forecastContainer.innerHTML = "";
  const labels = [];
  const temps = [];

  daily.forEach((item) => {
    const date = new Date(item.dt_txt);
    const temp = item.main.temp;
    const icon = item.weather[0].icon;
    const desc = item.weather[0].description;

    forecastContainer.innerHTML += \`
      <div class="card">
        <h4>\${date.toDateString().slice(0, 10)}</h4>
        <img src="https://openweathermap.org/img/wn/\${icon}.png" />
        <p>\${temp}°</p>
        <p>\${desc}</p>
      </div>
    \`;

    labels.push(date.toDateString().slice(4, 10));
    temps.push(temp);
  });

  updateChart(labels, temps);
}

// 📊 Chart Update
function updateChart(labels, data) {
  if (tempChart) tempChart.destroy();
  tempChart = new Chart(chartCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Temperature Trend",
        data: data,
        backgroundColor: "rgba(248, 181, 0, 0.2)",
        borderColor: "#f8b500",
        borderWidth: 2,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: { color: getComputedStyle(document.body).color }
        },
        x: {
          ticks: { color: getComputedStyle(document.body).color }
        }
      }
    }
  });
}

// 🌗 Dark Mode Toggle
darkToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark");
});

// 🌡️ Unit Toggle
unitToggle.addEventListener("click", () => {
  currentUnit = currentUnit === "metric" ? "imperial" : "metric";
  const city = cityInput.value;
  if (city) fetchWeather(city);
});

// 🔍 Search Event
searchBtn.addEventListener("click", () => {
  const city = cityInput.value;
  if (city) fetchWeather(city);
});

// 💾 Save Offline
function saveOfflineData(data) {
  localStorage.setItem("weatherData", JSON.stringify(data));
}

// 🔁 Load from localStorage
window.addEventListener("load", () => {
  const cached = localStorage.getItem("weatherData");
  if (cached) {
    const { data } = JSON.parse(cached);
    updateCurrentWeather(data);
    fetchForecast(data.name);
  }
  }
