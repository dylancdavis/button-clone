import { useState } from "react";
import "./App.css";

function App() {
  const [colorTicks, setColorTicks] = useState(0);
  const maxTicks = 100;

  function tickColor() {
    if (colorTicks === maxTicks) return;
    setColorTicks(colorTicks + 1);
  }

  function tickProgress() {
    return colorTicks / maxTicks;
  }

  function getColorProgress(unitInterval) {
    if (unitInterval > 1 || unitInterval < 0) return;

    const firstThreshold = 0.7;
    const secondThreshold = 0.8;

    if (unitInterval < firstThreshold) {
      const scaledPercent = unitInterval / firstThreshold;
      return {
        hue: scaledPercent * 320,
        saturation: 100,
        lightness: 50,
      };
    }
    if (unitInterval < secondThreshold) {
      const scaledPercent =
        (unitInterval - firstThreshold) / (secondThreshold - firstThreshold);
      return {
        hue: 320,
        saturation: 100,
        lightness: 50 + scaledPercent * 50,
      };
    }
    const scaledPercent =
      (unitInterval - secondThreshold) / (1 - secondThreshold);
    return {
      hue: 320,
      saturation: 100,
      lightness: 100 - scaledPercent * 100,
    };
  }

  function toHslString({ hue, saturation, lightness }) {
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  return (
    <div className="App">
      <div className="content">
        <h1>Color Circle</h1>
        <div className="color-circle-wrapper">
          <div
            onClick={tickColor}
            className="color-circle"
            style={{
              backgroundColor: toHslString(getColorProgress(tickProgress())),
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default App;